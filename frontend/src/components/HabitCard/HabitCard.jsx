import PropTypes from "prop-types";
import { useNavigate } from "react-router-dom";
import "./HabitCard.css";

const CATEGORY_COLORS = {
  Study: "blue",
  Fitness: "teal",
  Health: "green",
  Mindfulness: "orange",
  Other: "gray",
};

const CATEGORY_EMOJI = {
  Study: "📚",
  Fitness: "🏋️",
  Health: "💧",
  Mindfulness: "🧘",
  Other: "⭐",
};

export default function HabitCard({ habit, onEdit, onDelete }) {
  const navigate = useNavigate();
  const color = CATEGORY_COLORS[habit.category] || "gray";
  const emoji = CATEGORY_EMOJI[habit.category] || "⭐";

  const freqLabel =
    habit.frequency === "daily"
      ? "Daily"
      : `${habit.targetCount}× / week`;

  return (
    <article className={`habit-card habit-card--${color}`}>
      <div className="habit-card__left">
        <span className="habit-card__emoji" aria-hidden="true">
          {emoji}
        </span>
      </div>

      <div className="habit-card__body">
        <div className="habit-card__top">
          <h2 className="habit-card__name">{habit.name}</h2>
          <span className={`habit-card__badge habit-card__badge--${color}`}>
            {habit.category}
          </span>
        </div>
        <p className="habit-card__meta">
          <span className="habit-card__freq">{freqLabel}</span>
        </p>

        <div className="habit-card__actions">
          <button
            className="btn btn--teal btn--sm"
            onClick={() => navigate(`/logs/${habit._id}`)}
            aria-label={`View logs for ${habit.name}`}
          >
            📋 View Logs
          </button>
          <button
            className="btn btn--ghost btn--sm"
            onClick={() => onEdit(habit)}
            aria-label={`Edit ${habit.name}`}
          >
            ✏️ Edit
          </button>
          <button
            className="btn btn--danger btn--sm"
            onClick={() => onDelete(habit._id)}
            aria-label={`Delete ${habit.name}`}
          >
            🗑️ Delete
          </button>
        </div>
      </div>
    </article>
  );
}

HabitCard.propTypes = {
  habit: PropTypes.shape({
    _id: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    category: PropTypes.string.isRequired,
    frequency: PropTypes.string.isRequired,
    targetCount: PropTypes.number.isRequired,
  }).isRequired,
  onEdit: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
};