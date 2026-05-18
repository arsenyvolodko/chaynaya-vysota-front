/**
 * 3 кружка в карточке продукта:
 *   slot 0: Product.image       → подпись «цвет»
 *   slot 1: Product.logos[0]    → подпись logos[0].text
 *   slot 2: Product.logos[1]    → подпись logos[1].text
 */
export default function ProductVisuals({ product }) {
  const logos = product?.logos || [];
  const slots = [
    { src: product?.image || null, label: "цвет" },
    { src: logos[0]?.image || null, label: logos[0]?.text || "" },
    { src: logos[1]?.image || null, label: logos[1]?.text || "" },
  ];
  return (
    <div className="axes axes--compact">
      {slots.map((s, i) => (
        <div className="axis" key={i}>
          <div className="axis__plain">
            {s.src ? (
              <img
                src={s.src}
                alt=""
                aria-hidden="true"
                style={{
                  maxWidth: 48,
                  maxHeight: 48,
                  width: "auto",
                  height: "auto",
                  objectFit: "contain",
                  background: "transparent",
                }}
              />
            ) : (
              <div style={{ width: 48, height: 48, borderRadius: 999, background: product?.color || "var(--stone-100)" }} />
            )}
          </div>
          <div className={`axis__label ${s.label ? "" : "axis__label--empty"}`}>
            {s.label || " "}
          </div>
        </div>
      ))}
    </div>
  );
}
