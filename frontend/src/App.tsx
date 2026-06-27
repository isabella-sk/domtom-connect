import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Landing } from "./pages/Landing";
import { Register } from "./pages/Auth/Register";
import { Login } from "./pages/Auth/Login";
import { Dashboard } from "./pages/Dashboard";
import { Guides } from "./pages/guides/Guides";
import { GuideDetails } from "./pages/guides/GuideDetails";
import { Scams } from "./pages/scams/Scams";
import { ScamDetails } from "./pages/scams/ScamDetails";
import { Tips } from "./pages/tips/Tips";
import { TipDetails } from "./pages/tips/TipDetails";
import { Chat } from "./pages/Chat";
import { Map } from "./pages/Map";
import { Profile } from "./pages/Profile";
import { Settings } from "./pages/Settings";
import { AdminDashboard } from "./pages/admin/AdminDashboard";
import { PrivateRoute } from "./components/layout/PrivateRoute";
import { AdminRoute } from "./components/layout/AdminRoute";
import { About } from "./pages/About";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Publiques */}
        <Route path="/" element={<Landing />} />
        <Route path="/about" element={<About />} />
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
          path="/guides/:id"
          element={
            <PrivateRoute>
              <GuideDetails />
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
        <Route
          path="/scams/:id"
          element={
            <PrivateRoute>
              <ScamDetails />
            </PrivateRoute>
          }
        />

        <Route
          path="/tips"
          element={
            <PrivateRoute>
              <Tips />
            </PrivateRoute>
          }
        />
        <Route
          path="/tips/:id"
          element={
            <PrivateRoute>
              <TipDetails />
            </PrivateRoute>
          }
        />

        <Route
          path="/chat"
          element={
            <PrivateRoute>
              <Chat />
            </PrivateRoute>
          }
        />

        <Route
          path="/map"
          element={
            <PrivateRoute>
              <Map />
            </PrivateRoute>
          }
        />
        <Route
          path="/profile/:id"
          element={
            <PrivateRoute>
              <Profile />
            </PrivateRoute>
          }
        />
        <Route
          path="/settings"
          element={
            <PrivateRoute>
              <Settings />
            </PrivateRoute>
          }
        />

        {/* Admin */}
        <Route
          path="/admin"
          element={
            <AdminRoute>
              <AdminDashboard />
            </AdminRoute>
          }
        />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
