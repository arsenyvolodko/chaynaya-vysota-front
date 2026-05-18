// Lightweight inline SVG icons in the Lucide style.
// Outline-only, 1.75 stroke, currentColor. Wrap in <span> so callers can size with font-size.

const Icon = ({ size = 20, stroke = 1.75, children, style, ...rest }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={stroke}
    strokeLinecap="round"
    strokeLinejoin="round"
    style={style}
    {...rest}
  >
    {children}
  </svg>
);

const IconUser = (p) => (
  <Icon {...p}>
    <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </Icon>
);

const IconChevronLeft = (p) => (
  <Icon {...p}>
    <path d="M15 18l-6-6 6-6" />
  </Icon>
);

const IconBookmark = ({ filled, ...p }) => (
  <Icon {...p}>
    <path
      d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"
      fill={filled ? "currentColor" : "none"}
    />
  </Icon>
);

const IconStar = ({ filled, ...p }) => (
  <Icon {...p}>
    <polygon
      points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"
      fill={filled ? "currentColor" : "none"}
    />
  </Icon>
);

const IconPhone = (p) => (
  <Icon {...p}>
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
  </Icon>
);

const IconArrowRight = (p) => (
  <Icon {...p}>
    <path d="M5 12h14" />
    <path d="M13 5l7 7-7 7" />
  </Icon>
);

const IconCheck = (p) => (
  <Icon {...p}>
    <path d="M20 6L9 17l-5-5" />
  </Icon>
);

const IconLeaf = (p) => (
  <Icon {...p}>
    <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10z" />
    <path d="M2 21c0-3 1.85-5.36 5.08-6" />
  </Icon>
);

const IconDroplet = (p) => (
  <Icon {...p}>
    <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" />
  </Icon>
);

const IconFlame = (p) => (
  <Icon {...p}>
    <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" />
  </Icon>
);

const IconSparkles = (p) => (
  <Icon {...p}>
    <path d="M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9L12 3z" />
    <path d="M19 17l.95 2.55L22 20.5l-2.05.95L19 24l-.95-2.55L16 20.5l2.05-.95L19 17z" />
    <path d="M5 14l.6 1.6L7 16l-1.4.4L5 18l-.6-1.6L3 16l1.4-.4L5 14z" />
  </Icon>
);

const IconShare = (p) => (
  <Icon {...p}>
    <circle cx="18" cy="5" r="3" />
    <circle cx="6" cy="12" r="3" />
    <circle cx="18" cy="19" r="3" />
    <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
    <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
  </Icon>
);

const IconCopy = (p) => (
  <Icon {...p}>
    <rect x="9" y="9" width="13" height="13" rx="2" />
    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
  </Icon>
);

const IconGift = (p) => (
  <Icon {...p}>
    <rect x="3" y="8" width="18" height="4" rx="1" />
    <path d="M12 8v13" />
    <path d="M19 12v7a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-7" />
    <path d="M7.5 8a2.5 2.5 0 0 1 0-5C11 3 12 8 12 8" />
    <path d="M16.5 8a2.5 2.5 0 0 0 0-5C13 3 12 8 12 8" />
  </Icon>
);

const IconGrip = (p) => (
  <Icon {...p}>
    <circle cx="9" cy="6" r="1" />
    <circle cx="9" cy="12" r="1" />
    <circle cx="9" cy="18" r="1" />
    <circle cx="15" cy="6" r="1" />
    <circle cx="15" cy="12" r="1" />
    <circle cx="15" cy="18" r="1" />
  </Icon>
);

const IconChevronRight = (p) => (
  <Icon {...p}>
    <path d="M9 18l6-6-6-6" />
  </Icon>
);

const IconHeart = ({ filled, ...p }) => (
  <Icon {...p}>
    <path
      d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"
      fill={filled ? "currentColor" : "none"}
    />
  </Icon>
);

const IconInfo = (p) => (
  <Icon {...p}>
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="16" x2="12" y2="12" />
    <line x1="12" y1="8" x2="12.01" y2="8" />
  </Icon>
);

Object.assign(window, {
  Icon,
  IconUser,
  IconChevronLeft,
  IconChevronRight,
  IconBookmark,
  IconStar,
  IconPhone,
  IconArrowRight,
  IconCheck,
  IconLeaf,
  IconDroplet,
  IconFlame,
  IconSparkles,
  IconShare,
  IconCopy,
  IconGift,
  IconGrip,
  IconHeart,
  IconInfo,
});

// ─── Detail page flavor glyphs ──────────────────────────────────────────────
// 1) Ice-cream colour swatch (no caption)
// 2) Tea glyph (one per tea kind)
// 3) Ice-cream-type glyph (one per type)

const ColorSwatch = ({ color, size = 56 }) => {
  const uid = "g-" + color.replace(/[^a-z0-9]/gi, "");
  return (
    <svg width={size} height={size} viewBox="0 0 60 60" aria-hidden="true">
      <defs>
        <radialGradient id={uid} cx="38%" cy="32%" r="65%">
          <stop offset="0%" stopColor="white" stopOpacity="0.6" />
          <stop offset="55%" stopColor={color} stopOpacity="0" />
          <stop offset="100%" stopColor="#000" stopOpacity="0.06" />
        </radialGradient>
      </defs>
      <circle cx="30" cy="30" r="22" fill={color} />
      <circle cx="30" cy="30" r="22" fill={`url(#${uid})`} />
    </svg>
  );
};

// Filled tea-leaf shapes — each tea kind gets a distinct silhouette.
// Style: solid filled glyphs in the tea's brewed colour, matching the
// reference photo's chevron leaves.
const TEA_PALETTE = {
  "зелёный":  "#7FA858",
  "красный":  "#C26A4A",
  "белый":    "#D6CDB3",
  "улун":     "#B8945B",
  "шэн пуэр": "#9CB874",
  "шу пуэр":  "#6A4A33",
  "копчёный": "#7E5A40",
};

const TeaGlyph = ({ tea, size = 56 }) => {
  const fill = TEA_PALETTE[tea] || "#8B8170";
  const props = { width: size, height: size, viewBox: "0 0 60 60", fill, "aria-hidden": "true" };

  switch (tea) {
    case "зелёный":
      // Two pointed leaves forming a chevron — matches the reference photo.
      return (
        <svg {...props}>
          <path d="M30 14 L20 50 L30 44 Z" />
          <path d="M30 14 L40 50 L30 44 Z" opacity="0.85" />
        </svg>
      );
    case "красный":
      // A single broad leaf with a stem and central vein.
      return (
        <svg {...props}>
          <path d="M30 12 C44 22 44 40 30 50 C16 40 16 22 30 12 Z" />
          <path d="M30 14 L30 48" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" fill="none" opacity="0.45" />
        </svg>
      );
    case "белый":
      // Silver-needle bud — slender almond shape with a pale tone.
      return (
        <svg {...props}>
          <path d="M30 10 C36 22 36 38 30 50 C24 38 24 22 30 10 Z" />
          <ellipse cx="30" cy="22" rx="2" ry="5" fill="#fff" opacity="0.7" />
        </svg>
      );
    case "улун":
      // Twisted / curled leaf — comma shape.
      return (
        <svg {...props}>
          <path d="M44 16 C44 30 30 30 22 36 C18 39 16 44 18 48 C24 46 30 42 36 36 C44 28 46 22 44 16 Z" />
          <circle cx="40" cy="20" r="3" fill="#fff" opacity="0.55" />
        </svg>
      );
    case "шэн пуэр":
      // Compressed cake — round disc with a center divot, green-tinted.
      return (
        <svg {...props}>
          <circle cx="30" cy="30" r="18" />
          <circle cx="30" cy="30" r="4" fill="#fff" opacity="0.55" />
        </svg>
      );
    case "шу пуэр":
      // Compressed cake — round disc with a center divot, dark-tinted.
      return (
        <svg {...props}>
          <circle cx="30" cy="30" r="18" />
          <circle cx="30" cy="30" r="4" fill="#fff" opacity="0.45" />
          <circle cx="22" cy="22" r="1.5" fill="#fff" opacity="0.35" />
          <circle cx="37" cy="36" r="1.5" fill="#fff" opacity="0.35" />
        </svg>
      );
    case "копчёный":
      // Leaf with a wisp of smoke rising.
      return (
        <svg {...props}>
          <path d="M30 24 C42 30 42 46 30 50 C18 46 18 30 30 24 Z" />
          <path
            d="M22 18 C22 14 26 14 26 10 M30 16 C30 12 34 12 34 8 M38 18 C38 14 42 14 42 10"
            stroke={fill}
            strokeWidth="2.2"
            fill="none"
            strokeLinecap="round"
            opacity="0.6"
          />
        </svg>
      );
    default:
      return (
        <svg {...props}>
          <circle cx="30" cy="30" r="16" />
        </svg>
      );
  }
};

const TEA_LABEL = {
  "зелёный":  "зелёный чай",
  "красный":  "красный чай",
  "белый":    "белый чай",
  "улун":     "улун",
  "шэн пуэр": "шэн пуэр",
  "шу пуэр":  "шу пуэр",
  "копчёный": "лапсанг",
};

// Outline ice-cream-type glyphs (matches the reference photo's "желато" style).
const TypeGlyph = ({ type, size = 56 }) => {
  const props = {
    width: size,
    height: size,
    viewBox: "0 0 60 60",
    fill: "none",
    stroke: "#2c2924",
    strokeWidth: 1.8,
    strokeLinejoin: "round",
    strokeLinecap: "round",
    "aria-hidden": "true",
  };

  switch (type) {
    case "джелато":
      // 5-petal rosette like the reference.
      return (
        <svg {...props}>
          {[0, 72, 144, 216, 288].map((deg) => (
            <path
              key={deg}
              transform={`rotate(${deg} 30 30)`}
              d="M30 12 C36 16 36 26 30 30 C24 26 24 16 30 12 Z"
            />
          ))}
          <circle cx="30" cy="30" r="3" />
        </svg>
      );
    case "пломбир":
      // Brick on a stick.
      return (
        <svg {...props}>
          <rect x="14" y="14" width="32" height="28" rx="3" />
          <line x1="30" y1="42" x2="30" y2="52" />
          <line x1="20" y1="22" x2="40" y2="22" opacity="0.45" />
        </svg>
      );
    case "сорбэ":
      // Faceted gem / crystal — angular sorbet scoop.
      return (
        <svg {...props}>
          <path d="M14 26 L30 14 L46 26 L30 50 Z" />
          <line x1="14" y1="26" x2="46" y2="26" />
          <line x1="22" y1="26" x2="30" y2="14" />
          <line x1="38" y1="26" x2="30" y2="14" />
          <line x1="30" y1="26" x2="30" y2="50" />
        </svg>
      );
    case "москвито":
      // Tumbler with a straw and ice cube.
      return (
        <svg {...props}>
          <path d="M18 16 L42 16 L39 50 L21 50 Z" />
          <line x1="34" y1="14" x2="40" y2="6" />
          <rect x="24" y="22" width="6" height="6" transform="rotate(-12 27 25)" />
        </svg>
      );
    default:
      return (
        <svg {...props}>
          <circle cx="30" cy="30" r="14" />
        </svg>
      );
  }
};

Object.assign(window, { ColorSwatch, TeaGlyph, TypeGlyph, TEA_LABEL });
