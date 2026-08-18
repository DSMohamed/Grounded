export function GroundedLogo({ className = "size-6" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <rect width="32" height="32" rx="7" fill="currentColor" fillOpacity="0.12" />
      <path
        d="M16 6C16 6 22 8 23.5 13C23.5 20 16 26 16 26C16 26 8.5 20 8.5 13C10 8 16 6 16 6Z"
        fill="currentColor"
        fillOpacity="0.2"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path
        d="M16 11V20"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path
        d="M11.5 15.5H20.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path
        d="M11 22.5H21"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
      />
    </svg>
  );
}
