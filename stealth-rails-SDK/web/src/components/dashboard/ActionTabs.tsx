import { Globe, ScanFace } from "lucide-react";

interface ActionTabsProps {
    isPrivate: boolean;
    onToggle: (val: boolean) => void;
}

export function ActionTabs({ isPrivate, onToggle }: ActionTabsProps) {
    return (
        <div className="flex p-1 bg-stealth-900/90 backdrop-blur-xl rounded-xl border border-stealth-border w-fit mx-auto shadow-2xl">
            <button
                onClick={() => onToggle(false)}
                className={`px-8 py-2.5 rounded-lg text-sm font-medium transition-all duration-300 flex items-center gap-2
                ${!isPrivate
                        ? 'bg-stealth-700 text-white shadow-lg shadow-black/40'
                        : 'text-stone-400 hover:text-white hover:bg-white/5'
                    }`}
            >
                <Globe className="w-4 h-4" /> Public Scope
            </button>
            <button
                onClick={() => onToggle(true)}
                className={`px-8 py-2.5 rounded-lg text-sm font-medium transition-all duration-300 flex items-center gap-2
                ${isPrivate
                        ? 'bg-stealth-primary text-white shadow-[0_0_20px_rgba(124,58,237,0.4)]'
                        : 'text-stone-400 hover:text-white hover:bg-white/5'
                    }`}
            >
                <ScanFace className="w-4 h-4" /> Private Scope
            </button>
        </div>
    );
}
