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