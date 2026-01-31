import { ReactNode } from "react";
import { AlertTriangle, CheckCircle, AlertCircle, Info } from "lucide-react";

type RiskLevel = "low" | "medium" | "high" | "critical";

interface MetricCardProps {
  title: string;
  value: string | number;
  description: string;
  risk: RiskLevel;
  icon: ReactNode;
  detail?: string;
}

const riskConfig = {
  low: {
    color: "text-success",
    bg: "bg-success/10",
    border: "border-success/30",
    icon: CheckCircle,
    label: "Low Risk",
  },
  medium: {
    color: "text-primary",
    bg: "bg-primary/10",
    border: "border-primary/30",
    icon: Info,
    label: "Moderate",
  },
  high: {
    color: "text-warning",
    bg: "bg-warning/10",
    border: "border-warning/30",
    icon: AlertTriangle,
    label: "Elevated",
  },
  critical: {
    color: "text-destructive",
    bg: "bg-destructive/10",
    border: "border-destructive/30",
    icon: AlertCircle,
    label: "Critical",
  },
};

export const MetricCard = ({ 
  title, 
  value, 
  description, 
  risk, 
  icon, 
  detail 
}: MetricCardProps) => {
  const config = riskConfig[risk];
  const RiskIcon = config.icon;

  return (
    <div className={`card-cyber rounded-xl p-5 hover:border-primary/30 transition-all duration-300 group ${config.border}`}>
      <div className="flex items-start justify-between mb-4">
        <div className={`p-2.5 rounded-lg ${config.bg}`}>
          <div className={config.color}>{icon}</div>
        </div>
        <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${config.bg} ${config.color}`}>
          <RiskIcon className="w-3 h-3" />
          {config.label}
        </div>
      </div>
      
      <h3 className="text-muted-foreground text-sm font-medium mb-1">{title}</h3>
      <p className="text-2xl font-bold text-foreground mb-2">{value}</p>
      <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
      
      {detail && (
        <div className="mt-4 pt-4 border-t border-border">
          <p className="text-xs text-muted-foreground font-mono">{detail}</p>
        </div>
      )}
    </div>
  );
};
