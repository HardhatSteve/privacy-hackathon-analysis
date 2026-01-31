import type { CategoryScore } from '../types/exposure';
import { EducationalTooltip } from './EducationalTooltip';

interface ExposureCategoryProps {
  category: CategoryScore;
}

// Category-specific icons
const CategoryIcons: Record<string, JSX.Element> = {
  'Wallet Activity': (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="category-icon">
      <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  'Address Linkability': (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="category-icon">
      <path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71" strokeLinecap="round" />
      <path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71" strokeLinecap="round" />
    </svg>
  ),
  'Social Exposure': (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="category-icon">
      <circle cx="12" cy="7" r="4" />
      <path d="M5.5 21a7.5 7.5 0 0113 0" />
      <circle cx="19" cy="11" r="2.5" />
      <path d="M21.5 17a4 4 0 00-5 0" />
      <circle cx="5" cy="11" r="2.5" />
      <path d="M7.5 17a4 4 0 00-5 0" />
    </svg>
  ),
  'Behavioral Profiling': (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="category-icon">
      <path d="M2 12h4l3-9 6 18 3-9h4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  'Financial Footprint': (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="category-icon">
      <circle cx="12" cy="12" r="10" />
      <path d="M12 6v12M8 10h8M8 14h8" strokeLinecap="round" />
    </svg>
  ),
  'Privacy Hygiene': (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="category-icon">
      <path d="M12 2L3 7v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-9-5z" />
      <path d="M9 12l2 2 4-4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
};

// Default icon for unknown categories
const DefaultIcon = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="category-icon">
    <circle cx="12" cy="12" r="10" />
    <path d="M12 16v.01M12 8v4" strokeLinecap="round" />
  </svg>
);

export function ExposureCategory({ category }: ExposureCategoryProps) {
  const levelColors = {
    Low: '#22c55e',
    Medium: '#f59e0b',
    High: '#ef4444',
  };

  const levelGlows = {
    Low: 'rgba(34, 197, 94, 0.3)',
    Medium: 'rgba(245, 158, 11, 0.3)',
    High: 'rgba(239, 68, 68, 0.3)',
  };

  const color = levelColors[category.level];
  const glow = levelGlows[category.level];
  const icon = CategoryIcons[category.name] || DefaultIcon;

  return (
    <div className="exposure-category" style={{ '--category-color': color, '--category-glow': glow } as React.CSSProperties}>
      <div className="category-header">
        <div className="category-title">
          <div className="category-icon-wrapper" style={{ color }}>
            {icon}
          </div>
          <h3 className="category-name">{category.name}</h3>
        </div>
        <span className="score-badge" style={{ backgroundColor: color, boxShadow: `0 0 12px ${glow}` }}>
          {category.level}
        </span>
      </div>
      <p className="category-description">{category.description}</p>
      <div className="category-bar-section">
        <div className="category-bar">
          <div
            className="category-bar-fill"
            style={{ width: `${category.score}%`, backgroundColor: color, boxShadow: `0 0 8px ${glow}` }}
          />
        </div>
        <span className="category-bar-value">{category.score}/100</span>
      </div>
      <ul className="category-signals">
        {category.signals.map((signal, index) => (
          <li key={index}>
            <span className="signal-indicator" style={{ backgroundColor: color, boxShadow: `0 0 6px ${glow}` }}></span>
            <EducationalTooltip signal={signal}>
              <span className="signal-text">{signal}</span>
            </EducationalTooltip>
          </li>
        ))}
      </ul>
    </div>
  );
}
