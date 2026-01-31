interface BentoCardProps {
  title: string;
  description: string;
  icon?: string;
  gradient: string;
  size?: "small" | "medium" | "large";
  children?: React.ReactNode;
}

export default function BentoCard({
  title,
  description,
  icon,
  gradient,
  size = "medium",
  children,
}: BentoCardProps) {
  const sizeClasses = {
    small: "md:col-span-1",
    medium: "md:col-span-1",
    large: "md:col-span-2",
  };

  return (
    <div
      className={`group relative overflow-hidden rounded-3xl border border-white/10 p-8 transition-all duration-500 hover:border-white/20 ${sizeClasses[size]} bento-card`}
    >
      {/* Gradient background */}
      <div className={`absolute inset-0 opacity-20 group-hover:opacity-30 transition-opacity duration-500 ${gradient}`} />
      
      {/* Glowing border effect */}
      <div className="absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 glow-border" />

      {/* Content */}
      <div className="relative z-10 flex flex-col h-full">
        {icon && (
          <div className="mb-6 flex items-center justify-center w-14 h-14 rounded-2xl bg-white/5 border border-white/10 group-hover:border-white/20 group-hover:scale-110 transition-all duration-300">
            <span className="material-symbols-outlined text-violet-400 text-3xl">
              {icon}
            </span>
          </div>
        )}

        <div className="space-y-3 grow">
          <h3 className="text-white text-2xl font-bold leading-tight tracking-[-0.02em]">
            {title}
          </h3>
          <p className="text-gray-400 text-sm leading-relaxed">
            {description}
          </p>
        </div>

        {children && <div className="mt-6">{children}</div>}
      </div>
    </div>
  );
}
