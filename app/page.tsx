'use client'

const expertise = [
  ['01', 'Technology Consulting', 'Practical technology strategy, implementation and support for growing organizations.'],
  ['02', 'Talent Solutions', 'Strategic staffing and talent solutions that connect businesses with the capabilities they need.'],
  ['03', 'Digital & Web', 'Modern web and digital solutions designed around customer experience and business outcomes.'],
  ['04', 'Data & Analytics', 'Turn business data into clearer decisions through analytics, reporting and insight.'],
  ['05', 'Cloud Solutions', 'Flexible cloud and infrastructure support designed for reliability, scale and efficiency.'],
  ['06', 'Quality & Delivery', 'Focused quality assurance and delivery support that helps teams ship with confidence.'],
]

const industries = [
  ['Healthcare', 'Technology and talent solutions for organizations where reliability and data matter.'],
  ['Financial Services', 'Specialist capabilities for complex, regulated and fast-moving business environments.'],
  ['Government', 'Practical technology and workforce support for public-sector initiatives.'],
  ['Energy & Utilities', 'Digital, data and specialist talent support for operationally critical environments.'],
  ['Technology', 'Engineering and specialist talent solutions for teams building what is next.'],
  ['Growing Businesses', 'Flexible consulting and talent support that scales with your priorities.'],
]

const strengths = [
  ['01', 'Industry-aware expertise', 'We start with the business problem, understand the context and shape the solution around it.'],
  ['02', 'Right-fit talent', 'We focus on capability, experience and fit — not simply filling a vacancy.'],
  ['03', 'Flexible engagement', 'Use us for a focused requirement, a specialist project or an ongoing capability need.'],
  ['04', 'Long-term partnership', 'We aim to become a dependable extension of your team, not just another vendor.'],
]

export default function Home() {
  return <>
    <nav className="nav">
      <div className="container navInner">
        <a className="brand" href="#top"><span className="mark">R</span><span><strong>ROWBOAT</strong><small>CONSULTING SERVICES</small></span></a>
        <div className="navLinks">
          <a href="#expertise">Expertise</a><a href="#industries">Industries</a><a href="#about">About</a><a href="#careers">Careers</a><a className="navCta" href="#contact">Contact us <span>↗</span></a>
        </div>
        <a className="mobileMenu" href="#contact" aria-label="Go to contact">☰</a>
      </div>
    </nav>

    <main id="top">
      <section className="hero corporateHero">
        <div className="heroBackdrop"></div>
        <div className="container heroContent">
          <div className="heroCopy">
            <div className="eyebrow">Consulting · Technology · Talent</div>
            <h1>Solutions built around <em>your business.</em></h1>
            <p>ROWBOAT CONSULTING SERVICES helps organizations solve technology, talent and delivery challenges with practical expertise and a people-first approach.</p>
            <div className="heroActions"><a className="btn btnPrimary" href="#expertise">Explore our expertise <span>→</span></a><a className="textButton" href="#contact">Talk to us <span>↗</span></a></div>
          </div>
          <div className="heroPanel"><div className="panelKicker">ROWBOAT / 01</div><div className="heroPanelTitle">Your challenge.<br/><strong>Our capability.</strong></div><div className="heroLines"><span></span><span></span><span></span><span></span></div><div className="heroPanelBottom"><span>Strategy</span><span>Technology</span><span>People</span></div></div>
        </div>
      </section>

      <section className="statement"><div className="container statementGrid"><div className="eyebrow">What we do</div><h2>We bring together <em>people, technology and practical thinking</em> to help businesses move forward.</h2><p>From specialist consulting to talent solutions, we build focused partnerships around the outcomes that matter.</p></div></section>

      <section className="section" id="expertise"><div className="container">
        <div className="sectionHead"><div><div className="eyebrow">Our expertise</div><h2>Capability across the things that matter.</h2></div><p>Focused expertise for organizations navigating growth, transformation and the need for great people.</p></div>
        <div className="expertiseGrid">{expertise.map(([n,title,text]) => <article className="expertise" key={n}><span>{n}</span><h3>{title}</h3><p>{text}</p><a href="#contact">Learn more <b>↗</b></a></article>)}</div>
      </div></section>

      <section className="section lightSection" id="industries"><div className="container">
        <div className="sectionHead"><div><div className="eyebrow">Industries</div><h2>Experience where your business needs it.</h2></div><p>We adapt our approach to the realities of your sector, operating environment and goals.</p></div>
        <div className="industryGrid">{industries.map(([title,text],i) => <article className="industry" key={title}><span>0{i+1}</span><h3>{title}</h3><p>{text}</p></article>)}</div>
      </div></section>

      <section className="section" id="about"><div className="container">
        <div className="aboutIntro"><div><div className="eyebrow">Why ROWBOAT</div><h2>A partner that stays close to the problem.</h2></div><p>We believe the best consulting relationships are built on understanding, accountability and useful outcomes. Our model combines specialist expertise with flexible talent solutions so clients can get the right capability at the right time.</p></div>
        <div className="strengthGrid">{strengths.map(([n,title,text]) => <article className="strength" key={n}><span>{n}</span><h3>{title}</h3><p>{text}</p></article>)}</div>
      </div></section>

      <section className="careersSection" id="careers"><div className="container careersWrap"><div><div className="eyebrow">ROWBOAT JOBS · CAREERS</div><h2>Build your next chapter with us.</h2><p>We are growing our network of professionals and will publish opportunities as they become available.</p></div><div className="careerBox"><div className="careerIcon">R</div><strong>No open positions right now.</strong><span>Want to be considered for future opportunities?</span><a className="btn btnWhite" href="mailto:careers@rowboatcs.com?subject=Career%20Profile%20-%20ROWBOAT">Share your profile →</a></div></div></section>

      <section className="contactSection" id="contact"><div className="container contactGrid"><div><div className="eyebrow">Start a conversation</div><h2>Tell us what you are trying to achieve.</h2><p>Whether you need consulting expertise, specialist talent or a partner for an important initiative, we would like to hear from you.</p></div><a className="contactCard" href="mailto:careers@rowboatcs.com?subject=ROWBOAT%20Consulting%20Services%20Enquiry"><span>Get in touch</span><strong>careers@rowboatcs.com</strong><b>↗</b></a></div></section>
    </main>

    <footer className="footer"><div className="container footerTop"><div className="footerBrand"><span className="mark">R</span><div><strong>ROWBOAT</strong><small>CONSULTING SERVICES</small></div></div><div className="footerLinks"><a href="#expertise">Expertise</a><a href="#industries">Industries</a><a href="#about">About</a><a href="#careers">Careers</a><a href="#contact">Contact</a></div></div><div className="container footerBottom"><span>© 2026 ROWBOAT CONSULTING SERVICES</span><span>Consulting · Technology · Talent</span></div></footer>
  </>
}
