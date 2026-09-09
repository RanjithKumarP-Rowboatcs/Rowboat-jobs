type RowboatLogoProps = { className?: string }

export default function RowboatLogo({ className = '' }: RowboatLogoProps) {
  return (
    <div className={'rowboatLogo ' + className}>
      <img
        src="/rowboat-logo.svg"
        alt="ROWBOAT CONSULTING SERVICES"
        className="rowboatLogoImage"
      />
    </div>
  )
}
