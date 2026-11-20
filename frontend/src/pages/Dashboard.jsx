import { useEffect, useState } from "react";
import { api } from "../api.js";
import StatusBadge from "../components/StatusBadge.jsx";

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [recent, setRecent] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([api.getStats(), api.getTransactions()])
      .then(([s, t]) => {
        setStats(s);
        setRecent(t.slice(0, 5));
      })
      .catch((e) => setError(e.message));
  }, []);

  if (error) return <div className="alert error">{error}</div>;
  if (!stats) return <p>Loading…</p>;

  const cards = [
    { label: "Registered agents", value: stats.agents, cls: "" },
    { label: "Total transactions", value: stats.total, cls: "" },
    { label: "Approved", value: stats.approved, cls: "c-approved" },
    { label: "Blocked", value: stats.blocked, cls: "c-blocked" },
    { label: "Paused", value: stats.paused, cls: "c-paused" },
  ];

  return (
    <>
      <h1>Dashboard</h1>
      <div className="cards">
        {cards.map((c) => (
          <div key={c.label} className={"card stat " + c.cls}>
            <div className="stat-value">{c.value}</div>
            <div className="stat-label">{c.label}</div>
          </div>
        ))}
      </div>

      <div className="card">
        <h2>Latest activity</h2>
        {recent.length === 0 ? (
          <p className="muted">No transactions yet. Run one in the simulator.</p>
        ) : (
          <table>
            <thead>
              <tr><th>Agent</th><th>Recipient</th><th>Amount</th><th>Decision</th></tr>
            </thead>
            <tbody>
              {recent.map((t) => (
                <tr key={t._id}>
                  <td>{t.agentName}</td>
                  <td>{t.recipient}</td>
                  <td>₹{t.amount.toLocaleString("en-IN")}</td>
                  <td><StatusBadge status={t.decision} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}
