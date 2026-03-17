import { apiFetch } from "../../api.js";
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import LogEntry from "../LogEntry/LogEntry.jsx";
import "./LogView.css";

export default function LogView() {
  const { habitId } = useParams();
  const navigate = useNavigate();

  const [habit, setHabit] = useState(null);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Form state
  const today = new Date().toISOString().split("T")[0];
  const [logDate, setLogDate] = useState(today);
  const [notes, setNotes] = useState("");
  const [formError, setFormError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  async function fetchData() {
    try {
      setLoading(true);
      const [habitRes, logsRes] = await Promise.all([
        apiFetch(`/api/habits/${habitId}`),
        apiFetch(`/api/logs/${habitId}`),
      ]);
      if (!habitRes.ok) throw new Error("Habit not found");
      if (!logsRes.ok) throw new Error("Failed to fetch logs");
      const [habitData, logsData] = await Promise.all([habitRes.json(), logsRes.json()]);
      setHabit(habitData);
      setLogs(logsData);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchData();
  }, [habitId]);

  async function handleLogSubmit(e) {
    e.preventDefault();
    if (!logDate) {
      setFormError("Please select a date.");
      return;
    }
    setSubmitting(true);
    setFormError(null);
    try {
      const res = await apiFetch("/api/logs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ habitId, logDate, notes }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to log completion");
      setLogs((prev) => [data, ...prev]);
      setNotes("");
      setLogDate(today);
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(logId) {
    if (!window.confirm("Delete this log entry?")) return;
    try {
      const res = await apiFetch(`/api/logs/${logId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete log");
      setLogs((prev) => prev.filter((l) => l._id !== logId));
    } catch (err) {
      setError(err.message);
    }
  }

  if (loading) return <div className="spinner">Loading logs…</div>;
  if (error) return <div className="page"><div className="error-box">{error}</div></div>;

  return (
    <div className="page">
      <div className="logview__header fade-in">
        <button className="logview__back" onClick={() => navigate("/")} aria-label="Back to Dashboard">
          ← Back to Dashboard
        </button>
        <h1 className="logview__title">{habit?.name}</h1>
        <p className="logview__meta">
          {habit?.category} · {habit?.frequency === "daily" ? "Daily" : `${habit?.targetCount}× / week`}
          <span className="logview__count">{logs.length} total logs</span>
        </p>
      </div>

      {/* Log a new completion */}
      <section className="logview__form-section fade-in">
        <h2 className="logview__section-title">Log a Completion</h2>
        {formError && <div className="error-box">{formError}</div>}
        <form className="log-form" onSubmit={handleLogSubmit}>
          <div className="log-form__fields">
            <div className="form-group">
              <label className="form-label" htmlFor="log-date">Date</label>
              <input
                id="log-date"
                type="date"
                className="form-input"
                value={logDate}
                max={today}
                onChange={(e) => setLogDate(e.target.value)}
                required
              />
            </div>
            <div className="form-group log-form__notes">
              <label className="form-label" htmlFor="log-notes">Notes (optional)</label>
              <input
                id="log-notes"
                type="text"
                className="form-input"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="How did it go?"
                maxLength={200}
              />
            </div>
          </div>
          <button type="submit" className="btn btn--teal" disabled={submitting}>
            {submitting ? "Logging…" : "+ Log Completion"}
          </button>
        </form>
      </section>

      {/* Logs list */}
      <section className="logview__list-section fade-in">
        <h2 className="logview__section-title">History</h2>
        {logs.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state__icon">📭</div>
            <h3>No logs yet</h3>
            <p>Log your first completion above!</p>
          </div>
        ) : (
          <ul className="logview__list">
            {logs.map((log) => (
              <LogEntry key={log._id} log={log} onDelete={handleDelete} />
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}