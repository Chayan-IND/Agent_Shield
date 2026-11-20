import { useEffect, useState } from "react";
import { api } from "../api.js";
import StatusBadge from "../components/StatusBadge.jsx";

export default function Logs() {
  const [logs, setLogs] = useState([]);
  const [error, setError] = useState("");

  const load = () => api.getTransactions().then(setLogs).catch((e) => setError(e.message));
  useEffect(() => { load(); }, []);

  return (
    <>
      <div className="row-between">
        <h1>Activity logs</h1>
        <button className="btn" onClick={load}>Refresh</button>
      </div>
      {error && <div className="alert error">{error}</div>}
      <div className="card">
        {logs.length === 0 ? (
          <p className="muted">No activity yet. Submit a transaction in the simulator.</p>
        ) : (
          <table>
            <thead>
              <tr><th>Date</th><th>Agent</th><th>Recipient</th><th>Amount</th><th>Decision</th><th>Reason</th></tr>
            </thead>
            <tbody>
              {logs.map((t) => (
                <tr key={t._id}>
                  <td>{new Date(t.createdAt).toLocaleString("en-IN")}</td>
                  <td>{t.agentName}</td>
                  <td>{t.recipient}</td>
                  <td>₹{t.amount.toLocaleString("en-IN")}</td>
                  <td><StatusBadge status={t.decision} /></td>
                  <td className="muted">{t.reason}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}
