type RowboatLogoProps = { className?: string }

export default function RowboatLogo({ className = '' }: RowboatLogoProps) {
  return (
    <span
      className={className}
      style={{ position: 'relative', display: 'block', aspectRatio: '708 / 141' }}
      aria-label="ROWBOAT Consulting Services"
    >
      <img
        src="/rowboat-logo-base.svg"
        alt="ROWBOAT CONSULTING SERVICES"
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', display: 'block' }}
      />
      <img
        src="/rowboat-mark.svg"
        alt=""
        aria-hidden="true"
        style={{ position: 'absolute', left: '37.99%', top: '12.06%', width: '9.89%', height: '47.52%', objectFit: 'contain', display: 'block' }}
      />
    </span>
  )
}
