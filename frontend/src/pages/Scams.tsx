import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { scamService, type ScamReport } from "../services/scamService";

const CATEGORIES = [
  "logement",
  "banque",
  "emploi",
  "telephone",
  "identite",
  "autre",
];

export const Scams = () => {
  const [scams, setScams] = useState<ScamReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    title: "",
    description: "",
    category: "logement",
  });
  const [submitted, setSubmitted] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    scamService
      .getAll()
      .then(setScams)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await scamService.report(form);
      setSubmitted(true);
      setShowForm(false);
      setForm({ title: "", description: "", category: "logement" });
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-medium">Arnaques signalées</h1>
          <p className="text-gray-500 text-sm mt-1">
            Protège-toi et protège les autres
          </p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 bg-primary text-white text-sm rounded-lg hover:bg-primary/90 transition"
        >
          Signaler une arnaque
        </button>
      </div>

      {submitted && (
        <div className="bg-green-50 border border-green-200 text-green-700 text-sm px-4 py-3 rounded-lg mb-4">
          Merci ! Ton signalement est en attente de vérification.
        </div>
      )}

      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="bg-white border border-gray-100 rounded-xl p-6 mb-6 space-y-4"
        >
          <h3 className="font-medium">Signaler une arnaque</h3>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Titre
            </label>
            <input
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Catégorie
            </label>
            <select
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c} className="capitalize">
                  {c}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              value={form.description}
              onChange={(e) =>
                setForm({ ...form, description: e.target.value })
              }
              rows={4}
              required
              minLength={20}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"
            />
          </div>
          <div className="flex gap-3">
            <button
              type="submit"
              className="px-4 py-2 bg-primary text-white text-sm rounded-lg hover:bg-primary/90"
            >
              Envoyer
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="px-4 py-2 border border-gray-300 text-sm rounded-lg hover:bg-gray-50"
            >
              Annuler
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <div className="text-center text-gray-400 py-12">Chargement...</div>
      ) : scams.length === 0 ? (
        <div className="text-center text-gray-400 py-12">
          Aucune arnaque vérifiée pour l'instant.
        </div>
      ) : (
        <div className="space-y-4">
          {scams.map((s) => (
            <div
              key={s.id}
              className="bg-white border border-gray-100 rounded-xl p-5"
            >
              <span className="text-xs bg-red-50 text-red-600 px-2 py-0.5 rounded-full capitalize">
                {s.category}
              </span>
              <h3 className="font-medium mt-2 mb-1">{s.title}</h3>
              <p className="text-gray-500 text-sm">{s.description}</p>
              <p className="text-gray-400 text-xs mt-2">
                {new Date(s.createdAt).toLocaleDateString("fr-FR")}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
