import PropTypes from "prop-types";
import "./LogEntry.css";

function formatDate(dateStr) {
  const [year, month, day] = dateStr.split("-");
  const d = new Date(Number(year), Number(month) - 1, Number(day));
  return d.toLocaleDateString("en-US", {
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function formatTime(isoStr) {
  return new Date(isoStr).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function LogEntry({ log, onDelete }) {
  return (
    <li className="log-entry">
      <div className="log-entry__check" aria-hidden="true">✅</div>
      <div className="log-entry__info">
        <span className="log-entry__date">{formatDate(log.logDate)}</span>
        <span className="log-entry__time">Logged at {formatTime(log.createdAt)}</span>
        {log.notes && <span className="log-entry__notes">{log.notes}</span>}
      </div>
      <button
        className="btn btn--danger btn--sm log-entry__delete"
        onClick={() => onDelete(log._id)}
        aria-label={`Delete log for ${log.logDate}`}
      >
        🗑️ Delete
      </button>
    </li>
  );
}

LogEntry.propTypes = {
  log: PropTypes.shape({
    _id: PropTypes.string.isRequired,
    logDate: PropTypes.string.isRequired,
    notes: PropTypes.string,
    createdAt: PropTypes.string.isRequired,
  }).isRequired,
  onDelete: PropTypes.func.isRequired,
};