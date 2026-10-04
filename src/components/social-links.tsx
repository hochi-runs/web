import { socials } from "@/data/site";

type SocialName = (typeof socials)[number]["label"];

function SocialIcon({ name }: { name: SocialName }) {
  return (
    <svg
      aria-hidden="true"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {name === "Instagram" && (
        <>
          <rect x="3" y="3" width="18" height="18" rx="5" />
          <circle cx="12" cy="12" r="4" />
          <circle cx="17.5" cy="6.5" r="0.9" fill="currentColor" stroke="none" />
        </>
      )}
      {name === "Bandcamp" && (
        <path d="M7 5H23L17 19H1Z" fill="currentColor" stroke="none" />
      )}
      {name === "SoundCloud" && (
        <>
          <path d="M12 17V8.5a5.2 5.2 0 0 1 8.7 3.4 2.6 2.6 0 1 1 .1 5.1Z" fill="currentColor" stroke="none" />
          <path d="M9.5 8.5V17M7 10.5V17M4.5 12V17M2 13.5V16" />
        </>
      )}
      {name === "YouTube" && (
        <>
          <path d="M20.5 5.5a2.7 2.7 0 0 1 2 2c.3 1.3.5 2.8.5 4.5s-.2 3.2-.5 4.5a2.7 2.7 0 0 1-2 2c-2.2.4-5.2.5-8.5.5s-6.3-.1-8.5-.5a2.7 2.7 0 0 1-2-2C1.2 15.2 1 13.7 1 12s.2-3.2.5-4.5a2.7 2.7 0 0 1 2-2C5.7 5.1 8.7 5 12 5s6.3.1 8.5.5Z" />
          <path d="m10 8.5 6 3.5-6 3.5Z" fill="currentColor" stroke="none" />
        </>
      )}
    </svg>
  );
}

export function SocialLinks({
  className = "",
  onNavigate,
}: {
  className?: string;
  onNavigate?: () => void;
}) {
  return (
    <nav aria-label="Social media" className={className}>
      <ul className="flex items-center gap-2 text-muted">
        {socials.map((social) => (
          <li key={social.url}>
            <a
              href={social.url}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`${social.label} (opens in a new tab)`}
              title={social.label}
              onClick={onNavigate}
              className="flex h-11 w-11 items-center justify-center transition-colors hover:text-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-current sm:h-6 sm:w-6"
            >
              <SocialIcon name={social.label} />
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
