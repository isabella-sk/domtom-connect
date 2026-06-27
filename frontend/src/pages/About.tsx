import { useNavigate } from "react-router-dom";
import { Navbar } from "../components/layout/Navbar";
import { Footer } from "../components/layout/Footer";
import { useMobile } from "../hooks/useMobile";
import heroPattern from "../assets/banner-hero-pattern.svg";
import motifBambouHorizontal from "../assets/bandeau-motif.png";
import imgIsabella from "../assets/img-isabella-panorama.jpg";
import people from "../assets/people.svg";

const VALUES = [
  {
    title: "Vécu",
    desc: "Chaque conseil, chaque guide vient d'une expérience réelle, pas d'une théorie lue sur un forum.",
  },
  {
    title: "Simplicité",
    desc: "On centralise l'essentiel pour éviter de se perdre dans des dizaines d'onglets et d'infos contradictoires.",
  },
  {
    title: "Sécurité",
    desc: "Repérer les pièges et les arnaques avant qu'ils ne touchent quelqu'un d'autre.",
  },
  {
    title: "Communauté",
    desc: "Se sentir moins seul(e) en arrivant, grâce à d'autres étudiants ultramarins déjà passés par là.",
  },
];

const STEPS = [
  {
    title: "Le départ",
    desc: "Originaire de Wallis et Futuna, né et élevé en Nouvelle-Calédonie, j'ai obtenu mon BTS avant de faire le grand saut vers la France métropolitaine pour continuer mes études.",
  },
  {
    title: "L'arrivée à l'aveugle",
    desc: "Une école trouvée, un appartement réservé à Lille, mais aucune garantie d'alternance. Beaucoup d'informations en ligne, mais éparpillées, contradictoires, parfois dépassées.",
  },
  {
    title: "Le premier rebond",
    desc: "Quelques jours après mon arrivée à Lille, j'ai dû tout quitter en urgence : le quartier s'est révélé bien trop dangereux pour y rester.",
  },
  {
    title: "L'imprévu",
    desc: "Direction la famille, près de Paris, le temps de souffler et de construire un plan B : Montpellier, ville étudiante.",
  },
  {
    title: "Le coup dur",
    desc: "En pleine recherche de logement à Montpellier, j'ai été victime d'une fraude bancaire. Un vrai coup d'arrêt, et beaucoup de doutes.",
  },
  {
    title: "Le rebond final",
    desc: "Après en avoir parlé avec mes proches, j'ai choisi de rester là où j'étais déjà accepté en école. Rentrée en cours, recherche d'appartement, recherche d'alternance : tout s'est enchaîné.",
  },
];

export const About = () => {
  const navigate = useNavigate();
  const isMobile = useMobile();

  return (
    <div className="font-sans min-h-screen">
      {/* Hero */}
      <div
        style={{
          background:
            "radial-gradient(ellipse 140% 120% at 50% 35%, #3ab5e6 0%, #14539E 40%, #0a1d52 80%)",
        }}
      >
        <section
          aria-label="Présentation"
          style={{
            minHeight: "60vh",
            display: "flex",
            flexDirection: "column",
            position: "relative",
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
              padding: isMobile ? "40px 20px" : "60px 20px",
              zIndex: 1,
              position: "relative",
              textAlign: "center",
            }}
          >
            <p
              style={{
                color: "rgba(255,255,255,0.85)",
                fontSize: 16,
                textTransform: "uppercase",
                letterSpacing: "0.15em",
                marginBottom: 16,
              }}
            >
              Notre histoire
            </p>
            <h1
              style={{
                fontSize: isMobile
                  ? "clamp(30px, 8vw, 48px)"
                  : "clamp(40px, 6vw, 64px)",
                fontWeight: 800,
                margin: "0 0 24px",
                letterSpacing: "-1.5px",
                lineHeight: 1.1,
                color: "#0a1d52",
              }}
            >
              Pourquoi DOM-TOM Connect ?
            </h1>
            <p
              style={{
                color: "#0a1d52",
                fontSize: isMobile ? 16 : 18,
                lineHeight: 1.7,
                maxWidth: 720,
                padding: "0 8px",
              }}
            >
              Parce que personne ne devrait avoir à découvrir la métropole
              seul·e, sans repères et sans filet de sécurité.
            </p>
          </div>
        </section>
        <div
          aria-hidden="true"
          style={{
            height: 36,
            overflow: "hidden",
            backgroundImage: `url(${motifBambouHorizontal})`,
          }}
        />
      </div>

      {/* Timeline */}
      <section
        aria-label="Mon parcours"
        style={{
          background:
            "radial-gradient(ellipse at 50% 100%, #1a4fa0 0%, #0a1d52 50%, #040e2e 100%)",
          padding: isMobile ? "60px 20px" : "80px 60px",
        }}
      >
        <div style={{ maxWidth: 800, margin: "0 auto", textAlign: "center" }}>
          <p
            style={{
              color: "rgba(255,255,255,0.7)",
              fontSize: 16,
              textTransform: "uppercase",
              letterSpacing: "0.1em",
              marginBottom: 12,
            }}
          >
            Mon parcours
          </p>
          <h2
            style={{
              color: "#fff",
              fontSize: isMobile ? 24 : "clamp(24px, 4vw, 38px)",
              fontWeight: 700,
              marginBottom: 16,
              lineHeight: 1.2,
            }}
          >
            De la Nouvelle-Calédonie à la métropole,{" "}
            <span style={{ color: "#2888C5" }}>sans mode d'emploi</span>.
          </h2>
          <p
            style={{
              color: "rgba(255,255,255,0.7)",
              fontSize: isMobile ? 16 : 18,
              lineHeight: 1.7,
              marginBottom: 0,
            }}
          >
            Originaire de Wallis et Futuna, j'ai grandi en Nouvelle-Calédonie.
            Après l'obtention d'un BTS, j'ai pris la décision de partir étudier
            en France métropolitaine.
          </p>
          <img
            src={imgIsabella}
            alt="Panorama"
            style={{
              width: "100%",
              marginTop: 20,
              marginBottom: 20,
              borderRadius: isMobile ? 16 : 30,
            }}
          />
        </div>

        <div
          style={{
            maxWidth: 800,
            margin: "56px auto 0",
            display: "flex",
            flexDirection: "column",
            gap: 0,
          }}
        >
          {STEPS.map((step, i) => (
            <div
              key={step.title}
              style={{
                display: "flex",
                gap: isMobile ? 16 : 24,
                position: "relative",
              }}
            >
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  flexShrink: 0,
                }}
              >
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: "50%",
                    background: "#2888C5",
                    color: "#fff",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontWeight: 700,
                    fontSize: 14,
                    flexShrink: 0,
                  }}
                  aria-hidden="true"
                >
                  {i + 1}
                </div>
                {i < STEPS.length - 1 && (
                  <div
                    style={{
                      width: 2,
                      flex: 1,
                      background: "rgba(255,255,255,0.15)",
                      minHeight: 40,
                    }}
                    aria-hidden="true"
                  />
                )}
              </div>
              <div style={{ paddingBottom: 32 }}>
                <h3
                  style={{
                    color: "#fff",
                    fontSize: isMobile ? 16 : 18,
                    fontWeight: 600,
                    marginBottom: 6,
                    marginTop: 4,
                  }}
                >
                  {step.title}
                </h3>
                <p
                  style={{
                    color: "rgba(255,255,255,0.7)",
                    fontSize: isMobile ? 14 : 16,
                    lineHeight: 1.7,
                  }}
                >
                  {step.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Mission */}
      <section
        aria-label="La mission"
        style={{
          background: "#040e2e",
          padding: isMobile ? "60px 20px" : "80px 60px",
          textAlign: "center",
        }}
      >
        <div style={{ maxWidth: 800, margin: "0 auto" }}>
          <p
            style={{
              color: "rgba(255,255,255,0.7)",
              fontSize: 16,
              textTransform: "uppercase",
              letterSpacing: "0.1em",
              marginBottom: 12,
            }}
          >
            La mission
          </p>
          <h2
            style={{
              color: "#fff",
              fontSize: isMobile ? 24 : "clamp(24px, 4vw, 38px)",
              fontWeight: 700,
              marginBottom: 16,
              lineHeight: 1.2,
            }}
          >
            Donner aux étudiants ultramarins ce que{" "}
            <span style={{ color: "#2888C5" }}>je n'avais pas</span>.
          </h2>
          <p
            style={{
              color: "rgba(255,255,255,0.7)",
              fontSize: isMobile ? 15 : 18,
              lineHeight: 1.8,
            }}
          >
            Quand on quitte les outre-mer pour étudier en métropole, on part
            souvent sans filet : pas de famille sur place, pas de repères, et
            une masse d'informations en ligne, éparpillée et parfois
            contradictoire.
            <br />
            <br />
            DOM-TOM Connect est né de cette expérience : une plateforme pensée
            par et pour des étudiants ultramarins, qui regroupe les bons
            réflexes, les démarches essentielles, les retours d'expérience et
            les alertes sur les arnaques les plus courantes.
          </p>
        </div>
      </section>

      {/* Valeurs */}
      <section
        aria-label="Nos valeurs"
        style={{
          background:
            "radial-gradient(ellipse at 50% 0%, #1a4fa0 0%, #0a1d52 50%, #040e2e 100%)",
          padding: isMobile ? "60px 20px" : "80px 60px",
          textAlign: "center",
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
          Nos valeurs
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
          Ce qui guide{" "}
          <span style={{ color: "#2888C5" }}>chaque fonctionnalité</span>.
        </h2>
        <p
          style={{
            color: "rgba(255,255,255,0.7)",
            fontSize: isMobile ? 15 : 18,
            maxWidth: 600,
            margin: "0 auto 48px",
          }}
        >
          Quatre principes simples qui orientent tout ce qu'on construit.
        </p>

        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 40,
            maxWidth: 1200,
            margin: "0 auto",
            alignItems: "center",
          }}
        >
          <div style={{ flex: "1 1 300px" }}>
            <img
              src={people}
              alt="Illustration de personnes"
              style={{
                width: "100%",
                maxWidth: 600,
                display: "block",
                margin: "0 auto",
              }}
            />
          </div>
          <div
            style={{
              flex: "1 1 300px",
              display: "grid",
              gridTemplateColumns: isMobile ? "1fr" : "repeat(2, 1fr)",
              gap: 20,
            }}
          >
            {VALUES.map((v) => (
              <div
                key={v.title}
                style={{
                  background: "#fff",
                  borderRadius: 16,
                  padding: "24px 20px",
                  textAlign: "left",
                }}
              >
                <h3
                  style={{
                    fontSize: 18,
                    fontWeight: 600,
                    color: "#0a1d52",
                    marginBottom: 8,
                    marginTop: 0,
                  }}
                >
                  {v.title}
                </h3>
                <p
                  style={{
                    fontSize: 15,
                    color: "#555",
                    lineHeight: 1.6,
                    margin: 0,
                  }}
                >
                  {v.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
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
            fontSize: isMobile ? 22 : 30,
            fontWeight: 700,
            marginBottom: 12,
          }}
        >
          Toi aussi, tu pars étudier en métropole ?
        </h2>
        <p
          style={{
            color: "rgba(255,255,255,0.65)",
            fontSize: 15,
            marginBottom: 28,
          }}
        >
          Rejoins une communauté qui sait par quoi tu passes.
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
      <Footer />
    </div>
  );
};
