import { useEffect, useState } from "react";
import { api } from "../api.js";
import StatusBadge from "../components/StatusBadge.jsx";

export default function Simulator() {
  const [agents, setAgents] = useState([]);
  const [form, setForm] = useState({ agentId: "", recipient: "", amount: "" });
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api.getAgents().then(setAgents).catch((e) => setError(e.message));
  }, []);

  const change = (e) => setForm({ ...form, [e.target.name]: e.target.value });
  const selected = agents.find((a) => a._id === form.agentId);

  const submit = async (e) => {
    e.preventDefault();
    setError(""); setResult(null);
    try {
      setResult(await api.createTransaction(form));
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <>
      <h1>Transaction simulator</h1>
      <div className="card">
        <form className="form" onSubmit={submit}>
          <label>
            Agent
            <select name="agentId" value={form.agentId} onChange={change}>
              <option value="">Select an agent</option>
              {agents.map((a) => (
                <option key={a._id} value={a._id}>
                  {a.name} ({a.agentId}){a.isActive ? "" : " - inactive"}
                </option>
              ))}
            </select>
          </label>
          {selected && (
            <p className="muted small-text">
              Limit ₹{selected.spendingLimit.toLocaleString("en-IN")} · Trusted: {selected.trustedRecipients.join(", ") || "none"}
            </p>
          )}
          <label>
            Recipient
            <input name="recipient" value={form.recipient} onChange={change} placeholder="amazon" />
          </label>
          <label>
            Amount (₹)
            <input name="amount" type="number" min="1" value={form.amount} onChange={change} placeholder="2000" />
          </label>
          <button className="btn primary" type="submit">Submit transaction</button>
        </form>
        {error && <div className="alert error">{error}</div>}
      </div>

      {result && (
        <div className={"card result result-" + result.decision.toLowerCase()}>
          <StatusBadge status={result.decision} />
          <h2>₹{result.amount.toLocaleString("en-IN")} to {result.recipient}</h2>
          <p>{result.reason}</p>
        </div>
      )}
    </>
  );
}
