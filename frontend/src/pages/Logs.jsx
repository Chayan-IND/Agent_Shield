import { useEffect, useState } from "react";
import { api } from "../api.js";
import StatusBadge from "../components/StatusBadge.jsx";

function riskColor(score) {
  if (score >= 60) return "#dc2626";
  if (score >= 30) return "#d97706";
  return "#16a34a";
}

export default function Logs() {
  const [logs, setLogs] = useState([]);
  const [error, setError] = useState("");

  const load = () => api.getTransactions().then(setLogs).catch((e) => setError(e.message));
  useEffect(() => { load(); }, []);

  const resolve = async (id, action, addTrusted = false) => {
    setError("");
    try {
      await api.resolveTransaction(id, action, addTrusted);
      await load();
    } catch (e) {
      setError(e.message);
    }
  };

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
              <tr>
                <th>Date</th><th>Agent</th><th>Recipient</th><th>Amount</th>
                <th>Risk</th><th>Decision</th><th>Reason</th><th>Action</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((t) => (
                <tr key={t._id}>
                  <td>{new Date(t.createdAt).toLocaleString("en-IN")}</td>
                  <td>{t.agentName}</td>
                  <td>{t.recipient}</td>
                  <td>₹{t.amount.toLocaleString("en-IN")}</td>
                  <td>
                    {t.riskScore === undefined ? (
                      <span className="muted">-</span>
                    ) : (
                      <div>
                        <strong style={{ color: riskColor(t.riskScore) }}>{t.riskScore}/100</strong>
                        {t.anomaly && (
                          <div style={{ color: "#dc2626", fontSize: "12px", fontWeight: 600 }}>
                            ⚠ Anomaly
                          </div>
                        )}
                        {t.riskFactors && t.riskFactors.map((f, i) => (
                          <div key={i} className="muted" style={{ fontSize: "12px" }}>{f}</div>
                        ))}
                      </div>
                    )}
                  </td>
                  <td><StatusBadge status={t.decision} /></td>
                  <td className="muted">{t.reason}</td>
                  <td>
                    {t.decision === "PAUSED" ? (
                      <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                        <button className="btn" onClick={() => resolve(t._id, "approve")}>Approve</button>
                        <button className="btn" onClick={() => resolve(t._id, "approve", true)}>Approve + trust</button>
                        <button className="btn" onClick={() => resolve(t._id, "reject")}>Reject</button>
                      </div>
                    ) : (
                      <span className="muted">-</span>
                    )}
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