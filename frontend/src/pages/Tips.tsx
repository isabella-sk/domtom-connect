import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Lightbulb, BookOpen, ArrowLeft, Plus, X, Send } from "lucide-react";
import api from "../services/api";

interface Tip {
  id: string;
  title: string;
  content: string;
  type: string;
  createdAt: string;
  author: {
    id: string;
    username: string;
    avatarUrl?: string;
    originTerritory: string;
  };
}

export const Tips = () => {
  const navigate = useNavigate();
  const [tips, setTips] = useState<Tip[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "tip" | "testimonial">("all");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: "", content: "", type: "tip" });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const params = filter !== "all" ? `?type=${filter}` : "";

    api
      .get(`/tips${params}`)
      .then((r) => {
        if (!cancelled) {
          setTips(r.data);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          console.error(err);
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
      setLoading(true);
    };
  }, [filter]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post("/tips", form);
      setSubmitted(true);
      setShowForm(false);
      setForm({ title: "", content: "", type: "tip" });
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ maxWidth: 760, margin: "0 auto", padding: "24px 16px" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: 24,
        }}
      >
        <div>
          <button
            onClick={() => navigate("/dashboard")}
            style={{
              fontSize: 12,
              color: "#888",
              border: "none",
              background: "none",
              cursor: "pointer",
              marginBottom: 8,
              display: "flex",
              alignItems: "center",
              gap: 4,
            }}
          >
            <ArrowLeft size={12} /> Tableau de bord
          </button>
          <h1 style={{ fontSize: 22, fontWeight: 500, margin: 0 }}>
            Tips & Témoignages
          </h1>
          <p style={{ fontSize: 13, color: "#888", margin: "4px 0 0" }}>
            Des étudiants ultramarins partagent leur vécu
          </p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          style={{
            padding: "9px 18px",
            background: "#1D9E75",
            color: "#fff",
            border: "none",
            borderRadius: 10,
            fontSize: 13,
            cursor: "pointer",
            fontWeight: 500,
            display: "flex",
            alignItems: "center",
            gap: 6,
          }}
        >
          <Plus size={14} /> Partager
        </button>
      </div>

      {submitted && (
        <div
          style={{
            background: "#E1F5EE",
            border: "0.5px solid #5DCAA5",
            borderRadius: 10,
            padding: "10px 14px",
            fontSize: 13,
            color: "#085041",
            marginBottom: 16,
          }}
        >
          Merci ! Ton partage est en attente de validation par l'équipe.
        </div>
      )}

      {showForm && (
        <div
          style={{
            background: "#fff",
            border: "0.5px solid #EAEAE8",
            borderRadius: 14,
            padding: 20,
            marginBottom: 20,
          }}
        >
          <h3 style={{ fontSize: 14, fontWeight: 500, marginBottom: 14 }}>
            Partager ton expérience
          </h3>
          <form
            onSubmit={handleSubmit}
            style={{ display: "flex", flexDirection: "column", gap: 12 }}
          >
            <div style={{ display: "flex", gap: 10 }}>
              {(["tip", "testimonial"] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setForm({ ...form, type: t })}
                  style={{
                    flex: 1,
                    padding: "8px 0",
                    borderRadius: 8,
                    cursor: "pointer",
                    fontSize: 13,
                    border:
                      form.type === t
                        ? "2px solid #1D9E75"
                        : "0.5px solid #ddd",
                    background: form.type === t ? "#E1F5EE" : "#fff",
                    color: form.type === t ? "#085041" : "#444",
                    fontWeight: form.type === t ? 500 : 400,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 6,
                  }}
                >
                  {t === "tip" ? (
                    <>
                      <Lightbulb size={13} /> Bon plan
                    </>
                  ) : (
                    <>
                      <BookOpen size={13} /> Témoignage
                    </>
                  )}
                </button>
              ))}
            </div>
            <input
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="Titre (ex: Comment trouver une coloc rapidement)"
              required
              minLength={5}
              style={{
                padding: "9px 12px",
                border: "0.5px solid #ddd",
                borderRadius: 8,
                fontSize: 13,
              }}
            />
            <textarea
              value={form.content}
              onChange={(e) => setForm({ ...form, content: e.target.value })}
              placeholder="Raconte ton expérience, partage ton conseil..."
              required
              minLength={20}
              rows={5}
              style={{
                padding: "9px 12px",
                border: "0.5px solid #ddd",
                borderRadius: 8,
                fontSize: 13,
                resize: "none",
                fontFamily: "inherit",
              }}
            />
            <div style={{ display: "flex", gap: 8 }}>
              <button
                type="submit"
                disabled={submitting}
                style={{
                  padding: "9px 20px",
                  background: "#1D9E75",
                  color: "#fff",
                  border: "none",
                  borderRadius: 8,
                  fontSize: 13,
                  cursor: "pointer",
                  opacity: submitting ? 0.7 : 1,
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                <Send size={13} /> {submitting ? "Envoi..." : "Envoyer"}
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                style={{
                  padding: "9px 20px",
                  background: "#fff",
                  border: "0.5px solid #ddd",
                  borderRadius: 8,
                  fontSize: 13,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                <X size={13} /> Annuler
              </button>
            </div>
          </form>
        </div>
      )}

      <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
        {(["all", "tip", "testimonial"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            style={{
              padding: "6px 16px",
              borderRadius: 20,
              cursor: "pointer",
              fontSize: 13,
              border: filter === f ? "none" : "0.5px solid #ddd",
              background: filter === f ? "#1D9E75" : "#fff",
              color: filter === f ? "#fff" : "#555",
            }}
          >
            {f === "all" ? "Tout" : f === "tip" ? "Bons plans" : "Témoignages"}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ textAlign: "center", color: "#aaa", padding: 40 }}>
          Chargement...
        </div>
      ) : tips.length === 0 ? (
        <div
          style={{
            textAlign: "center",
            color: "#aaa",
            padding: 40,
            fontSize: 14,
          }}
        >
          Aucun contenu pour l'instant - sois le premier à partager !
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {tips.map((tip) => (
            <div
              key={tip.id}
              style={{
                background: "#fff",
                border: "0.5px solid #EAEAE8",
                borderRadius: 14,
                padding: "18px 20px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  marginBottom: 10,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div
                    style={{
                      width: 34,
                      height: 34,
                      borderRadius: "50%",
                      background: "#E1F5EE",
                      color: "#085041",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 13,
                      fontWeight: 500,
                      flexShrink: 0,
                      overflow: "hidden",
                    }}
                  >
                    {tip.author.avatarUrl ? (
                      <img
                        src={tip.author.avatarUrl}
                        alt=""
                        style={{
                          width: "100%",
                          height: "100%",
                          objectFit: "cover",
                        }}
                      />
                    ) : (
                      tip.author.username[0].toUpperCase()
                    )}
                  </div>
                  <div>
                    <p style={{ fontSize: 13, fontWeight: 500, margin: 0 }}>
                      {tip.author.username}
                    </p>
                    <p style={{ fontSize: 11, color: "#888", margin: 0 }}>
                      {tip.author.originTerritory}
                    </p>
                  </div>
                </div>
                <span
                  style={{
                    padding: "3px 10px",
                    borderRadius: 20,
                    fontSize: 11,
                    fontWeight: 500,
                    background: tip.type === "tip" ? "#FAEEDA" : "#E6F1FB",
                    color: tip.type === "tip" ? "#633806" : "#0C447C",
                    display: "flex",
                    alignItems: "center",
                    gap: 5,
                  }}
                >
                  {tip.type === "tip" ? (
                    <>
                      <Lightbulb size={11} /> Bon plan
                    </>
                  ) : (
                    <>
                      <BookOpen size={11} /> Témoignage
                    </>
                  )}
                </span>
              </div>
              <h3
                style={{
                  fontSize: 15,
                  fontWeight: 500,
                  margin: "0 0 8px",
                  color: "#111",
                }}
              >
                {tip.title}
              </h3>
              <p
                style={{
                  fontSize: 13,
                  color: "#555",
                  lineHeight: 1.7,
                  margin: 0,
                }}
              >
                {tip.content}
              </p>
              <p style={{ fontSize: 11, color: "#bbb", margin: "10px 0 0" }}>
                {new Date(tip.createdAt).toLocaleDateString("fr-FR", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
