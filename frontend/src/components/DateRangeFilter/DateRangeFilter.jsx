import { useState } from "react";
import PropTypes from "prop-types";
import "./DateRangeFilter.css";

function getPresetRange(preset) {
  const today = new Date();
  const fmt = (d) => d.toISOString().split("T")[0];

  if (preset === "week") {
    const start = new Date(today);
    const day = start.getDay();
    start.setDate(start.getDate() - (day === 0 ? 6 : day - 1));
    return { start: fmt(start), end: fmt(today) };
  }
  if (preset === "month") {
    const start = new Date(today.getFullYear(), today.getMonth(), 1);
    return { start: fmt(start), end: fmt(today) };
  }
  if (preset === "all") {
    const start = new Date(today);
    start.setFullYear(start.getFullYear() - 1);
    return { start: fmt(start), end: fmt(today) };
  }
  return null;
}

export default function DateRangeFilter({ start, end, onApply }) {
  const [localStart, setLocalStart] = useState(start);
  const [localEnd, setLocalEnd] = useState(end);
  const [err, setErr] = useState(null);

  function handlePreset(preset) {
    const range = getPresetRange(preset);
    if (range) {
      setLocalStart(range.start);
      setLocalEnd(range.end);
      setErr(null);
      onApply(range.start, range.end);
    }
  }

  function handleApply() {
    if (!localStart || !localEnd) {
      setErr("Both dates are required.");
      return;
    }
    if (localStart > localEnd) {
      setErr("Start date must be before end date.");
      return;
    }
    setErr(null);
    onApply(localStart, localEnd);
  }

  return (
    <div className="date-range-filter">
      <div className="date-range-filter__presets">
        <button className="preset-btn" onClick={() => handlePreset("week")}>This Week</button>
        <button className="preset-btn" onClick={() => handlePreset("month")}>This Month</button>
        <button className="preset-btn" onClick={() => handlePreset("all")}>Past Year</button>
      </div>
      <div className="date-range-filter__inputs">
        <div className="form-group">
          <label className="form-label" htmlFor="range-start">From</label>
          <input
            id="range-start"
            type="date"
            className="form-input"
            value={localStart}
            onChange={(e) => { setLocalStart(e.target.value); setErr(null); }}
          />
        </div>
        <div className="form-group">
          <label className="form-label" htmlFor="range-end">To</label>
          <input
            id="range-end"
            type="date"
            className="form-input"
            value={localEnd}
            max={new Date().toISOString().split("T")[0]}
            onChange={(e) => { setLocalEnd(e.target.value); setErr(null); }}
          />
        </div>
        <button className="btn btn--primary" onClick={handleApply}>
          Apply
        </button>
      </div>
      {err && <p className="form-error">{err}</p>}
    </div>
  );
}

DateRangeFilter.propTypes = {
  start: PropTypes.string.isRequired,
  end: PropTypes.string.isRequired,
  onApply: PropTypes.func.isRequired,
};