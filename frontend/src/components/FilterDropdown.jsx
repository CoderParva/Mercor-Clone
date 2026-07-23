import { useState, useRef, useEffect } from 'react';

const FACETS = [
  { key: 'minPay', label: 'Pay Rate', icon: '$' },
  { key: 'location', label: 'Location', icon: '⌖' },
  { key: 'domain', label: 'Domain', icon: '▤' },
  { key: 'minReferral', label: 'Referral Amount', icon: '◈' },
  { key: 'workArrangement', label: 'Work Arrangement', icon: '⌂' },
  { key: 'contractType', label: 'Contract Type', icon: '☰' },
];

export default function FilterDropdown({ facets, filters, onChange, onClear }) {
  const [open, setOpen] = useState(false);
  const [activeFacet, setActiveFacet] = useState(null);
  const wrapRef = useRef(null);

  useEffect(() => {
    const onDocClick = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) {
        setOpen(false);
        setActiveFacet(null);
      }
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, []);

  const activeCount = Object.values(filters).filter(Boolean).length;

  const renderPanel = () => {
    if (!activeFacet) return null;

    if (activeFacet === 'minPay') {
      return (
        <div className="filter-panel">
          <label>Minimum pay ($/hr)</label>
          <input type="number" min="0" placeholder="e.g. 50"
            value={filters.minPay || ''} onChange={(e) => onChange('minPay', e.target.value)} />
        </div>
      );
    }

    if (activeFacet === 'minReferral') {
      return (
        <div className="filter-panel">
          <label>Minimum referral amount ($)</label>
          <input type="number" min="0" placeholder="e.g. 200"
            value={filters.minReferral || ''} onChange={(e) => onChange('minReferral', e.target.value)} />
        </div>
      );
    }

    const optionMap = {
      location: facets.locations || [],
      domain: facets.domains || [],
      workArrangement: facets.workArrangements || [],
      contractType: facets.contractTypes || [],
    };
    const options = optionMap[activeFacet] || [];
    const labelMap = {
      location: 'Location',
      domain: 'Domain',
      workArrangement: 'Work arrangement',
      contractType: 'Contract type',
    };

    return (
      <div className="filter-panel">
        <label>{labelMap[activeFacet]}</label>
        <select value={filters[activeFacet] || ''} onChange={(e) => onChange(activeFacet, e.target.value)}>
          <option value="">Any</option>
          {options.map((o) => (
            <option key={o} value={o}>{o.charAt(0).toUpperCase() + o.slice(1)}</option>
          ))}
        </select>
        {options.length === 0 && (
          <p className="resume-hint" style={{ marginTop: '0.5rem' }}>
            No values yet — these appear once roles are posted with this field set.
          </p>
        )}
      </div>
    );
  };

  return (
    <div className="filter-wrap" ref={wrapRef}>
      <button type="button" className={`filter-trigger ${activeCount > 0 ? 'has-value' : ''}`}
        onClick={() => setOpen((o) => !o)}>
        <span>⚟</span>
        Filter
        {activeCount > 0 && <span>({activeCount})</span>}
      </button>

      {open && (
        <div className="filter-menu">
          {FACETS.map((f) => (
            <button key={f.key} type="button"
              className={`filter-facet ${activeFacet === f.key ? 'active' : ''} ${filters[f.key] ? 'active' : ''}`}
              onClick={() => setActiveFacet(activeFacet === f.key ? null : f.key)}>
              <span className="filter-facet-icon">{f.icon}</span>
              {f.label}
              {filters[f.key] && <span style={{ marginLeft: 'auto' }}>●</span>}
            </button>
          ))}

          {renderPanel()}

          {activeCount > 0 && (
            <div className="filter-panel-actions">
              <button type="button" className="filter-clear"
                onClick={() => { onClear(); setActiveFacet(null); }}>
                Clear all filters
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}