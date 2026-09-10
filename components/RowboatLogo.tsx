type RowboatLogoProps = { className?: string }

export default function RowboatLogo({ className = '' }: RowboatLogoProps) {
  return (
    <img
      src="/rowboat-logo.svg"
      alt="ROWBOAT CONSULTING SERVICES"
      className={className}
      aria-label="ROWBOAT Consulting Services"
    />
  )
}
