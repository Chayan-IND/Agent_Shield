import { useEffect, useState } from "react";
import { api } from "../api.js";

export default function Agents() {
  const [agents, setAgents] = useState([]);
  const [form, setForm] = useState({ name: "", spendingLimit: "", trustedRecipients: "" });
  const [error, setError] = useState("");
  const [msg, setMsg] = useState("");

  const load = () => api.getAgents().then(setAgents).catch((e) => setError(e.message));
  useEffect(() => { load(); }, []);

  const change = (e) => setForm({ ...form, [e.target.name]: e.target.value });
  const activeCount = agents.filter((a) => a.isActive).length;

  const submit = async (e) => {
    e.preventDefault();
    setError(""); setMsg("");
    try {
      await api.createAgent(form);
      setForm({ name: "", spendingLimit: "", trustedRecipients: "" });
      setMsg("Agent registered");
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  const toggle = async (id) => {
    setError(""); setMsg("");
    try { await api.toggleAgent(id); load(); } catch (err) { setError(err.message); }
  };

  const editLimit = async (agent) => {
    const val = window.prompt(`New spending limit for ${agent.name} (₹):`, agent.spendingLimit);
    if (val === null) return;
    setError(""); setMsg("");
    try { await api.updateLimit(agent._id, val); load(); } catch (err) { setError(err.message); }
  };

  const deactivateAll = async () => {
    const ok = window.confirm(
      `Emergency revoke: deactivate all ${activeCount} active agent(s)? Every new transaction from them will be BLOCKED.`
    );
    if (!ok) return;
    setError(""); setMsg("");
    try {
      const r = await api.deactivateAll();
      setMsg(`Emergency revoke done: ${r.deactivated} agent(s) deactivated`);
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <>
      <h1>Agents</h1>

      <div className="card">
        <h2>Register a new agent</h2>
        <form className="form" onSubmit={submit}>
          <label>
            Agent name
            <input name="name" value={form.name} onChange={change} placeholder="Shopping Bot" />
          </label>
          <label>
            Spending limit (₹)
            <input name="spendingLimit" type="number" min="1" value={form.spendingLimit} onChange={change} placeholder="5000" />
          </label>
          <label>
            Trusted recipients (comma separated)
            <input name="trustedRecipients" value={form.trustedRecipients} onChange={change} placeholder="amazon, flipkart, swiggy" />
          </label>
          <button className="btn primary" type="submit">Register agent</button>
        </form>
        {error && <div className="alert error">{error}</div>}
        {msg && <div className="alert success">{msg}</div>}
      </div>

      <div className="card">
        <div className="row-between">
          <h2>Registered agents</h2>
          <button
            className="btn"
            style={{ background: "#dc2626", color: "#fff", borderColor: "#dc2626" }}
            onClick={deactivateAll}
            disabled={activeCount === 0}
          >
            Deactivate all agents
          </button>
        </div>
        {agents.length === 0 ? (
          <p className="muted">No agents yet. Register your first agent above.</p>
        ) : (
          <table>
            <thead>
              <tr><th>ID</th><th>Name</th><th>Limit</th><th>Trusted recipients</th><th>Status</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {agents.map((a) => (
                <tr key={a._id}>
                  <td>{a.agentId}</td>
                  <td>{a.name}</td>
                  <td>₹{a.spendingLimit.toLocaleString("en-IN")}</td>
                  <td>{a.trustedRecipients.join(", ") || "—"}</td>
                  <td>
                    <span className={"badge " + (a.isActive ? "badge-approved" : "badge-blocked")}>
                      {a.isActive ? "ACTIVE" : "INACTIVE"}
                    </span>
                  </td>
                  <td className="actions">
                    <button className="btn small" onClick={() => editLimit(a)}>Edit limit</button>
                    <button className="btn small" onClick={() => toggle(a._id)}>
                      {a.isActive ? "Deactivate" : "Activate"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}