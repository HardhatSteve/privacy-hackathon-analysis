function hasSdk() {
  return typeof window !== 'undefined' && window.PrivacyCash;
}

export async function pcDeposit({ amountSol, noteHint }) {
  if (!hasSdk()) {
    await new Promise(r => setTimeout(r, 800));
    return { 
      mode: "demo", 
      txid: "PC_DEP_" + Math.random().toString(16).slice(2, 10).toUpperCase(),
      note: "privacy-note-" + Math.random().toString(36).slice(2, 8)
    };
  }
  return { mode: "live", ...(await window.PrivacyCash.deposit({ amountSol, noteHint })) };
}

export async function pcWithdraw({ note }) {
  if (!hasSdk()) {
    await new Promise(r => setTimeout(r, 800));
    return { mode: "demo", txid: "PC_WD_" + Math.random().toString(16).slice(2, 10).toUpperCase() };
  }
  return { mode: "live", ...(await window.PrivacyCash.withdraw({ note })) };
}
