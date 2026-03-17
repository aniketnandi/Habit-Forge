import PropTypes from "prop-types";
import "./ProgressBar.css";

function getColor(pct) {
  if (pct >= 80) return "green";
  if (pct >= 50) return "teal";
  if (pct >= 25) return "orange";
  return "red";
}

export default function ProgressBar({ percentage, showLabel }) {
  const color = getColor(percentage);
  const clamped = Math.min(Math.max(percentage, 0), 100);

  return (
    <div className="progress-bar" role="progressbar" aria-valuenow={clamped} aria-valuemin={0} aria-valuemax={100}>
      <div
        className={`progress-bar__fill progress-bar__fill--${color}`}
        style={{ width: `${clamped}%` }}
      />
      {showLabel && (
        <span className="progress-bar__label">{clamped}%</span>
      )}
    </div>
  );
}

ProgressBar.propTypes = {
  percentage: PropTypes.number.isRequired,
  showLabel: PropTypes.bool,
};

ProgressBar.defaultProps = {
  showLabel: false,
};