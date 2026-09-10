type RowboatLogoProps = { className?: string }

export default function RowboatLogo({ className = '' }: RowboatLogoProps) {
  return (
    <span
      className={className}
      aria-label="ROWBOAT CONSULTING SERVICES"
      style={{
        display: 'inline-flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        width: '390px',
        maxWidth: '100%',
        lineHeight: 1,
      }}
    >
      <span
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          whiteSpace: 'nowrap',
          color: '#253746',
          fontFamily: "Georgia, 'Times New Roman', serif",
          fontWeight: 900,
          fontSize: '30px',
          letterSpacing: '0',
        }}
      >
        <span>ROWBOAT</span>
        <img
          src="/rowboat-mark.svg"
          alt=""
          aria-hidden="true"
          style={{
            width: '48px',
            height: '46px',
            objectFit: 'contain',
            margin: '0 6px',
            flex: '0 0 auto',
          }}
        />
        <span>CONSULTING</span>
      </span>
      <span
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '100%',
          marginTop: '5px',
        }}
      >
        <span style={{ width: '72px', height: '1px', background: '#168da0', flex: '0 0 72px' }} />
        <span
          style={{
            margin: '0 10px',
            color: '#168da0',
            fontFamily: "Georgia, 'Times New Roman', serif",
            fontWeight: 700,
            fontSize: '11px',
            letterSpacing: '4px',
            whiteSpace: 'nowrap',
          }}
        >
          SERVICES
        </span>
        <span style={{ width: '72px', height: '1px', background: '#168da0', flex: '0 0 72px' }} />
      </span>
    </span>
  )
}
