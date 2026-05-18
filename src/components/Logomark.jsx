export default function Logomark({ size = "md", label }) {
  const px = size === "lg" ? 32 : 26;
  return (
    <div className="logomark">
      <img
        src="/logo_cropped.svg"
        alt="Логотип"
        className="logomark__img"
        style={{ width: px, height: px }}
      />
      {label && (
        <span className="eyebrow" style={{ color: "var(--stone-500)" }}>
          {label}
        </span>
      )}
    </div>
  );
}
