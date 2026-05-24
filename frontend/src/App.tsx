import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Register } from "./pages/Auth/Register";
import { Login } from "./pages/Auth/Login";
import { Dashboard } from "./pages/Dashboard";
import { Guides } from "./pages/Guides";
import { Scams } from "./pages/Scams";
import { PrivateRoute } from "./components/layout/PrivateRoute";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Redirection de / vers /login par défaut */}
        <Route path="/" element={<Navigate to="/login" replace />} />

        {/* Routes publiques */}
        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<Login />} />

        {/* Routes protégées */}
        <Route
          path="/dashboard"
          element={
            <PrivateRoute>
              <Dashboard />
            </PrivateRoute>
          }
        />
        <Route
          path="/guides"
          element={
            <PrivateRoute>
              <Guides />
            </PrivateRoute>
          }
        />
        <Route
          path="/scams"
          element={
            <PrivateRoute>
              <Scams />
            </PrivateRoute>
          }
        />

        {/* 404 */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
