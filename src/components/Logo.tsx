// Self-contained brand mark — no external requests, adapts to light/dark
// via the theme tokens in globals.css.
export default function Logo({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      className={`size-8 rounded-md ${className}`}
      role="img"
      aria-label="Video to Prompt"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect width="32" height="32" rx="8" className="fill-[var(--primary)]" />
      <path d="M12.5 10 L22 16 L12.5 22 Z" className="fill-[var(--primary-foreground)]" />
    </svg>
  );
}
