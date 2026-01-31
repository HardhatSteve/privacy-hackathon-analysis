
export default function StatsSection() {
    return (
        <div className="space-y-8">
            <div className="text-center space-y-4">
                <h2 className="text-white text-3xl md:text-4xl font-bold tracking-[-0.02em]">
                    The Numbers Speak
                </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="relative overflow-hidden rounded-3xl border border-white/10 p-8 bg-white/2 text-center stat-highlight">
                    <div className="absolute inset-0 bg-linear-to-br from-violet-600/10 to-purple-600/10" />
                    <div className="relative z-10 space-y-2">
                        <div className="text-5xl font-bold bg-linear-to-r from-violet-400 to-purple-400 bg-clip-text text-transparent">
                            0
                        </div>
                        <p className="text-gray-400 text-sm font-semibold uppercase tracking-wider">
                            Servers Required
                        </p>
                    </div>
                </div>

                <div className="relative overflow-hidden rounded-3xl border border-white/10 p-8 bg-white/2 text-center stat-highlight">
                    <div className="absolute inset-0 bg-linear-to-br from-blue-600/10 to-indigo-600/10" />
                    <div className="relative z-10 space-y-2">
                        <div className="text-5xl font-bold bg-linear-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
                            100%
                        </div>
                        <p className="text-gray-400 text-sm font-semibold uppercase tracking-wider">
                            Open Source
                        </p>
                    </div>
                </div>

                <div className="relative overflow-hidden rounded-3xl border border-white/10 p-8 bg-white/2 text-center stat-highlight">
                    <div className="absolute inset-0 bg-linear-to-br from-purple-600/10 to-pink-600/10" />
                    <div className="relative z-10 space-y-2">
                        <div className="text-5xl font-bold bg-linear-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                            ∞
                        </div>
                        <p className="text-gray-400 text-sm font-semibold uppercase tracking-wider">
                            Privacy Guaranteed
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
