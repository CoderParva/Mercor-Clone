const DAYS = [
  { key: 'sun', label: 'S' },
  { key: 'mon', label: 'M' },
  { key: 'tue', label: 'T' },
  { key: 'wed', label: 'W' },
  { key: 'thu', label: 'T' },
  { key: 'fri', label: 'F' },
  { key: 'sat', label: 'S' },
];

export default function WorkingHoursGrid({ value, onChange }) {
  const dayRanges = (day) => value[day] || [];

  const addRange = (day) => {
    const ranges = dayRanges(day);
    onChange({ ...value, [day]: [...ranges, { start: '09:00am', end: '05:00pm' }] });
  };

  const removeRange = (day, index) => {
    const ranges = dayRanges(day).filter((_, i) => i !== index);
    onChange({ ...value, [day]: ranges });
  };

  const updateRange = (day, index, field, val) => {
    const ranges = dayRanges(day).map((r, i) => (i === index ? { ...r, [field]: val } : r));
    onChange({ ...value, [day]: ranges });
  };

  return (
    <div className="hours-grid">
      {DAYS.map(({ key, label }) => {
        const ranges = dayRanges(key);
        const unavailable = ranges.length === 0;
        return (
          <div className="hours-row" key={key}>
            <span className={`hours-day-badge ${unavailable ? 'off' : ''}`}>{label}</span>

            {unavailable ? (
              <>
                <span className="hours-unavailable">Unavailable</span>
                <button type="button" className="hours-add" onClick={() => addRange(key)}>+</button>
              </>
            ) : (
              <div className="hours-ranges">
                {ranges.map((r, i) => (
                  <div className="hours-range" key={i}>
                    <input value={r.start} onChange={(e) => updateRange(key, i, 'start', e.target.value)} placeholder="9:00am" />
                    <span>-</span>
                    <input value={r.end} onChange={(e) => updateRange(key, i, 'end', e.target.value)} placeholder="5:00pm" />
                    <button type="button" className="hours-x" onClick={() => removeRange(key, i)}>✕</button>
                    {i === ranges.length - 1 && (
                      <button type="button" className="hours-add" onClick={() => addRange(key)}>+</button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}