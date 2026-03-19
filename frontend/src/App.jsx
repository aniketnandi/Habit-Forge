import { Routes, Route, Navigate } from "react-router-dom";
import { useUser, UserProvider } from "./context/UserContext.jsx";
import Navbar from "./components/Navbar/Navbar.jsx";
import Dashboard from "./components/Dashboard/Dashboard.jsx";
import LogView from "./components/LogView/LogView.jsx";
import Analytics from "./components/Analytics/Analytics.jsx";
import Login from "./components/Login/Login.jsx";
import Register from "./components/Register/Register.jsx";
import PropTypes from "prop-types";

function ProtectedRoute({ children }) {
  const { user, loading } = useUser();
  if (loading) return <div className="spinner">Loading…</div>;
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

ProtectedRoute.propTypes = {
  children: PropTypes.node.isRequired,
};

function AppRoutes() {
  return (
    <>
      <Navbar />
      <main>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/logs/:habitId"
            element={
              <ProtectedRoute>
                <LogView />
              </ProtectedRoute>
            }
          />
          <Route
            path="/analytics"
            element={
              <ProtectedRoute>
                <Analytics />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </>
  );
}

export default function App() {
  return (
    <UserProvider>
      <AppRoutes />
    </UserProvider>
  );
}
