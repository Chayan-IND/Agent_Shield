const { read, write, newId } = require("../db");

// Risk rules, checked in order
function evaluate(agent, recipient, amount) {
  if (!agent) return { decision: "BLOCKED", reason: "Unknown agent identity" };
  if (!agent.isActive) return { decision: "BLOCKED", reason: "Agent is deactivated" };
  if (amount > agent.spendingLimit)
    return { decision: "BLOCKED", reason: `Amount exceeds limit of ₹${agent.spendingLimit}` };
  if (!agent.trustedRecipients.includes(recipient.toLowerCase()))
    return { decision: "PAUSED", reason: "Unknown recipient - needs manual review" };
  return { decision: "APPROVED", reason: "Passed all checks" };
}

// Simple risk score (0-100) plus anomaly flag
function computeRisk(db, agent, recipient, amount) {
  if (!agent) return { riskScore: 100, riskFactors: ["Unknown agent identity"], anomaly: false };
  if (!agent.isActive) return { riskScore: 100, riskFactors: ["Agent is deactivated"], anomaly: false };

  let score = 0;
  const factors = [];

  // 1. Amount compared to the spending limit
  const pct = (amount / agent.spendingLimit) * 100;
  if (pct > 100) {
    score += 50;
    factors.push(`Amount is ${Math.round(pct)}% of limit (over limit)`);
  } else if (pct >= 80) {
    score += 30;
    factors.push(`Amount is ${Math.round(pct)}% of limit`);
  } else if (pct >= 50) {
    score += 15;
    factors.push(`Amount is ${Math.round(pct)}% of limit`);
  }

  // 2. Unknown recipient
  if (!agent.trustedRecipients.includes(recipient.toLowerCase())) {
    score += 30;
    factors.push("Unknown recipient");
  }

  // 3. Many transactions in a short time (last 10 minutes)
  const past = db.transactions.filter((t) => t.agent === agent._id);
  const now = Date.now();
  const recent = past.filter((t) => now - new Date(t.createdAt).getTime() < 10 * 60 * 1000).length;
  if (recent >= 5) {
    score += 25;
    factors.push(`${recent} transactions in the last 10 minutes`);
  } else if (recent >= 3) {
    score += 15;
    factors.push(`${recent} transactions in the last 10 minutes`);
  }

  // 4. Anomaly: amount much higher than this agent's average
  let anomaly = false;
  const counted = past.filter((t) => t.decision !== "BLOCKED");
  if (counted.length >= 3) {
    const avg = counted.reduce((sum, t) => sum + t.amount, 0) / counted.length;
    if (amount > avg * 3) {
      anomaly = true;
      score += 25;
      factors.push(`Amount is ${(amount / avg).toFixed(1)}x the agent's average (₹${Math.round(avg)})`);
    }
  }

  return { riskScore: Math.min(score, 100), riskFactors: factors, anomaly };
}

exports.createTransaction = (req, res) => {
  const { agentId, recipient } = req.body;
  const amount = Number(req.body.amount);

  if (!agentId) return res.status(400).json({ message: "Please select an agent" });
  if (!recipient || !recipient.trim()) return res.status(400).json({ message: "Recipient is required" });
  if (!amount || amount <= 0) return res.status(400).json({ message: "Amount must be greater than 0" });

  const db = read();
  const agent = db.agents.find((a) => a._id === agentId);
  const { decision, reason } = evaluate(agent, recipient.trim(), amount);
  const { riskScore, riskFactors, anomaly } = computeRisk(db, agent, recipient.trim(), amount);

  const tx = {
    _id: newId(),
    agent: agent ? agent._id : null,
    agentName: agent ? agent.name : "Unknown",
    recipient: recipient.trim(),
    amount,
    decision,
    reason,
    riskScore,
    riskFactors,
    anomaly,
    createdAt: new Date().toISOString(),
  };
  db.transactions.push(tx);
  write(db);
  res.status(201).json(tx);
};

// Human-in-the-loop: user approves or rejects a PAUSED transaction
exports.resolveTransaction = (req, res) => {
  const { action, addTrusted } = req.body;

  if (action !== "approve" && action !== "reject") {
    return res.status(400).json({ message: "Action must be approve or reject" });
  }

  const db = read();
  const tx = db.transactions.find((t) => t._id === req.params.id);
  if (!tx) return res.status(404).json({ message: "Transaction not found" });
  if (tx.decision !== "PAUSED") {
    return res.status(400).json({ message: "Only PAUSED transactions can be resolved" });
  }

  const agent = db.agents.find((a) => a._id === tx.agent);

  if (action === "approve") {
    if (!agent) return res.status(400).json({ message: "Agent no longer exists" });
    if (!agent.isActive) {
      return res.status(400).json({ message: "Agent is deactivated, activate it before approving" });
    }
    tx.decision = "APPROVED";
    tx.reason = "Approved by user";

    if (addTrusted) {
      const r = tx.recipient.toLowerCase();
      if (!agent.trustedRecipients.includes(r)) {
        agent.trustedRecipients.push(r);
        tx.reason = "Approved by user, recipient added to trusted list";
      }
    }
  } else {
    tx.decision = "BLOCKED";
    tx.reason = "Rejected by user";
  }

  tx.resolvedAt = new Date().toISOString();
  write(db);
  res.json(tx);
};

exports.getTransactions = (req, res) => {
  res.json(read().transactions.slice().reverse().slice(0, 200));
};

exports.getStats = (req, res) => {
  const db = read();
  const count = (d) => db.transactions.filter((t) => t.decision === d).length;
  res.json({
    agents: db.agents.length,
    total: db.transactions.length,
    approved: count("APPROVED"),
    blocked: count("BLOCKED"),
    paused: count("PAUSED"),
  });
};