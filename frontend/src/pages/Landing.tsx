import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { Navbar } from "../components/layout/Navbar";
import { Footer } from "../components/layout/Footer";
import { useMobile } from "../hooks/useMobile";
import heroPattern from "../assets/banner-hero-pattern.svg";
import motifBambouHorizontal from "../assets/bandeau-motif.png";
import motifBambouCard from "../assets/motif-bambou-card.svg";

const TERRITORIES = [
  "Guadeloupe",
  "Guyane",
  "La Réunion",
  "Martinique",
  "Mayotte",
  "Nouvelle-Calédonie",
  "Polynésie française",
];

const FEATURES = [
  {
    title: "Guides administratifs",
    desc: "CAF, logement, transport, santé... Toutes les démarches expliquées pas à pas.",
  },
  {
    title: "Tips & Témoignages",
    desc: "Des étudiants ultramarins partagent leurs expériences et bons plans pour bien s'installer.",
  },
  {
    title: "Alertes arnaques",
    desc: "Signale et consulte les arnaques vérifiées pour protéger toute la communauté.",
  },
  {
    title: "Carte communautaire",
    desc: "Trouve des étudiants des outres-mer près de chez toi et crée des liens.",
  },
];

const STATS = [
  { value: "+5000", label: "d'étudiants" },
  { value: "7", label: "territoires représentés" },
  { value: "+500", label: "guides rédigés" },
  { value: "100%", label: "gratuit" },
];

export const Landing = () => {
  const navigate = useNavigate();
  const isMobile = useMobile();
  const { user } = useAuth();

  return (
    <div className="font-sans min-h-screen bg-cover bg-center">
      <div
        style={{
          background:
            "radial-gradient(ellipse 140% 120% at 50% 35%, #3ab5e6 0%, #14539E 40%, #0a1d52 80%)",
        }}
      >
        {/* HERO */}
        <section
          aria-label="Présentation de DOM-TOM Connect"
          style={{
            minHeight: "calc(100vh - 72px)",
            display: "flex",
            flexDirection: "column",
            position: "relative",
            overflow: "hidden",
          }}
        >
          <img
            src={heroPattern}
            alt=""
            aria-hidden="true"
            style={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              objectFit: "cover",
              opacity: 0.08,
              pointerEvents: "none",
            }}
          />

          <Navbar />

          <div
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              padding: isMobile ? "32px 20px 60px" : "40px 20px 80px",
              zIndex: 1,
              position: "relative",
            }}
          >
            <p
              style={{
                color: "#0a1d52",
                fontSize: isMobile ? 16 : 20,
                fontWeight: 300,
                marginBottom: 12,
                textAlign: "center",
              }}
            >
              Bienvenue sur
            </p>

            <h1
              style={{
                fontSize: isMobile
                  ? "clamp(40px, 10vw, 60px)"
                  : "clamp(54px, 8vw, 84px)",
                fontWeight: 800,
                margin: "0 0 24px",
                letterSpacing: "-2px",
                lineHeight: 0.95,
                textAlign: "center",
              }}
            >
              <span style={{ color: "#0a1d52" }}>DOM-TOM Connect</span>
            </h1>

            <p
              style={{
                color: "#0a1d52",
                fontSize: isMobile ? 16 : 20,
                lineHeight: 1.7,
                maxWidth: 700,
                textAlign: "center",
                marginBottom: 32,
                padding: "0 8px",
              }}
            >
              Une appli web qui t'accompagne dans ton installation en France :
              démarches administratives, bons plans, alertes arnaques et une
              communauté des outres-mer près de chez toi.
            </p>

            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                justifyContent: "center",
                gap: 8,
                maxWidth: 640,
                padding: "0 16px",
              }}
            >
              {TERRITORIES.map((t) => (
                <span
                  key={t}
                  style={{
                    padding: "7px 16px",
                    background: "#0a1d52",
                    borderRadius: 50,
                    color: "#fff",
                    fontSize: 13,
                  }}
                >
                  {t}
                </span>
              ))}
            </div>

            <div
              style={{
                display: "flex",
                flexDirection: isMobile ? "column" : "row",
                gap: 12,
                marginTop: 36,
                width: isMobile ? "100%" : "auto",
                maxWidth: isMobile ? 320 : "none",
                padding: isMobile ? "0 16px" : 0,
              }}
            >
              {user ? (
                <button
                  onClick={() => navigate("/dashboard")}
                  style={{
                    padding: "12px 32px",
                    background: "#fff",
                    border: "none",
                    borderRadius: 10,
                    color: "#0a1d52",
                    fontSize: 15,
                    fontWeight: 600,
                    cursor: "pointer",
                    minHeight: 48,
                  }}
                >
                  Accéder à mon espace →
                </button>
              ) : (
                <>
                  <button
                    onClick={() => navigate("/register")}
                    style={{
                      padding: "12px 24px",
                      background: "#fff",
                      border: "none",
                      borderRadius: 10,
                      color: "#0a1d52",
                      fontSize: 15,
                      fontWeight: 600,
                      cursor: "pointer",
                      minHeight: 48,
                    }}
                  >
                    Rejoindre la communauté
                  </button>
                  <button
                    onClick={() => navigate("/login")}
                    style={{
                      padding: "12px 32px",
                      background: "rgba(255,255,255,0.15)",
                      border: "1.5px solid rgba(255,255,255,0.5)",
                      borderRadius: 10,
                      color: "#fff",
                      fontSize: 15,
                      cursor: "pointer",
                      minHeight: 48,
                    }}
                  >
                    Se connecter
                  </button>
                </>
              )}
            </div>
          </div>
        </section>

        {/* Bandeau bambou */}
        <div
          aria-hidden="true"
          style={{
            height: 36,
            overflow: "hidden",
            backgroundImage: `url(${motifBambouHorizontal})`,
          }}
        />

        {/* Stats */}
        <section
          aria-label="Chiffres clés"
          style={{
            background: "transparent",
            display: "grid",
            gridTemplateColumns: isMobile ? "repeat(2, 1fr)" : "repeat(4, 1fr)",
            padding: isMobile ? "32px 20px" : "40px 60px",
            gap: isMobile ? 24 : 0,
          }}
        >
          {STATS.map(({ value, label }) => (
            <div key={label} style={{ textAlign: "center", color: "#fff" }}>
              <p
                style={{
                  fontSize: isMobile ? 32 : 40,
                  fontWeight: 700,
                  margin: 0,
                  lineHeight: 1,
                }}
              >
                {value}
              </p>
              <p
                style={{
                  fontSize: isMobile ? 14 : 18,
                  opacity: 0.85,
                  margin: "6px 0 0",
                }}
              >
                {label}
              </p>
            </div>
          ))}
        </section>

        {/* Bandeau bambou */}
        <div
          aria-hidden="true"
          style={{
            height: 36,
            overflow: "hidden",
            backgroundImage: `url(${motifBambouHorizontal})`,
          }}
        />
      </div>

      {/* Features */}
      <section
        id="features"
        aria-label="Fonctionnalités de la plateforme"
        style={{
          background:
            "radial-gradient(ellipse at 50% 100%, #1a4fa0 0%, #0a1d52 50%, #040e2e 100%)",
          padding: isMobile ? "60px 20px" : "80px 60px",
          textAlign: "center",
          position: "relative",
        }}
      >
        <p
          style={{
            color: "rgba(255,255,255,0.7)",
            fontSize: 16,
            textTransform: "uppercase",
            letterSpacing: "0.1em",
            marginBottom: 12,
          }}
        >
          Fonctionnalités
        </p>
        <h2
          style={{
            color: "#fff",
            fontSize: isMobile ? 24 : "clamp(24px, 4vw, 38px)",
            fontWeight: 700,
            marginBottom: 12,
            lineHeight: 1.2,
          }}
        >
          Tout ce dont tu as besoin pour{" "}
          <span style={{ color: "#2888C5" }}>bien t'installer</span>.
        </h2>
        <p
          style={{
            color: "rgba(255,255,255,0.7)",
            fontSize: 18,
            maxWidth: 600,
            margin: "0 auto 48px",
          }}
        >
          Une plateforme complète pour t'accompagner de A à Z dans ton
          intégration.
        </p>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: isMobile
              ? "1fr"
              : "repeat(auto-fit, minmax(240px, 1fr))",
            gap: 24,
            maxWidth: 1000,
            margin: "0 auto",
          }}
        >
          {FEATURES.map((f) => (
            <div
              key={f.title}
              style={{
                background: "#fff",
                borderRadius: 16,
                padding: "28px 24px",
                textAlign: "left",
                position: "relative",
                overflow: "hidden",
              }}
            >
              <img
                src={motifBambouCard}
                alt=""
                aria-hidden="true"
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  width: "100%",
                  height: 8,
                  objectFit: "cover",
                }}
              />
              <h3
                style={{
                  fontSize: 18,
                  fontWeight: 600,
                  color: "#0a1d52",
                  marginBottom: 8,
                  marginTop: 8,
                }}
              >
                {f.title}
              </h3>
              <p
                style={{
                  fontSize: 16,
                  color: "#555",
                  lineHeight: 1.6,
                  marginBottom: 14,
                }}
              >
                {f.desc}
              </p>
              <a
                href="#"
                style={{
                  color: "#1a6fc4",
                  fontSize: 14,
                  fontWeight: 500,
                  textDecoration: "none",
                }}
              >
                En savoir plus →
              </a>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      {!user && (
        <section
          aria-label="Inscription"
          style={{
            background: "#040e2e",
            padding: isMobile ? "48px 20px" : "60px 40px",
            textAlign: "center",
          }}
        >
          <h2
            style={{
              color: "#fff",
              fontSize: isMobile ? 24 : 30,
              fontWeight: 700,
              marginBottom: 12,
            }}
          >
            Prêt(e) à rejoindre la communauté ?
          </h2>
          <p
            style={{
              color: "rgba(255,255,255,0.65)",
              fontSize: 15,
              marginBottom: 28,
            }}
          >
            Inscription gratuite · Aucune carte bancaire requise
          </p>
          <button
            onClick={() => navigate("/register")}
            style={{
              padding: "14px 40px",
              background: "#1a6fc4",
              border: "none",
              borderRadius: 10,
              color: "#fff",
              fontSize: 16,
              fontWeight: 600,
              cursor: "pointer",
              minHeight: 48,
              width: isMobile ? "100%" : "auto",
              maxWidth: isMobile ? 320 : "none",
            }}
          >
            Créer mon compte gratuitement
          </button>
        </section>
      )}
      <Footer />
    </div>
  );
};
