export function initialsOf(name) {
  return (name || "Г")
    .trim()
    .split(/\s+/)
    .map((s) => s[0] || "")
    .join("")
    .slice(0, 2)
    .toUpperCase();
}
