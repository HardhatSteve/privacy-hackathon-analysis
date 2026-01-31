interface FeatureCardProps {
  icon: string;
  title: string;
  description: string;
  gradient: string;
}

export default function FeatureCard({ icon, title, description, gradient }: FeatureCardProps) {
  return (
    <div className={`group relative flex flex-col gap-6 p-8 rounded-2xl glassmorphism-card overflow-hidden`}>
      {/* Gradient background overlay */}
      <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 ${gradient}`} />
      
      <div className="relative z-10 flex flex-col gap-6">
        <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-white/5 border border-white/10 group-hover:border-white/20 transition-colors">
          <span className="material-symbols-outlined text-violet-400 text-2xl">{icon}</span>
        </div>
        
        <div className="flex flex-col gap-3">
          <h3 className="text-white text-xl font-bold leading-tight tracking-[-0.015em]">
            {title}
          </h3>
          <p className="text-gray-400 text-sm font-normal leading-relaxed">
            {description}
          </p>
        </div>
      </div>
    </div>
  );
}
