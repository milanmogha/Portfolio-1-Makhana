import React from 'react';
import { Link } from 'react-router-dom';

interface Tab {
  id: string;
  label: string;
}

interface SectionHeaderProps {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  viewAllTo?: string;       // react-router path for a "View all" link
  viewAllLabel?: string;
  tabs?: Tab[];
  activeTab?: string;
  onTabChange?: (id: string) => void;
  align?: 'left' | 'center';
}

/** Standard section heading with optional eyebrow, tabs and view-all link. */
export default function SectionHeader({
  eyebrow,
  title,
  subtitle,
  viewAllTo,
  viewAllLabel = 'View all',
  tabs,
  activeTab,
  onTabChange,
  align = 'left',
}: SectionHeaderProps) {
  return (
    <div className={`ui-section-header ui-section-header-${align}`}>
      <div className="ui-section-header-row">
        <div>
          {eyebrow && <p className="ui-section-eyebrow">{eyebrow}</p>}
          <h2 className="ui-section-title">{title}</h2>
          {subtitle && <p className="ui-section-subtitle">{subtitle}</p>}
        </div>
        {viewAllTo && (
          <Link to={viewAllTo} className="ui-section-viewall">
            {viewAllLabel} <span aria-hidden="true">→</span>
          </Link>
        )}
      </div>

      {tabs && tabs.length > 0 && (
        <div className="ui-section-tabs" role="tablist" aria-label={`${title} categories`}>
          {tabs.map((tab) => (
            <button
              key={tab.id}
              role="tab"
              aria-selected={activeTab === tab.id}
              className={`ui-section-tab ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => onTabChange?.(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
