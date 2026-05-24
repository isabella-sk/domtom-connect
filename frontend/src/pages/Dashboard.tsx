import { useAuth } from "../hooks/useAuth";
import { useNavigate } from "react-router-dom";

const QUICK_LINKS = [
  {
    label: "Guides démarches",
    path: "/guides",
    desc: "CAF, logement, santé...",
  },
  { label: "Arnaques signalées", path: "/scams", desc: "Protège-toi" },
  { label: "Carte étudiants", path: "/map", desc: "Trouve des contacts" },
  { label: "Chat", path: "/chat", desc: "Messagerie temps réel" },
];

export const Dashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-medium">
              Bienvenue, {user?.username}
            </h1>
            <p className="text-gray-500 text-sm">{user?.originTerritory}</p>
          </div>
          <button
            onClick={handleLogout}
            className="px-4 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50"
          >
            Se déconnecter
          </button>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {QUICK_LINKS.map((link) => (
            <button
              key={link.path}
              onClick={() => navigate(link.path)}
              className="bg-white border border-gray-100 rounded-xl p-5 text-left hover:border-primary/30 transition group"
            >
              <p className="font-medium group-hover:text-primary transition">
                {link.label}
              </p>
              <p className="text-gray-400 text-sm mt-1">{link.desc}</p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
