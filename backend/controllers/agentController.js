const { read, write, newId } = require("../db");

const parseRecipients = (value) =>
  String(value || "")
    .split(",")
    .map((r) => r.trim().toLowerCase())
    .filter(Boolean);

exports.getAgents = (req, res) => {
  res.json(read().agents.slice().reverse());
};

exports.createAgent = (req, res) => {
  const { name, spendingLimit, trustedRecipients } = req.body;
  const limit = Number(spendingLimit);
  if (!name || !name.trim()) return res.status(400).json({ message: "Agent name is required" });
  if (!limit || limit <= 0) return res.status(400).json({ message: "Spending limit must be greater than 0" });

  const db = read();
  const agent = {
    _id: newId(),
    agentId: "AGT-" + Math.random().toString(36).slice(2, 8).toUpperCase(),
    name: name.trim(),
    spendingLimit: limit,
    trustedRecipients: parseRecipients(trustedRecipients),
    isActive: true,
    createdAt: new Date().toISOString(),
  };
  db.agents.push(agent);
  write(db);
  res.status(201).json(agent);
};

exports.updateLimit = (req, res) => {
  const limit = Number(req.body.spendingLimit);
  if (!limit || limit <= 0) return res.status(400).json({ message: "Spending limit must be greater than 0" });

  const db = read();
  const agent = db.agents.find((a) => a._id === req.params.id);
  if (!agent) return res.status(404).json({ message: "Agent not found" });
  agent.spendingLimit = limit;
  write(db);
  res.json(agent);
};

exports.toggleAgent = (req, res) => {
  const db = read();
  const agent = db.agents.find((a) => a._id === req.params.id);
  if (!agent) return res.status(404).json({ message: "Agent not found" });
  agent.isActive = !agent.isActive;
  write(db);
  res.json(agent);
};