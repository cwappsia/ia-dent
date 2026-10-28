export function Logo({ tamanho = 32 }: { tamanho?: number }) {
  return (
    <span className="inline-flex items-center gap-2 font-semibold tracking-tight text-texto">
      <svg width={tamanho} height={tamanho} viewBox="0 0 64 64" aria-hidden="true">
        <rect width="64" height="64" rx="14" fill="var(--pri)" />
        <path
          d="M32 13c-6.5 0-9.5 3.2-13.5 3.2-4 0-7.3-2.1-8.4 2-1.1 4.4 1.8 7.6 2.9 12.7 1.1 5.1 1.1 13 4.2 13 3.1 0 3-8.4 5-11.6 1.8-2.9 4.2-2.9 6 0 2 3.2 1.9 11.6 5 11.6 3.1 0 3.1-7.9 4.2-13 1.1-5.1 4-8.3 2.9-12.7-1.1-4.1-4.4-2-8.4-2C41.5 16.2 38.5 13 32 13z"
          fill="var(--btn-tx)"
        />
      </svg>
      IA.Dent
    </span>
  )
}
