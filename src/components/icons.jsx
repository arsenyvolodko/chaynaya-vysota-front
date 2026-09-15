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

export const IconUser = (p) => (
  <Icon {...p}>
    <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </Icon>
);

export const IconChevronLeft = (p) => (
  <Icon {...p}>
    <path d="M15 18l-6-6 6-6" />
  </Icon>
);

export const IconChevronRight = (p) => (
  <Icon {...p}>
    <path d="M9 18l6-6-6-6" />
  </Icon>
);

export const IconPhone = (p) => (
  <Icon {...p}>
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
  </Icon>
);

export const IconArrowRight = (p) => (
  <Icon {...p}>
    <path d="M5 12h14" />
    <path d="M13 5l7 7-7 7" />
  </Icon>
);

export const IconCheck = (p) => (
  <Icon {...p}>
    <path d="M20 6L9 17l-5-5" />
  </Icon>
);

export const IconSparkles = (p) => (
  <Icon {...p}>
    <path d="M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9L12 3z" />
    <path d="M19 17l.95 2.55L22 20.5l-2.05.95L19 24l-.95-2.55L16 20.5l2.05-.95L19 17z" />
    <path d="M5 14l.6 1.6L7 16l-1.4.4L5 18l-.6-1.6L3 16l1.4-.4L5 14z" />
  </Icon>
);

export const IconGrip = (p) => (
  <Icon {...p}>
    <circle cx="9" cy="6" r="1" />
    <circle cx="9" cy="12" r="1" />
    <circle cx="9" cy="18" r="1" />
    <circle cx="15" cy="6" r="1" />
    <circle cx="15" cy="12" r="1" />
    <circle cx="15" cy="18" r="1" />
  </Icon>
);

export const IconHeart = ({ filled, ...p }) => (
  <Icon {...p}>
    <path
      d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"
      fill={filled ? "currentColor" : "none"}
    />
  </Icon>
);

export const IconInfo = (p) => (
  <Icon {...p}>
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="16" x2="12" y2="12" />
    <line x1="12" y1="8" x2="12.01" y2="8" />
  </Icon>
);

export const IconLogout = (p) => (
  <Icon {...p}>
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    <polyline points="16 17 21 12 16 7" />
    <line x1="21" y1="12" x2="9" y2="12" />
  </Icon>
);

export const IconPencil = (p) => (
  <Icon {...p}>
    <path d="M12 20h9" />
    <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
  </Icon>
);

export const IconPlus = (p) => (
  <Icon {...p}>
    <line x1="12" y1="5" x2="12" y2="19" />
    <line x1="5" y1="12" x2="19" y2="12" />
  </Icon>
);

export const IconX = (p) => (
  <Icon {...p}>
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </Icon>
);

export const IconMedal = ({ filled, ...p }) => (
  <Icon {...p}>
    <path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11" />
    <circle cx="12" cy="8" r="6" fill={filled ? "currentColor" : "none"} />
  </Icon>
);

export const IconShare = (p) => (
  <Icon {...p}>
    <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
    <polyline points="16 6 12 2 8 6" />
    <line x1="12" y1="2" x2="12" y2="15" />
  </Icon>
);

export const IconLink = (p) => (
  <Icon {...p}>
    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
  </Icon>
);

export const IconTelegram = (p) => (
  <Icon {...p} stroke={0}>
    <path
      fill="currentColor"
      d="M21.95 4.62c.36-1.66-.6-2.31-1.69-1.92L2.84 9.4c-1.18.46-1.17 1.13-.2 1.42l4.45 1.39 10.33-6.52c.49-.32.93-.14.56.18l-8.36 7.55-.32 4.61c.46 0 .66-.2.91-.44l2.18-2.12 4.53 3.34c.83.46 1.42.22 1.63-.77l2.95-13.92z"
    />
  </Icon>
);

export const IconVK = (p) => (
  <Icon {...p} stroke={0}>
    <path
      fill="currentColor"
      d="M21.96 7.51c.15-.5 0-.86-.71-.86h-2.36c-.6 0-.87.31-1.02.66 0 0-1.2 2.92-2.89 4.81-.55.55-.8.73-1.1.73-.15 0-.38-.18-.38-.68V7.51c0-.6-.17-.86-.66-.86H9.13c-.37 0-.59.27-.59.53 0 .57.84.7.93 2.28v3.43c0 .76-.14.9-.44.9-.8 0-2.74-2.94-3.9-6.3-.23-.65-.46-.92-1.06-.92H1.71c-.67 0-.81.31-.81.66 0 .62.8 3.71 3.71 7.8 1.94 2.8 4.68 4.32 7.16 4.32 1.5 0 1.68-.34 1.68-.92v-2.12c0-.67.14-.8.62-.8.35 0 .94.18 2.34 1.52 1.6 1.6 1.86 2.32 2.76 2.32h2.36c.67 0 1.01-.34.81-1-.22-.66-.99-1.62-2-2.76-.55-.65-1.37-1.35-1.62-1.7-.35-.45-.25-.65 0-1.05.0 0 2.87-4.04 3.17-5.42z"
    />
  </Icon>
);

export const IconCart = (p) => (
  <Icon {...p}>
    <circle cx="9" cy="21" r="1" />
    <circle cx="19" cy="21" r="1" />
    <path d="M2.5 3h2l2.6 12.4a2 2 0 0 0 2 1.6h8.4a2 2 0 0 0 2-1.6L21.5 7H6" />
  </Icon>
);

export const IconLeaf = (p) => (
  <Icon {...p}>
    <path d="M11 20A7 7 0 0 1 4 13c0-5 4-9 12-11 1 6 1 12-2 15.5-1.2 1.4-2 2.5-3 2.5z" />
    <path d="M5.5 17.5C8 15 10.5 12.5 15 9" />
  </Icon>
);

// Джелато/мороженое — значок цветка (по образцу specs/желато.png), без рожка.
export const IconIceCream = (p) => (
  <Icon {...p}>
    <path d="M12 12C9.8 9.6 9.8 5.2 12 2.4C14.2 5.2 14.2 9.6 12 12Z" transform="rotate(0 12 12)" />
    <path d="M12 12C9.8 9.6 9.8 5.2 12 2.4C14.2 5.2 14.2 9.6 12 12Z" transform="rotate(72 12 12)" />
    <path d="M12 12C9.8 9.6 9.8 5.2 12 2.4C14.2 5.2 14.2 9.6 12 12Z" transform="rotate(144 12 12)" />
    <path d="M12 12C9.8 9.6 9.8 5.2 12 2.4C14.2 5.2 14.2 9.6 12 12Z" transform="rotate(216 12 12)" />
    <path d="M12 12C9.8 9.6 9.8 5.2 12 2.4C14.2 5.2 14.2 9.6 12 12Z" transform="rotate(288 12 12)" />
    <circle cx="12" cy="12" r="1.8" />
  </Icon>
);

export const IconClock = (p) => (
  <Icon {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7v5l3.5 2" />
  </Icon>
);

export const IconTicket = (p) => (
  <Icon {...p}>
    <path d="M3 8a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v2a2 2 0 0 0 0 4v2a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-2a2 2 0 0 0 0-4z" />
    <path d="M13 6v2M13 11v2M13 16v2" />
  </Icon>
);

export const IconMapPin = (p) => (
  <Icon {...p}>
    <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0z" />
    <circle cx="12" cy="10" r="3" />
  </Icon>
);

export const IconCalendar = (p) => (
  <Icon {...p}>
    <rect x="3.5" y="5" width="17" height="16" rx="3" />
    <path d="M3.5 10h17" />
    <path d="M8 3v4M16 3v4" />
  </Icon>
);

export const IconSort = (p) => (
  <Icon {...p}>
    <path d="M8 8l4-4 4 4" />
    <path d="M8 16l4 4 4-4" />
    <path d="M12 5v14" />
  </Icon>
);

export const IconCandy = (p) => (
  <Icon {...p}>
    <circle cx="12" cy="12" r="4" />
    <path d="M4.5 8L7.5 10L4.5 12" />
    <path d="M19.5 8L16.5 10L19.5 12" />
  </Icon>
);

export const IconSearch = (p) => (
  <Icon {...p}>
    <circle cx="11" cy="11" r="7" />
    <path d="M21 21l-4.3-4.3" />
  </Icon>
);

export const IconCopy = (p) => (
  <Icon {...p}>
    <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
  </Icon>
);
