'use client'

const services = [
  { n: '01', title: 'Consulting', text: 'Practical expertise for business, technology and growth challenges.' },
  { n: '02', title: 'Talent Solutions', text: 'Find, assess and build teams around the capabilities your business needs.' },
  { n: '03', title: 'Specialist Services', text: 'Flexible support for projects that need focused skills and execution.' },
]

const steps = [
  ['01', 'Tell us what you need', 'Share the challenge, role or capability you are looking for.'],
  ['02', 'We build the right approach', 'We shape the right consulting, talent or specialist solution.'],
  ['03', 'We deliver together', 'You get a focused partner and a clear path from need to outcome.'],
]

export default function Home() {
  return <>
    <nav className="nav">
      <div className="container navInner">
        <a className="brand" href="#top"><span className="mark">R</span><span><strong>ROWBOAT</strong> <span className="brandLight">CONSULTING SERVICES</span></span></a>
        <div className="navLinks">
          <a href="#services">Services</a><a href="#careers">Careers</a><a href="#talent">Hire Talent</a><a href="#about">About</a>
          <a className="navCta" href="mailto:careers@rowboatcs.com?subject=ROWBOAT%20Consulting%20Services">Contact us <span>↗</span></a>
        </div>
        <a className="mobileMenu" href="#careers" aria-label="Go to careers">☰</a>
      </div>
    </nav>

    <main id="top">
      <section className="hero">
        <div className="container heroGrid">
          <div className="heroCopy">
            <div className="eyebrow">Consulting · Talent · Careers</div>
            <h1>Building better teams.<br/><em>Creating better</em> opportunities.</h1>
            <p>ROWBOAT CONSULTING SERVICES helps businesses solve complex needs through consulting, talent and specialist services.</p>
            <div className="heroActions"><a className="btn btnPrimary" href="#services">Explore our services <span>→</span></a><a className="btn btnLight" href="#careers">View careers</a></div>
            <div className="trustLine"><span className="dot"></span><span>India-first · Built for ambitious businesses</span></div>
          </div>
          <div className="heroVisual" aria-hidden="true">
            <div className="visualCard mainCard"><div className="cardTop"><span className="miniMark">R</span><span>ROWBOAT</span><span className="status">● ACTIVE</span></div><div className="visualTitle">People. Expertise.<br/><strong>Better outcomes.</strong></div><div className="signal"><span></span><span></span><span></span><span></span><span></span></div><div className="visualFoot"><span>Consulting</span><span>Talent</span><span>Specialists</span></div></div>
            <div className="floatingCard"><strong>People-first</strong><span>solutions that scale</span></div>
            <div className="circleGlow"></div>
          </div>
        </div>
      </section>

      <section className="introStrip"><div className="container introGrid"><div><strong>One partner.</strong><span>Multiple ways to move your business forward.</span></div><div className="stripStats"><span><b>01</b> Consulting</span><span><b>02</b> Talent</span><span><b>03</b> Specialist</span></div></div></section>

      <section className="section" id="services"><div className="container">
        <div className="sectionHead"><div><div className="eyebrow">What we do</div><h2>Capability when you need it.</h2></div><p>Focused services designed around real business needs — not one-size-fits-all packages.</p></div>
        <div className="serviceGrid">{services.map(([n, title, text]) => <article className="service" key={n}><div className="serviceNo">{n}</div><h3>{title}</h3><p>{text}</p><a href="#talent">Learn more <span>↗</span></a></article>)}</div>
      </div></section>

      <section className="section careersSection" id="careers"><div className="container">
        <div className="careersCard"><div><div className="eyebrow">ROWBOAT JOBS · CAREERS</div><h2>Great work starts with the right opportunity.</h2><p>We are building our career network. Open positions will be published here when available.</p></div><div className="careerStatus"><span className="statusRing">✓</span><strong>No open positions</strong><span>Check back soon or share your profile.</span><a className="btn btnLight" href="mailto:careers@rowboatcs.com?subject=Career%20Profile%20-%20ROWBOAT">Share your profile →</a></div></div>
      </div></section>

      <section className="section" id="talent"><div className="container">
        <div className="sectionHead"><div><div className="eyebrow">Work with us</div><h2>Let’s solve the right problem.</h2></div><p>Whether you need a team member, specialist or a fresh perspective, start with a conversation.</p></div>
        <div className="split"><div className="panel dark"><div className="panelLabel">FOR EMPLOYERS</div><h3>Need great people?</h3><p>Tell us what you need and we’ll help shape the right talent solution around it.</p><a className="btn btnWhite" href="mailto:careers@rowboatcs.com?subject=Hire%20Talent%20with%20ROWBOAT">Hire talent <span>→</span></a></div><div className="panel green"><div className="panelLabel">FOR CANDIDATES</div><h3>Keep your next move open.</h3><p>Share your experience and interests for future opportunities with ROWBOAT.</p><a className="btn btnPrimary" href="mailto:careers@rowboatcs.com?subject=Career%20Profile%20-%20ROWBOAT">Contact careers <span>→</span></a></div></div>
      </div></section>

      <section className="section processSection"><div className="container"><div className="eyebrow">How it works</div><h2>Simple by design.</h2><div className="steps">{steps.map(([n, title, text]) => <div className="step" key={n}><span>{n}</span><h3>{title}</h3><p>{text}</p></div>)}</div></div></section>

      <section className="section aboutSection" id="about"><div className="container aboutGrid"><div><div className="eyebrow">About ROWBOAT</div><h2>Good businesses need good people — and the right thinking.</h2></div><div><p>ROWBOAT CONSULTING SERVICES brings consulting, talent and specialist capabilities together to help businesses navigate important moments with confidence.</p><p>Our approach is practical, people-first and built to grow with the needs of our clients.</p><a className="textLink" href="mailto:careers@rowboatcs.com?subject=Connect%20with%20ROWBOAT">Start a conversation <span>↗</span></a></div></div></section>

      <section className="contactBand"><div className="container contactInner"><div><div className="eyebrow">Have a challenge?</div><h2>Let’s talk about what’s next.</h2></div><a className="btn btnWhite" href="mailto:careers@rowboatcs.com?subject=ROWBOAT%20Consulting%20Services%20Enquiry">Contact ROWBOAT →</a></div></section>
    </main>
    <footer className="footer"><div className="container footerInner"><span>© 2026 ROWBOAT CONSULTING SERVICES</span><span>India-first · Globally extensible</span></div></footer>
  </>
}
