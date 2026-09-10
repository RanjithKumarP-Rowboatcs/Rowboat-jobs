type RowboatLogoProps = { className?: string }

export default function RowboatLogo({ className = '' }: RowboatLogoProps) {
  return (
    <img
      className={className}
      src="/rowboat-logo.svg"
      alt="ROWBOAT CONSULTING SERVICES"
      style={{ display: 'block', width: '100%', height: 'auto' }}
    />
  )
}
