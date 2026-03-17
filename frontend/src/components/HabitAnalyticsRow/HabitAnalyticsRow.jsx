import PropTypes from "prop-types";
import ProgressBar from "../ProgressBar/ProgressBar.jsx";
import "./HabitAnalyticsRow.css";

const CATEGORY_EMOJI = {
  Study: "📚",
  Fitness: "🏋️",
  Health: "💧",
  Mindfulness: "🧘",
  Other: "⭐",
};

export default function HabitAnalyticsRow({ habit }) {
  const emoji = CATEGORY_EMOJI[habit.category] || "⭐";

  return (
    <article className="analytics-row">
      <div className="analytics-row__top">
        <div className="analytics-row__name-row">
          <span className="analytics-row__emoji" aria-hidden="true">{emoji}</span>
          <h3 className="analytics-row__name">{habit.name}</h3>
          <span className="analytics-row__category">{habit.category}</span>
        </div>
        <div className="analytics-row__kpis">
          <div className="kpi">
            <span className="kpi__icon">🔥</span>
            <span className="kpi__num">{habit.currentStreak}</span>
            <span className="kpi__label">current streak</span>
          </div>
          <div className="kpi">
            <span className="kpi__icon">🏆</span>
            <span className="kpi__num">{habit.longestStreak}</span>
            <span className="kpi__label">best streak</span>
          </div>
          <div className="kpi">
            <span className="kpi__icon">📋</span>
            <span className="kpi__num">{habit.totalLogs}</span>
            <span className="kpi__label">total logs</span>
          </div>
        </div>
      </div>

      <div className="analytics-row__bar-row">
        <span className="analytics-row__bar-label">Weekly</span>
        <ProgressBar percentage={habit.weeklyPct} showLabel />
      </div>
      <div className="analytics-row__bar-row">
        <span className="analytics-row__bar-label">Overall</span>
        <ProgressBar percentage={habit.overallPct} showLabel />
      </div>
    </article>
  );
}

HabitAnalyticsRow.propTypes = {
  habit: PropTypes.shape({
    _id: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    category: PropTypes.string.isRequired,
    currentStreak: PropTypes.number.isRequired,
    longestStreak: PropTypes.number.isRequired,
    weeklyPct: PropTypes.number.isRequired,
    overallPct: PropTypes.number.isRequired,
    totalLogs: PropTypes.number.isRequired,
  }).isRequired,
};