interface ComparisonFeature {
  feature: string;
  pigeon: boolean;
  competitor: boolean | string;
}

interface ComparisonCardProps {
  title: string;
  subtitle: string;
  icon: string;
  gradient: string;
  features: ComparisonFeature[];
}

export default function ComparisonCard({
  title,
  subtitle,
  icon,
  gradient,
  features,
}: ComparisonCardProps) {
  return (
    <div className="group relative overflow-hidden rounded-3xl border border-white/10 p-8 transition-all duration-500 hover:border-white/20">
      {/* Gradient background */}
      <div className={`absolute inset-0 opacity-10 group-hover:opacity-20 transition-opacity duration-500 ${gradient}`} />
      
      {/* Content */}
      <div className="relative z-10">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-white/5 border border-white/10">
            {icon.startsWith('http') ? (
              <img src={icon} alt={title} className="w-10 h-10 object-contain" />
            ) : (
              <span className="text-4xl">{icon}</span>
            )}
          </div>
          <div>
            <h3 className="text-white text-2xl font-bold tracking-[-0.02em]">
              {title}
            </h3>
            <p className="text-gray-500 text-sm mt-1">{subtitle}</p>
          </div>
        </div>

        {/* Comparison Table */}
        <div className="space-y-4">
          {/* Table Header */}
          <div className="grid grid-cols-3 gap-4 pb-3 border-b border-white/10">
            <div className="text-gray-400 text-xs font-semibold uppercase tracking-wider">
              Feature
            </div>
            <div className="text-center">
              <span className="text-violet-400 text-xs font-semibold uppercase tracking-wider">
                Pigeon
              </span>
            </div>
            <div className="text-center text-gray-400 text-xs font-semibold uppercase tracking-wider">
              {title}
            </div>
          </div>

          {/* Table Rows */}
          {features.map((item, index) => (
            <div
              key={index}
              className="grid grid-cols-3 gap-4 py-3 border-b border-white/5 last:border-0"
            >
              <div className="text-gray-300 text-sm font-medium">
                {item.feature}
              </div>
              <div className="flex justify-center">
                {item.pigeon ? (
                  <span className="material-symbols-outlined text-green-400 text-xl">
                    check_circle
                  </span>
                ) : (
                  <span className="material-symbols-outlined text-red-400/50 text-xl">
                    cancel
                  </span>
                )}
              </div>
              <div className="flex justify-center">
                {typeof item.competitor === "boolean" ? (
                  item.competitor ? (
                    <span className="material-symbols-outlined text-green-400 text-xl">
                      check_circle
                    </span>
                  ) : (
                    <span className="material-symbols-outlined text-red-400/50 text-xl">
                      cancel
                    </span>
                  )
                ) : (
                  <span className="text-yellow-400 text-xs font-medium">
                    {item.competitor}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
