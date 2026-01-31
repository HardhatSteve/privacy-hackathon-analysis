export async function shadowPaySend({ to, amountSol }) {
  const url = import.meta.env.VITE_RADR_URL;
  const key = import.meta.env.VITE_RADR_KEY;
  
  if (!url || !key) {
    await new Promise(r => setTimeout(r, 1000));
    return { 
      mode: "demo", 
      txid: "SHADOW_" + Math.random().toString(16).slice(2, 10).toUpperCase(),
      status: "completed"
    };
  }
  
  const res = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json", "authorization": `Bearer ${key}` },
    body: JSON.stringify({ to, amount: amountSol })
  });
  if (!res.ok) throw new Error("Radr error " + res.status);
  return { mode: "live", ...(await res.json()) };
}
