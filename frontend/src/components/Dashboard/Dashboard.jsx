import { apiFetch } from "../../api.js";
import { useState, useEffect } from "react";
import HabitCard from "../HabitCard/HabitCard.jsx";
import HabitForm from "../HabitForm/HabitForm.jsx";
import "./Dashboard.css";

const CATEGORIES = ["All", "Study", "Fitness", "Health", "Mindfulness", "Other"];
const FREQUENCIES = ["All", "daily", "weekly"];

export default function Dashboard() {
  const [habits, setHabits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editHabit, setEditHabit] = useState(null);
  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState("All");
  const [filterFrequency, setFilterFrequency] = useState("All");

  async function fetchHabits() {
    try {
      setLoading(true);
      const res = await apiFetch("/api/habits");
      if (!res.ok) throw new Error("Failed to fetch habits");
      const data = await res.json();
      setHabits(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchHabits();
  }, []);

  function handleEdit(habit) {
    setEditHabit(habit);
    setShowForm(true);
  }

  async function handleDelete(id) {
    if (!window.confirm("Delete this habit and all its logs? This cannot be undone.")) return;
    try {
      const res = await apiFetch(`/api/habits/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete habit");
      setHabits((prev) => prev.filter((h) => h._id !== id));
    } catch (err) {
      setError(err.message);
    }
  }

  function handleFormClose() {
    setShowForm(false);
    setEditHabit(null);
  }

  function handleFormSave(saved) {
    if (editHabit) {
      setHabits((prev) => prev.map((h) => (h._id === saved._id ? saved : h)));
    } else {
      setHabits((prev) => [saved, ...prev]);
    }
    handleFormClose();
  }

  const filtered = habits.filter((h) => {
    const matchSearch = h.name.toLowerCase().includes(search.toLowerCase());
    const matchCat = filterCategory === "All" || h.category === filterCategory;
    const matchFreq = filterFrequency === "All" || h.frequency === filterFrequency;
    return matchSearch && matchCat && matchFreq;
  });

  const completedToday = habits.filter((h) => h._completedToday).length;

  return (
    <div className="page">
      <div className="dashboard__header fade-in">
        <div className="dashboard__title-row">
          <h1 className="dashboard__title">Your Habits</h1>
          <button className="btn btn--primary" onClick={() => setShowForm(true)}>
            + New Habit
          </button>
        </div>

        <div className="dashboard__stats">
          <div className="stat-chip">
            <span className="stat-chip__num">{habits.length}</span>
            <span className="stat-chip__label">Total Habits</span>
          </div>
          <div className="stat-chip stat-chip--teal">
            <span className="stat-chip__num">{filtered.length}</span>
            <span className="stat-chip__label">Showing</span>
          </div>
        </div>

        <div className="dashboard__filters">
          <input
            type="search"
            className="filter-input"
            placeholder="🔍  Search habits..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label="Search habits"
          />
          <select
            className="filter-select"
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            aria-label="Filter by category"
          >
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c === "All" ? "All Categories" : c}
              </option>
            ))}
          </select>
          <select
            className="filter-select"
            value={filterFrequency}
            onChange={(e) => setFilterFrequency(e.target.value)}
            aria-label="Filter by frequency"
          >
            {FREQUENCIES.map((f) => (
              <option key={f} value={f}>
                {f === "All" ? "All Frequencies" : f.charAt(0).toUpperCase() + f.slice(1)}
              </option>
            ))}
          </select>
        </div>
      </div>

      {error && <div className="error-box">{error}</div>}

      {loading ? (
        <div className="spinner">Loading habits…</div>
      ) : filtered.length === 0 ? (
        <div className="empty-state fade-in">
          <div className="empty-state__icon">🌱</div>
          <h3>{habits.length === 0 ? "No habits yet" : "No matching habits"}</h3>
          <p>
            {habits.length === 0
              ? "Click '+ New Habit' to start building your consistency."
              : "Try adjusting your search or filters."}
          </p>
        </div>
      ) : (
        <ul className="dashboard__list">
          {filtered.map((habit, i) => (
            <li key={habit._id} className="fade-in" style={{ animationDelay: `${i * 0.04}s` }}>
              <HabitCard habit={habit} onEdit={handleEdit} onDelete={handleDelete} />
            </li>
          ))}
        </ul>
      )}

      {showForm && (
        <HabitForm
          existing={editHabit}
          onSave={handleFormSave}
          onClose={handleFormClose}
        />
      )}
    </div>
  );
}