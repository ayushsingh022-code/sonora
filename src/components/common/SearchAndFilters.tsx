/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { SearchIcon, FilterSlidersIcon } from './SonoraIcons';

interface SearchFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onClear?: () => void;
  placeholder?: string;
  showFilterButton?: boolean;
  onFilterClick?: () => void;
  className?: string;
}

export const SearchField: React.FC<SearchFieldProps> = ({
  value,
  onChange,
  onClear,
  placeholder = 'Search...',
  showFilterButton = false,
  onFilterClick,
  className = '',
  ...props
}) => {
  return (
    <div className={`relative flex items-center w-full ${className}`}>
      <div className="absolute left-3.5 text-[#B9B2A9] pointer-events-none flex items-center">
        <SearchIcon size={18} color="#B9B2A9" />
      </div>
      <input
        type="text"
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="w-full bg-[#F3EDE3] text-[#20201E] placeholder:text-[#B9B2A9] text-sm font-medium rounded-full py-2.5 pl-10 pr-10 focus:outline-none focus:ring-2 focus:ring-[#FF5A36]/40 transition-all border border-transparent focus:bg-white focus:border-[#EFE9DF]"
        {...props}
      />
      {value && onClear && (
        <button
          type="button"
          onClick={onClear}
          className="absolute right-3 p-1 rounded-full text-[#B9B2A9] hover:text-[#20201E] transition-colors"
          aria-label="Clear search"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      )}
      {!value && showFilterButton && (
        <button
          type="button"
          onClick={onFilterClick}
          className="absolute right-3 p-1 text-[#20201E] hover:text-[#FF5A36] transition-colors"
          aria-label="Filter options"
        >
          <FilterSlidersIcon size={18} color="currentColor" />
        </button>
      )}
    </div>
  );
};

interface FilterChipProps {
  label: string;
  isSelected?: boolean;
  onClick: () => void;
  icon?: React.ReactNode;
  count?: number;
  className?: string;
}

export const FilterChip: React.FC<FilterChipProps> = ({
  label,
  isSelected = false,
  onClick,
  icon,
  count,
  className = '',
}) => {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold tracking-wide transition-all duration-150 shrink-0 cursor-pointer ${
        isSelected
          ? 'bg-[#FF5A36] text-white shadow-xs'
          : 'bg-[#F2ECE2] text-[#20201E] hover:bg-[#EBE3D7]'
      } ${className}`}
    >
      {icon && <span className="shrink-0">{icon}</span>}
      <span>{label}</span>
      {count !== undefined && (
        <span
          className={`ml-0.5 text-[10px] px-1.5 py-0.2 rounded-full ${
            isSelected ? 'bg-white/20 text-white' : 'bg-black/5 text-[#20201E]'
          }`}
        >
          {count}
        </span>
      )}
    </button>
  );
};
