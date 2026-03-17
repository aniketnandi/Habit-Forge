import PropTypes from "prop-types";
import "./SortControls.css";

const SORT_OPTIONS = [
  { value: "completion", label: "Completion %" },
  { value: "streak", label: "Current Streak" },
  { value: "longest", label: "Longest Streak" },
  { value: "name", label: "Name A–Z" },
];

export default function SortControls({ value, onChange }) {
  return (
    <div className="sort-controls" role="group" aria-label="Sort habits by">
      <span className="sort-controls__label">Sort by:</span>
      {SORT_OPTIONS.map((opt) => (
        <button
          key={opt.value}
          className={`sort-btn ${value === opt.value ? "sort-btn--active" : ""}`}
          onClick={() => onChange(opt.value)}
          aria-pressed={value === opt.value}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

SortControls.propTypes = {
  value: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
};