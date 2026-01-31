import React from 'react';
import { ChevronDown } from 'lucide-react';
import './Select.css';

interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  helperText?: string;
  options: SelectOption[];
  placeholder?: string;
}

const Select: React.FC<SelectProps> = ({
  label,
  error,
  helperText,
  options,
  placeholder,
  className = '',
  id,
  ...props
}) => {
  const selectId = id || `select-${Math.random().toString(36).substr(2, 9)}`;

  return (
    <div className="select-group">
      {label && (
        <label htmlFor={selectId} className="select-label">
          {label}
        </label>
      )}
      <div className={`select-wrapper ${error ? 'select-error' : ''}`}>
        <select
          id={selectId}
          className={`select ${className}`}
          {...props}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map((option) => (
            <option
              key={option.value}
              value={option.value}
              disabled={option.disabled}
            >
              {option.label}
            </option>
          ))}
        </select>
        <ChevronDown className="select-icon" size={16} />
      </div>
      {error && <span className="select-error-text">{error}</span>}
      {helperText && !error && <span className="select-helper-text">{helperText}</span>}
    </div>
  );
};

export default Select;
