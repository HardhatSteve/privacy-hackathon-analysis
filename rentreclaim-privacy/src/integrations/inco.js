export async function incoPlan({ amountSol, splits }) {
  const url = import.meta.env.VITE_INCO_URL;
  const key = import.meta.env.VITE_INCO_KEY;
  
  if (!url || !key) {
    await new Promise(r => setTimeout(r, 600));
    const arr = Array.from({ length: splits }, () => Math.random());
    const sum = arr.reduce((a,b) => a+b, 0);
    const plan = arr.map(x => +(amountSol * (x/sum)).toFixed(6));
    const diff = +(amountSol - plan.reduce((a,b) => a+b, 0)).toFixed(6);
    plan[0] = +(plan[0] + diff).toFixed(6);
    return { mode: "demo", plan, encrypted: true };
  }
  
  const res = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json", "authorization": `Bearer ${key}` },
    body: JSON.stringify({ amount: amountSol, splits })
  });
  if (!res.ok) throw new Error("Inco error " + res.status);
  return { mode: "live", ...(await res.json()) };
}
