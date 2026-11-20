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

exports.createTransaction = (req, res) => {
  const { agentId, recipient } = req.body;
  const amount = Number(req.body.amount);

  if (!agentId) return res.status(400).json({ message: "Please select an agent" });
  if (!recipient || !recipient.trim()) return res.status(400).json({ message: "Recipient is required" });
  if (!amount || amount <= 0) return res.status(400).json({ message: "Amount must be greater than 0" });

  const db = read();
  const agent = db.agents.find((a) => a._id === agentId);
  const { decision, reason } = evaluate(agent, recipient.trim(), amount);

  const tx = {
    _id: newId(),
    agent: agent ? agent._id : null,
    agentName: agent ? agent.name : "Unknown",
    recipient: recipient.trim(),
    amount,
    decision,
    reason,
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