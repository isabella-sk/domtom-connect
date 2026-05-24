import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { postsService, type Post } from "../services/postsService";

const CATEGORIES = [
  { value: "", label: "Tous" },
  { value: "caf", label: "CAF" },
  { value: "logement", label: "Logement" },
  { value: "sante", label: "Santé" },
  { value: "banque", label: "Banque" },
  { value: "transport", label: "Transport" },
  { value: "telephone", label: "Téléphonie" },
  { value: "crous", label: "CROUS" },
];

export const Guides = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState("");
  const [search, setSearch] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    setLoading(true);
    postsService
      .getAll(category || undefined)
      .then(setPosts)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [category]);

  const filtered = posts.filter(
    (p) =>
      p.title.toLowerCase().includes(search.toLowerCase()) ||
      p.content.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-medium">Guides démarches</h1>
          <p className="text-gray-500 text-sm mt-1">
            Tout ce qu'il faut savoir pour t'installer en France
          </p>
        </div>
        <button
          onClick={() => navigate("/dashboard")}
          className="text-sm text-primary hover:underline"
        >
          ← Tableau de bord
        </button>
      </div>

      <input
        type="text"
        placeholder="Rechercher un guide..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm mb-4 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
      />

      <div className="flex gap-2 flex-wrap mb-6">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.value}
            onClick={() => setCategory(cat.value)}
            className={`px-3 py-1.5 rounded-lg text-sm border transition ${
              category === cat.value
                ? "bg-primary text-white border-primary"
                : "border-gray-300 hover:bg-gray-50"
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center text-gray-400 py-12">Chargement...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center text-gray-400 py-12">
          Aucun guide trouvé
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((post) => (
            <div
              key={post.id}
              className="bg-white border border-gray-100 rounded-xl p-5 hover:border-primary/30 transition cursor-pointer"
            >
              {post.isPinned && (
                <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full mr-2">
                  Épinglé
                </span>
              )}
              <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full capitalize">
                {post.category}
              </span>
              <h3 className="font-medium mt-2 mb-1">{post.title}</h3>
              <p className="text-gray-500 text-sm line-clamp-2">
                {post.content}
              </p>
              <p className="text-gray-400 text-xs mt-2">
                Par {post.author.username} ·{" "}
                {new Date(post.createdAt).toLocaleDateString("fr-FR")}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
