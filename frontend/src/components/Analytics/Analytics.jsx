import { apiFetch } from "../../api.js";
import { useState, useEffect } from "react";
import HabitAnalyticsRow from "../HabitAnalyticsRow/HabitAnalyticsRow.jsx";
import DateRangeFilter from "../DateRangeFilter/DateRangeFilter.jsx";
import SortControls from "../SortControls/SortControls.jsx";
import GoalForm from "../GoalForm/GoalForm.jsx";
import "./Analytics.css";

function getDefaultRange() {
  const today = new Date();
  const start = new Date(today);
  start.setDate(start.getDate() - 29);
  return {
    start: start.toISOString().split("T")[0],
    end: today.toISOString().split("T")[0],
  };
}

export default function Analytics() {
  const defaultRange = getDefaultRange();
  const [summaries, setSummaries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sort, setSort] = useState("completion");
  const [rangeStart, setRangeStart] = useState(defaultRange.start);
  const [rangeEnd, setRangeEnd] = useState(defaultRange.end);

  async function fetchSummary(sortParam) {
    try {
      setLoading(true);
      setError(null);
      const res = await apiFetch(`/api/analytics/summary?sort=${sortParam}`);
      if (!res.ok) throw new Error("Failed to fetch analytics");
      const data = await res.json();
      setSummaries(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchSummary(sort);
  }, [sort]);

  function handleSortChange(newSort) {
    setSort(newSort);
  }

  function handleRangeApply(start, end) {
    setRangeStart(start);
    setRangeEnd(end);
    // Re-fetch with same sort (date range affects per-habit detail views)
    fetchSummary(sort);
  }

  // Top-level KPI aggregates
  const bestStreak = summaries.reduce((m, h) => Math.max(m, h.currentStreak), 0);
  const longestEver = summaries.reduce((m, h) => Math.max(m, h.longestStreak), 0);
  const avgWeekly =
    summaries.length > 0
      ? Math.round(summaries.reduce((s, h) => s + h.weeklyPct, 0) / summaries.length)
      : 0;
  const totalLogs = summaries.reduce((s, h) => s + h.totalLogs, 0);
  const topHabit = summaries.length > 0 ? summaries[0] : null;

  return (
    <div className="page">
      <div className="analytics__header fade-in">
        <h1 className="analytics__title">Analytics</h1>
        <p className="analytics__subtitle">Track your consistency and spot trends.</p>
      </div>

      {/* KPI Strip */}
      <div className="analytics__kpi-strip fade-in">
        <div className="kpi-card kpi-card--blue">
          <span className="kpi-card__icon">🔥</span>
          <span className="kpi-card__num">{bestStreak}</span>
          <span className="kpi-card__label">Best Active Streak</span>
        </div>
        <div className="kpi-card kpi-card--teal">
          <span className="kpi-card__icon">📈</span>
          <span className="kpi-card__num">{avgWeekly}%</span>
          <span className="kpi-card__label">Avg Weekly %</span>
        </div>
        <div className="kpi-card kpi-card--orange">
          <span className="kpi-card__icon">✅</span>
          <span className="kpi-card__num">{totalLogs}</span>
          <span className="kpi-card__label">Total Logs</span>
        </div>
        <div className="kpi-card kpi-card--green">
          <span className="kpi-card__icon">🏆</span>
          <span className="kpi-card__num">{longestEver}</span>
          <span className="kpi-card__label">Longest Ever Streak</span>
        </div>
      </div>

      {/* Controls */}
      <div className="analytics__controls fade-in">
        <section className="analytics__section">
          <h2 className="analytics__section-title">Date Range</h2>
          <DateRangeFilter start={rangeStart} end={rangeEnd} onApply={handleRangeApply} />
        </section>
        <section className="analytics__section">
          <h2 className="analytics__section-title">Sort Habits</h2>
          <SortControls value={sort} onChange={handleSortChange} />
        </section>
      </div>

      {/* Top habit callout */}
      {topHabit && !loading && (
        <div className="analytics__top-habit fade-in">
          <span className="analytics__top-label">🥇 Top Habit this week:</span>
          <strong>{topHabit.name}</strong>
          <span className="analytics__top-pct">{topHabit.weeklyPct}% completion</span>
        </div>
      )}

      {error && <div className="error-box">{error}</div>}

      {loading ? (
        <div className="spinner">Calculating analytics…</div>
      ) : summaries.length === 0 ? (
        <div className="empty-state fade-in">
          <div className="empty-state__icon">📊</div>
          <h3>No data yet</h3>
          <p>Create habits and log some completions to see analytics.</p>
        </div>
      ) : (
        <ul className="analytics__list">
          {summaries.map((habit, i) => (
            <li key={habit._id} className="fade-in" style={{ animationDelay: `${i * 0.05}s` }}>
              <HabitAnalyticsRow habit={habit} />
              <GoalForm habitId={habit._id.toString()} habitName={habit.name} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}