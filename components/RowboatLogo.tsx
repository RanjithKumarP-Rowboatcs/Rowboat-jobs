type RowboatLogoProps = { className?: string }

export default function RowboatLogo({ className = '' }: RowboatLogoProps) {
  return (
    <span
      className={className}
      aria-label="ROWBOAT CONSULTING SERVICES"
      style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center', width: '100%', maxWidth: 390 }}
    >
      <span
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          whiteSpace: 'nowrap',
          lineHeight: 1,
          color: '#253746',
          fontFamily: "Georgia, 'Times New Roman', serif",
          fontWeight: 900,
          fontSize: 'clamp(20px, 5.2vw, 39px)',
          letterSpacing: '0.5px',
        }}
      >
        <span>ROWBOAT</span>
        <img
          src="/rowboat-mark.svg"
          alt=""
          aria-hidden="true"
          style={{ width: 'clamp(27px, 7vw, 42px)', height: 'clamp(27px, 7vw, 42px)', objectFit: 'contain', margin: '0 4px', flex: '0 0 auto' }}
        />
        <span>CONSULTING</span>
      </span>
      <span style={{ display: 'flex', alignItems: 'center', width: '100%', marginTop: 7 }}>
        <span style={{ height: 1, background: '#168da0', flex: 1, marginRight: 18 }} />
        <span
          style={{
            color: '#168da0',
            fontFamily: "Georgia, 'Times New Roman', serif",
            fontWeight: 700,
            fontSize: 'clamp(9px, 2vw, 13px)',
            letterSpacing: 'clamp(3px, 0.9vw, 6px)',
            whiteSpace: 'nowrap',
          }}
        >
          SERVICES
        </span>
        <span style={{ height: 1, background: '#168da0', flex: 1, marginLeft: 18 }} />
      </span>
    </span>
  )
}
