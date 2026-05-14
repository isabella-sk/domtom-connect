import { useAuth } from "../hooks/useAuth";
import { useNavigate } from "react-router-dom";

export const Dashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-2xl mx-auto bg-white rounded-2xl border border-gray-100 p-8">
        <h1 className="text-2xl font-medium mb-2">
          Bienvenue, {user?.username} ! 👋
        </h1>
        <p className="text-gray-500 mb-1">
          Territoire : {user?.originTerritory}
        </p>
        <p className="text-gray-500 mb-6">Email : {user?.email}</p>
        <button
          onClick={handleLogout}
          className="px-4 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50 transition"
        >
          Se déconnecter
        </button>
      </div>
    </div>
  );
};
