export default function DistrictFilter({ districts, selected, onChange }) {
  return (
    <div className="filter-bar">
      <label className="filter-label" htmlFor="district-select">
        Showing results for:
      </label>
      <select
        id="district-select"
        className="filter-select"
        value={selected || ''}
        onChange={e => onChange(e.target.value || null)}
      >
        <option value="">All districts ({districts.length} districts)</option>
        {[...districts].sort((a, b) => a.localeCompare(b)).map(d => (
          <option key={d} value={d}>{d}</option>
        ))}
      </select>
      {selected && (
        <button className="filter-clear" onClick={() => onChange(null)}>
          ✕ Clear
        </button>
      )}
    </div>
  );
}
