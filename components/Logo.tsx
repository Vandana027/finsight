export default function Logo() {
  return (
    <span className="flex items-center gap-2.5 font-semibold tracking-tight text-stone-900">
      <svg width="30" height="30" viewBox="0 0 30 30" aria-hidden="true">
        <rect width="30" height="30" rx="9" fill="#0f3d2e" />
        <path d="M8 20.5V15m7 5.5V11m7 9.5V7.5" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
        <circle cx="22" cy="7.5" r="2" fill="#d9b26a" />
      </svg>
      <span className="text-[20px]">FinSight</span>
    </span>
  );
}
