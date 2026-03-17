import { useState, useEffect } from "react";
import PropTypes from "prop-types";
import "./HabitForm.css";

const CATEGORIES = ["Study", "Fitness", "Health", "Mindfulness", "Other"];

export default function HabitForm({ existing, onSave, onClose }) {
  const [name, setName] = useState("");
  const [category, setCategory] = useState("Study");
  const [frequency, setFrequency] = useState("daily");
  const [targetCount, setTargetCount] = useState(3);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [serverError, setServerError] = useState(null);

  const isEditing = Boolean(existing);

  useEffect(() => {
    if (existing) {
      setName(existing.name);
      setCategory(existing.category);
      setFrequency(existing.frequency);
      setTargetCount(existing.targetCount || 3);
    }
  }, [existing]);

  function validate() {
    const errs = {};
    if (!name.trim()) errs.name = "Habit name is required.";
    else if (name.trim().length > 80) errs.name = "Name must be 80 characters or fewer.";
    if (!category) errs.category = "Category is required.";
    if (frequency === "weekly") {
      const n = Number(targetCount);
      if (!n || n < 1 || n > 7) errs.targetCount = "Must be between 1 and 7.";
    }
    return errs;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    setSaving(true);
    setServerError(null);

    const payload = {
      name: name.trim(),
      category,
      frequency,
      targetCount: frequency === "daily" ? 1 : Number(targetCount),
    };

    try {
      const url = isEditing ? `/api/habits/${existing._id}` : "/api/habits";
      const method = isEditing ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save habit");
      onSave(data);
    } catch (err) {
      setServerError(err.message);
    } finally {
      setSaving(false);
    }
  }

  // Close on backdrop click
  function handleBackdropClick(e) {
    if (e.target === e.currentTarget) onClose();
  }

  return (
    <div className="modal-backdrop" onClick={handleBackdropClick} role="dialog" aria-modal="true" aria-labelledby="habit-form-title">
      <div className="modal">
        <div className="modal__header">
          <h2 id="habit-form-title" className="modal__title">
            {isEditing ? "Edit Habit" : "Create New Habit"}
          </h2>
          <button className="modal__close" onClick={onClose} aria-label="Close modal">
            ✕
          </button>
        </div>

        {serverError && <div className="error-box">{serverError}</div>}

        <form className="habit-form" onSubmit={handleSubmit} noValidate>
          <div className="form-group">
            <label className="form-label" htmlFor="habit-name">
              Habit Name <span className="form-required">*</span>
            </label>
            <input
              id="habit-name"
              type="text"
              className={`form-input ${errors.name ? "form-input--error" : ""}`}
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setErrors((prev) => ({ ...prev, name: undefined }));
              }}
              placeholder="e.g. Daily Coding Practice"
              maxLength={80}
              autoFocus
            />
            {errors.name && <p className="form-error">{errors.name}</p>}
            <p className="form-hint">{name.length}/80</p>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="habit-category">
              Category <span className="form-required">*</span>
            </label>
            <select
              id="habit-category"
              className={`form-select ${errors.category ? "form-input--error" : ""}`}
              value={category}
              onChange={(e) => {
                setCategory(e.target.value);
                setErrors((prev) => ({ ...prev, category: undefined }));
              }}
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
            {errors.category && <p className="form-error">{errors.category}</p>}
          </div>

          <fieldset className="form-group form-group--fieldset">
            <legend className="form-label">
              Frequency <span className="form-required">*</span>
            </legend>
            <div className="freq-options">
              <label className={`freq-option ${frequency === "daily" ? "freq-option--active" : ""}`}>
                <input
                  type="radio"
                  name="frequency"
                  value="daily"
                  checked={frequency === "daily"}
                  onChange={() => setFrequency("daily")}
                />
                <span>Daily</span>
              </label>
              <label className={`freq-option ${frequency === "weekly" ? "freq-option--active" : ""}`}>
                <input
                  type="radio"
                  name="frequency"
                  value="weekly"
                  checked={frequency === "weekly"}
                  onChange={() => setFrequency("weekly")}
                />
                <span>Weekly</span>
              </label>
            </div>
          </fieldset>

          {frequency === "weekly" && (
            <div className="form-group">
              <label className="form-label" htmlFor="target-count">
                Times per week <span className="form-required">*</span>
              </label>
              <input
                id="target-count"
                type="number"
                className={`form-input form-input--narrow ${errors.targetCount ? "form-input--error" : ""}`}
                min={1}
                max={7}
                value={targetCount}
                onChange={(e) => {
                  setTargetCount(e.target.value);
                  setErrors((prev) => ({ ...prev, targetCount: undefined }));
                }}
              />
              {errors.targetCount && <p className="form-error">{errors.targetCount}</p>}
            </div>
          )}

          <div className="modal__footer">
            <button type="button" className="btn btn--ghost" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn--primary" disabled={saving}>
              {saving ? "Saving…" : isEditing ? "Save Changes" : "Create Habit"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

HabitForm.propTypes = {
  existing: PropTypes.shape({
    _id: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    category: PropTypes.string.isRequired,
    frequency: PropTypes.string.isRequired,
    targetCount: PropTypes.number,
  }),
  onSave: PropTypes.func.isRequired,
  onClose: PropTypes.func.isRequired,
};

HabitForm.defaultProps = {
  existing: null,
};