import { useState, useEffect } from "react";
import PropTypes from "prop-types";
import { apiFetch } from "../../api.js";
import "./GoalForm.css";

export default function GoalForm({ habitId, onGoalChange }) {
  const [goal, setGoal] = useState(null);
  const [targetPct, setTargetPct] = useState(80);
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  async function fetchGoal() {
    try {
      const res = await apiFetch(`/api/goals/${habitId}`);
      if (res.status === 404) {
        setGoal(null);
      } else if (res.ok) {
        const data = await res.json();
        setGoal(data);
        setTargetPct(data.targetPct);
      }
    } catch (err) {
      console.error("Failed to fetch goal", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchGoal();
  }, [habitId]);

  async function handleSave() {
    setError(null);
    try {
      let res;
      if (goal) {
        // UPDATE
        res = await apiFetch(`/api/goals/${goal._id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ targetPct }),
        });
      } else {
        // CREATE
        res = await apiFetch("/api/goals", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ habitId, targetPct }),
        });
      }
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save goal");
      setGoal(data);
      setEditing(false);
      if (onGoalChange) onGoalChange(data);
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleDelete() {
    if (!window.confirm("Remove this goal?")) return;
    try {
      const res = await apiFetch(`/api/goals/${goal._id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete goal");
      setGoal(null);
      setTargetPct(80);
      setEditing(false);
      if (onGoalChange) onGoalChange(null);
    } catch (err) {
      setError(err.message);
    }
  }

  if (loading) return null;

  return (
    <div className="goal-form">
      <div className="goal-form__header">
        <span className="goal-form__label">🎯 Weekly Goal</span>
        {goal && !editing && (
          <div className="goal-form__actions">
            <span className="goal-form__current">{goal.targetPct}% target</span>
            <button className="btn btn--ghost btn--sm" onClick={() => setEditing(true)}>
              ✏️ Edit
            </button>
            <button className="btn btn--danger btn--sm" onClick={handleDelete}>
              🗑️
            </button>
          </div>
        )}
        {!goal && !editing && (
          <button className="btn btn--teal btn--sm" onClick={() => setEditing(true)}>
            + Set Goal
          </button>
        )}
      </div>

      {editing && (
        <div className="goal-form__editor">
          {error && <p className="form-error">{error}</p>}
          <div className="goal-form__input-row">
            <label className="form-label" htmlFor={`goal-${habitId}`}>
              Target weekly completion %
            </label>
            <input
              id={`goal-${habitId}`}
              type="number"
              className="form-input form-input--narrow"
              min={1}
              max={100}
              value={targetPct}
              onChange={(e) => setTargetPct(Number(e.target.value))}
            />
            <span className="goal-form__pct-label">%</span>
          </div>
          <div className="goal-form__btns">
            <button className="btn btn--ghost btn--sm" onClick={() => setEditing(false)}>
              Cancel
            </button>
            <button className="btn btn--primary btn--sm" onClick={handleSave}>
              Save
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

GoalForm.propTypes = {
  habitId: PropTypes.string.isRequired,
  onGoalChange: PropTypes.func,
};

GoalForm.defaultProps = {
  onGoalChange: null,
};
