type RowboatLogoProps = { className?: string }

export default function RowboatLogo({ className = '' }: RowboatLogoProps) {
  return <div className={`rowboatLogo ${className}`.trim()} aria-label="ROWBOAT CONSULTING SERVICES">
    <div className="rowboatLogoMain">
      <span>ROWBOAT</span>
      <img className="rowboatLogoMark" src="/rowboat-mark.svg" alt="" aria-hidden="true" />
      <span>CONSULTING</span>
    </div>
    <div className="rowboatLogoService" aria-hidden="true"><i></i><span>SERVICES</span><i></i></div>
  </div>
}