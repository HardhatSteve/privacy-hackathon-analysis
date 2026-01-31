import React from 'react';
import './LoadingSpinner.css';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'md',
  className = '',
}) => {
  return (
    <div className={`spinner spinner-${size} ${className}`}>
      <div className="spinner-ring" />
      <div className="spinner-ring" />
      <div className="spinner-ring" />
    </div>
  );
};

export default LoadingSpinner;
