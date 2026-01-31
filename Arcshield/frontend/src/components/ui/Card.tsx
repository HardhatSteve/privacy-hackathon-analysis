import React from 'react';
import './Card.css';

interface CardProps {
  title?: string;
  subtitle?: string;
  headerActions?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  variant?: 'default' | 'outlined' | 'elevated';
}

const Card: React.FC<CardProps> = ({
  title,
  subtitle,
  headerActions,
  children,
  className = '',
  variant = 'default',
}) => {
  return (
    <div className={`card card-${variant} ${className}`}>
      {(title || subtitle || headerActions) && (
        <div className="card-header">
          <div className="card-header-content">
            {title && <h3 className="card-title">{title}</h3>}
            {subtitle && <p className="card-subtitle">{subtitle}</p>}
          </div>
          {headerActions && <div className="card-header-actions">{headerActions}</div>}
        </div>
      )}
      <div className="card-body">{children}</div>
    </div>
  );
};

export default Card;
