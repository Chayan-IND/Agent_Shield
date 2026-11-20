import { useState } from "react";
import Sidebar from "./components/Sidebar.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import Agents from "./pages/Agents.jsx";
import Simulator from "./pages/Simulator.jsx";
import Logs from "./pages/Logs.jsx";

export default function App() {
  const [page, setPage] = useState("dashboard");

  return (
    <div className="layout">
      <Sidebar page={page} setPage={setPage} />
      <main className="content">
        {page === "dashboard" && <Dashboard />}
        {page === "agents" && <Agents />}
        {page === "simulator" && <Simulator />}
        {page === "logs" && <Logs />}
      </main>
    </div>
  );
}
