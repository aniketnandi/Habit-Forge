import { NavLink, useNavigate } from "react-router-dom";
import { useUser } from "../../context/UserContext.jsx";
import "./Navbar.css";

export default function Navbar() {
  const { user, logout } = useUser();
  const navigate = useNavigate();

  async function handleLogout() {
    await logout();
    navigate("/login");
  }

  return (
    <header className="navbar">
      <div className="navbar__inner">
        <NavLink to="/" className="navbar__brand">
          <span className="navbar__flame">🔥</span>
          <span className="navbar__title">HabitForge</span>
        </NavLink>
        <nav className="navbar__nav">
          <NavLink
            to="/"
            end
            className={({ isActive }) =>
              isActive ? "navbar__link navbar__link--active" : "navbar__link"
            }
          >
            Dashboard
          </NavLink>
          <NavLink
            to="/analytics"
            className={({ isActive }) =>
              isActive ? "navbar__link navbar__link--active" : "navbar__link"
            }
          >
            Analytics
          </NavLink>
          {user && (
            <div className="navbar__user">
              <span className="navbar__username">👤 {user.username}</span>
              <button className="navbar__logout" onClick={handleLogout}>
                Sign Out
              </button>
            </div>
          )}
        </nav>
      </div>
    </header>
  );
}
