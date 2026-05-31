export default function Logomark({ size = "md", label }) {
  const px = size === "lg" ? 120 : 75;
  return (
    <div className="logomark">
      <img
        src="/tea_logo.webp"
        alt="Логотип"
        className="logomark__img"
        style={{ width: px, height: "auto" }}
      />
      {label && (
        <span className="eyebrow" style={{ color: "var(--stone-500)" }}>
          {label}
        </span>
      )}
    </div>
  );
}
