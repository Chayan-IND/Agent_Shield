const items = [
  { id: "dashboard", label: "Dashboard" },
  { id: "agents", label: "Agents" },
  { id: "simulator", label: "Transaction simulator" },
  { id: "logs", label: "Activity logs" },
];

export default function Sidebar({ page, setPage }) {
  return (
    <aside className="sidebar">
      <div className="brand">
        <span className="brand-mark">AS</span>
        <span>AgentShield</span>
      </div>
      <nav>
        {items.map((i) => (
          <button
            key={i.id}
            className={"nav-btn" + (page === i.id ? " active" : "")}
            onClick={() => setPage(i.id)}
          >
            {i.label}
          </button>
        ))}
      </nav>
      <p className="side-note">Simulated transactions only. No real payments.</p>
    </aside>
  );
}
