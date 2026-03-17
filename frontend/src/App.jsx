import { Routes, Route, Navigate } from "react-router-dom";
import Navbar from "./components/Navbar/Navbar.jsx";
import Dashboard from "./components/Dashboard/Dashboard.jsx";
import LogView from "./components/LogView/LogView.jsx";
import Analytics from "./components/Analytics/Analytics.jsx";

export default function App() {
  return (
    <>
      <Navbar />
      <main>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/logs/:habitId" element={<LogView />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </>
  );
}
