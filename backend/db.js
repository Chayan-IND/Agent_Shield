const fs = require("fs");
const path = require("path");

const FILE = path.join(__dirname, "data.json");

function read() {
  try {
    return JSON.parse(fs.readFileSync(FILE, "utf8"));
  } catch {
    return { agents: [], transactions: [] };
  }
}

function write(data) {
  fs.writeFileSync(FILE, JSON.stringify(data, null, 2));
}

const newId = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8);

module.exports = { read, write, newId };