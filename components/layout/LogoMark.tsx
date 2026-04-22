/**
 * Logo mark inspired by the provided SSS brand identity:
 * three stylised red panels under a simplified sun. Kept as inline SVG so
 * it stays sharp at any size and inherits the red accent from the theme.
 */
export function LogoMark({ className = "" }: { className?: string }) {
  return (
    <svg
      width="28"
      height="28"
      viewBox="0 0 40 40"
      fill="none"
      className={className}
      aria-hidden
    >
      {/* Sun: center arc with two rays, very minimal */}
      <path
        d="M20 10 V6 M13 13 L10.5 10.5 M27 13 L29.5 10.5"
        stroke="#E30613"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M12 19 A8 8 0 0 1 28 19"
        stroke="#E30613"
        strokeWidth="2"
        strokeLinecap="round"
        fill="none"
      />
      {/* Three leaning panels */}
      <path
        d="M7 30 L14 22 L20 22 L13 30 Z"
        fill="#E30613"
      />
      <path
        d="M15 30 L22 22 L28 22 L21 30 Z"
        fill="#E30613"
      />
      <path
        d="M23 30 L30 22 L34 22 L27 30 Z"
        fill="#E30613"
      />
    </svg>
  );
}
