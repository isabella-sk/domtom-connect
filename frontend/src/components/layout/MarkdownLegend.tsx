/**
 * Petite légende markdown à afficher sous les textareas de contenu.
 * Indique aux utilisateurs les formatages disponibles.
 */
export const MarkdownLegend = () => (
  <div
    style={{
      display: "flex",
      flexWrap: "wrap",
      gap: "6px 14px",
      marginTop: 6,
      padding: "8px 12px",
      background: "#F9FAFB",
      border: "1px solid #e5e7eb",
      borderRadius: 8,
    }}
    aria-label="Aide au formatage"
  >
    <span
      style={{
        fontSize: 11,
        color: "#888",
        fontWeight: 600,
        width: "100%",
        marginBottom: 2,
      }}
    >
      Mise en forme disponible :
    </span>
    {[
      { syntax: "**gras**", label: "Gras" },
      { syntax: "*italique*", label: "Italique" },
      { syntax: "## Titre", label: "Titre" },
      { syntax: "- élément", label: "Liste" },
      { syntax: "1. élément", label: "Liste numérotée" },
      { syntax: "[texte](url)", label: "Lien" },
      { syntax: "> citation", label: "Citation" },
    ].map(({ syntax, label }) => (
      <span
        key={syntax}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 4,
          fontSize: 11,
          color: "#666",
        }}
      >
        <code
          style={{
            background: "#e5e7eb",
            padding: "1px 5px",
            borderRadius: 4,
            fontFamily: "monospace",
            fontSize: 11,
            color: "#0a1d52",
          }}
        >
          {syntax}
        </code>
        <span style={{ color: "#aaa" }}>→ {label}</span>
      </span>
    ))}
  </div>
);
