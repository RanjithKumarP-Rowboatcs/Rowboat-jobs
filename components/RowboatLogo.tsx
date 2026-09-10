type RowboatLogoProps = { className?: string }

export default function RowboatLogo({ className = '' }: RowboatLogoProps) {
  return (
    <div className={'rowboatLogo ' + className} aria-label="ROWBOAT CONSULTING SERVICES">
      <div className="rowboatLogoMain">
        <span>ROWBOAT</span>
        <img
          src="/rowboat-mark.svg"
          alt=""
          aria-hidden="true"
          className="rowboatLogoMark"
        />
        <span>CONSULTING</span>
      </div>
      <div className="rowboatLogoService" aria-hidden="true">
        <i />
        <span>SERVICES</span>
        <i />
      </div>
    </div>
  )
}
