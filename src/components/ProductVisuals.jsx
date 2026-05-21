/**
 * Кружки под карточкой продукта.
 *
 * Для type === "ice_cream":
 *   slot 0: Product.image  → подпись «цвет» (если картинки нет — заливка product.color)
 *   slot 1: Product.logos[0]
 *   slot 2: Product.logos[1]
 *
 * Для type === "tea":
 *   slot 0: tea_flavor_combination[0].logo → подпись = name чая
 *   slot 1: logos[0].image
 *   slot 2: logos[1].image
 *   Слот без src пропускается; если ни одного — компонент не рендерится.
 */
export default function ProductVisuals({ product }) {
  if (product?.type === "tea") {
    const logos = product?.logos || [];
    const teaCombo = (product?.tea_flavor_combination || [])[0];
    const slots = [
      { src: teaCombo?.logo || null, label: teaCombo?.name || "" },
      { src: logos[0]?.image || null, label: logos[0]?.text || "" },
      { src: logos[1]?.image || null, label: logos[1]?.text || "" },
    ].filter((s) => s.src);

    if (slots.length === 0) return null;

    return (
      <div className="axes axes--compact">
        {slots.map((s, i) => (
          <div className="axis" key={i}>
            <div className="axis__plain">
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
            </div>
            <div className={`axis__label ${s.label ? "" : "axis__label--empty"}`}>
              {s.label || " "}
            </div>
          </div>
        ))}
      </div>
    );
  }

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
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 999,
                  background: product?.color || "var(--stone-100)",
                }}
              />
            )}
          </div>
          <div className={`axis__label ${s.label ? "" : "axis__label--empty"}`}>
            {s.label || " "}
          </div>
        </div>
      ))}
    </div>
  );
}
