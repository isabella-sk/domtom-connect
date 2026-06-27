export const Footer = () => {
  return (
    <footer
      role="contentinfo"
      style={{
        background: "#040e2e",
        borderTop: "0.5px solid rgba(255,255,255,0.1)",
        padding: "20px 24px",
        display: "flex",
        flexWrap: "wrap",
        justifyContent: "space-between",
        alignItems: "center",
        gap: 8,
      }}
    >
      <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 12, margin: 0 }}>
        DOM-TOM Connect &mdash; {new Date().getFullYear()}
      </p>
      <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 12, margin: 0 }}>
        Fait pour les étudiants ultramarins
      </p>
    </footer>
  );
};
