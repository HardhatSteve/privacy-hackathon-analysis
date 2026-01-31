import { LucideIcon } from "lucide-react";

interface StatCardProps {
    title: string;
    value: string;
    subValue: string;
    highlight?: boolean;
    icon?: LucideIcon;
}

export function StatCard({ title, value, subValue, highlight = false, icon: Icon }: StatCardProps) {
    return (
        <div className={`p-6 rounded-2xl border transition-all duration-300 group ${highlight
                ? 'glass border-stealth-primary/30 bg-stealth-primary/5 hover:bg-stealth-primary/10 shadow-[0_0_30px_rgba(124,58,237,0.05)]'
                : 'glass border-white/5 hover:border-white/10'
            }`}>
            <div className="flex items-start justify-between mb-4">
                <span className="text-stone-400 text-xs font-semibold uppercase tracking-wider">{title}</span>
                {Icon && (
                    <div className={`p-2 rounded-lg ${highlight ? 'bg-stealth-primary/20 text-stealth-primary' : 'bg-white/5 text-stone-400'}`}>
                        <Icon className="w-4 h-4" />
                    </div>
                )}
            </div>

            <div className="space-y-1">
                <div className="text-3xl font-mono font-bold text-white tracking-tighter">
                    {value}
                </div>
                <div className={`text-xs font-medium ${highlight ? 'text-stealth-accent' : 'text-stone-500'}`}>
                    {subValue}
                </div>
            </div>
        </div>
    );
}
