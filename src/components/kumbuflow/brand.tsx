import { Link } from "@tanstack/react-router";

export function BrandMark({ className = "size-9" }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 40" className={className} aria-hidden="true">
      <rect width="40" height="40" rx="10" className="fill-navy" />
      <path d="M12 9v22" className="stroke-navy-foreground" strokeWidth="4.5" strokeLinecap="round" />
      <path d="M14 21 25 10" className="stroke-primary" strokeWidth="4.5" strokeLinecap="round" />
      <path d="M19 10h6.5v6.5" className="stroke-primary" fill="none" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
      <path d="m17.5 20.5 9 10.5" className="stroke-navy-foreground" strokeWidth="4.5" strokeLinecap="round" />
    </svg>
  );
}

export function Brand({ inverted = false }: { inverted?: boolean }) {
  return (
    <Link to="/" className="inline-flex items-center gap-2.5" aria-label="KumbuFlow — O teu negócio, sob controlo.">
      <BrandMark />
      <span className={`font-display text-xl font-bold tracking-tight ${inverted ? "text-navy-foreground" : "text-navy"}`}>
        Kumbu<span className="text-primary">Flow</span>
      </span>
    </Link>
  );
}
