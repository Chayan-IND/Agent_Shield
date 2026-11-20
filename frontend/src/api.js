async function request(url, options = {}) {
  const res = await fetch("/api" + url, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || "Request failed");
  return data;
}

export const api = {
  getStats: () => request("/transactions/stats"),
  getAgents: () => request("/agents"),
  createAgent: (body) => request("/agents", { method: "POST", body: JSON.stringify(body) }),
  updateLimit: (id, spendingLimit) =>
    request(`/agents/${id}/limit`, { method: "PATCH", body: JSON.stringify({ spendingLimit }) }),
  toggleAgent: (id) => request(`/agents/${id}/toggle`, { method: "PATCH" }),
  getTransactions: () => request("/transactions"),
  createTransaction: (body) => request("/transactions", { method: "POST", body: JSON.stringify(body) }),
};
