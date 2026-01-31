import { FileText, Shield, AlertTriangle, CheckSquare, Lightbulb } from "lucide-react";

interface ReportSectionProps {
  report: {
    summary: string;
    leaks: string[];
    mitigations: string[];
    checklist: string[];
  };
}

export const ReportSection = ({ report }: ReportSectionProps) => {
  return (
    <div className="space-y-6">
      {/* Executive Summary */}
      <div className="card-cyber rounded-xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-lg bg-primary/10">
            <FileText className="w-5 h-5 text-primary" />
          </div>
          <h3 className="text-lg font-semibold text-foreground">Executive Summary</h3>
        </div>
        <p className="text-muted-foreground leading-relaxed">{report.summary}</p>
      </div>

      {/* Privacy Leaks */}
      <div className="card-cyber rounded-xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-lg bg-warning/10">
            <AlertTriangle className="w-5 h-5 text-warning" />
          </div>
          <h3 className="text-lg font-semibold text-foreground">Privacy Leaks Detected</h3>
        </div>
        <ul className="space-y-3">
          {report.leaks.map((leak, i) => (
            <li key={i} className="flex items-start gap-3">
              <span className="w-1.5 h-1.5 rounded-full bg-warning mt-2 shrink-0" />
              <span className="text-muted-foreground">{leak}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Mitigations */}
      <div className="card-cyber rounded-xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-lg bg-success/10">
            <Lightbulb className="w-5 h-5 text-success" />
          </div>
          <h3 className="text-lg font-semibold text-foreground">Recommended Mitigations</h3>
        </div>
        <ul className="space-y-3">
          {report.mitigations.map((mitigation, i) => (
            <li key={i} className="flex items-start gap-3">
              <span className="w-6 h-6 rounded-full bg-success/10 text-success text-xs font-bold flex items-center justify-center shrink-0">
                {i + 1}
              </span>
              <span className="text-muted-foreground">{mitigation}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Checklist */}
      <div className="card-cyber rounded-xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-lg bg-primary/10">
            <CheckSquare className="w-5 h-5 text-primary" />
          </div>
          <h3 className="text-lg font-semibold text-foreground">Operational Checklist</h3>
        </div>
        <ul className="space-y-3">
          {report.checklist.map((item, i) => (
            <li key={i} className="flex items-start gap-3 group">
              <div className="w-5 h-5 rounded border-2 border-primary/50 flex items-center justify-center shrink-0 mt-0.5 group-hover:bg-primary/10 transition-colors cursor-pointer">
                <div className="w-2 h-2 rounded-sm bg-primary opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <span className="text-muted-foreground">{item}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};
