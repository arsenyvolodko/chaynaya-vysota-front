import { useEffect, useRef, useState } from "react";

// Лёгкое выпадающее меню, привязанное к кнопке-триггеру. Закрывается по
// клику вне себя. `trigger` — render-prop с { open, toggle }, `children` —
// render-prop с { close } для содержимого панели.
export default function Dropdown({ trigger, children, align = "right" }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e) => {
      if (!ref.current?.contains(e.target)) setOpen(false);
    };
    document.addEventListener("pointerdown", onDown, true);
    return () => document.removeEventListener("pointerdown", onDown, true);
  }, [open]);

  const close = () => setOpen(false);
  const toggle = () => setOpen((o) => !o);

  return (
    <div className="dropdown" ref={ref}>
      {trigger({ open, toggle })}
      {open && (
        <div className={`dropdown__panel dropdown__panel--${align}`} role="menu">
          {typeof children === "function" ? children({ close }) : children}
        </div>
      )}
    </div>
  );
}
