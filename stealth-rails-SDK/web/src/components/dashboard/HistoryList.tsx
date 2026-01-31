import { Shield, Radio } from "lucide-react";

interface HistoryItem {
    type: string;
    amount: number;
    date: string;
    status: string;
}

export function HistoryList({ history }: { history: HistoryItem[] }) {
    return (
        <div className="w-full glass-panel rounded-2xl p-6 mt-6">
            <h3 className="text-stone-400 text-xs font-bold uppercase tracking-wider mb-4 px-2">
                Encrypted Activity Log
            </h3>
            <div className="space-y-2">
                {history.length === 0 ? (
                    <div className="text-center py-8 text-stone-600 italic">No private activity yet.</div>
                ) : (
                    history.map((tx, i) => (
                        <div key={i} className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 hover:border-white/10 transition-colors group">
                            <div className="flex items-center gap-4">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-transform group-hover:scale-110 ${tx.type === 'shield' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' : 'bg-purple-500/10 text-purple-400 border border-purple-500/20'}`}>
                                    {tx.type === 'shield' ? <Shield className="w-5 h-5" /> : <Radio className="w-5 h-5" />}
                                </div>
                                <div>
                                    <div className="font-medium text-stone-200">
                                        {tx.type === 'shield' ? 'Shielded Assets' : 'Private Transfer'}
                                    </div>
                                    <div className="text-xs text-stone-500">{tx.date}</div>
                                </div>
                            </div>
                            <div className="text-right">
                                <div className={`font-mono font-bold text-lg ${tx.type === 'shield' ? 'text-blue-400' : 'text-purple-400'}`}>
                                    {tx.type === 'shield' ? '+' : '-'}{tx.amount} SOL
                                </div>
                                <div className="text-[10px] uppercase font-bold tracking-wider text-stealth-accent/80 bg-stealth-accent/10 px-2 py-0.5 rounded flex items-center gap-1 justify-end mt-1 w-fit ml-auto">
                                    <span className="w-1 h-1 rounded-full bg-stealth-accent animate-pulse"></span>
                                    {tx.status}
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
