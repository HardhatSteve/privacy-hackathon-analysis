export function mockRangeDecision(address) {
  const last = address.trim().slice(-1).toLowerCase();
  const countryMap = { a:"US", b:"GB", c:"DE", d:"FR", e:"NG", f:"BR", g:"CA", h:"IN", i:"RU", j:"IR", k:"SY", l:"UA", m:"AR", n:"JP", o:"KR", p:"SG", q:"ES", r:"IT", s:"SE", t:"TR", u:"NL", v:"PL", w:"AE", x:"SA", y:"EG", z:"ZA" };
  const country = countryMap[last] || "US";
  const ageDays = Math.max(1, address.length % 10);
  const blocked = ["KP", "IR", "SY", "CU", "RU"];
  const ok = !blocked.includes(country) && ageDays >= 3;
  return {
    passed: ok,
    country,
    ageDays,
    reasons: [
      blocked.includes(country) ? `Blocked jurisdiction: ${country}` : null,
      ageDays < 3 ? `Account age too new: ${ageDays}d < 3d` : null
    ].filter(Boolean)
  };
}

export function useRangeGate() {
  async function prescreen(address, context = "send") {
    const url = import.meta.env.VITE_RANGE_URL;
    const key = import.meta.env.VITE_RANGE_KEY;
    if (!url || !key) return { ...mockRangeDecision(address), mode: "mock" };
    const res = await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json", "authorization": `Bearer ${key}` },
      body: JSON.stringify({ address, context })
    });
    if (!res.ok) throw new Error("Range error " + res.status);
    const data = await res.json();
    return { ...data, mode: "live" };
  }
  return { prescreen };
}
