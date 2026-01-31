export async function arciumStart({ to, amountSol }) {
  const url = import.meta.env.VITE_ARCIUM_URL;
  const key = import.meta.env.VITE_ARCIUM_KEY;
  
  if (!url || !key) {
    await new Promise(r => setTimeout(r, 500));
    return { mode: "demo", id: "MPC_" + Math.random().toString(16).slice(2, 8).toUpperCase(), state: "queued" };
  }
  
  const res = await fetch(url + "/jobs", {
    method: "POST",
    headers: { "content-type": "application/json", "authorization": `Bearer ${key}` },
    body: JSON.stringify({ to, amount: amountSol })
  });
  if (!res.ok) throw new Error("Arcium error " + res.status);
  return { mode: "live", ...(await res.json()) };
}

export async function arciumPoll({ id }) {
  const url = import.meta.env.VITE_ARCIUM_URL;
  const key = import.meta.env.VITE_ARCIUM_KEY;
  
  if (!url || !key) {
    await new Promise(r => setTimeout(r, 300));
    return { mode: "demo", id, state: "completed", plan: { splits: [0.003, 0.004, 0.003], txid: "MPC_TX_" + Math.random().toString(16).slice(2, 6).toUpperCase() } };
  }
  
  const res = await fetch(`${url}/jobs/${id}`, { headers: { "authorization": `Bearer ${key}` } });
  if (!res.ok) throw new Error("Arcium poll error " + res.status);
  return { mode: "live", ...(await res.json()) };
}
