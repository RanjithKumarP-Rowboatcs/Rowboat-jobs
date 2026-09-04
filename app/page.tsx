'use client'

const expertise = [
  ['01', 'Technology Consulting', 'Technology strategy, implementation and support shaped around your operating reality.'],
  ['02', 'Talent Solutions', 'Specialist and strategic talent support to help teams access the capability they need.'],
  ['03', 'Digital & Web', 'Modern digital experiences and web solutions designed for clarity, usability and growth.'],
  ['04', 'Data & Analytics', 'Reporting, analytics and practical insight that help leaders make better decisions.'],
  ['05', 'Cloud & Infrastructure', 'Reliable cloud and infrastructure support built for changing business needs.'],
  ['06', 'Quality & Delivery', 'Quality assurance and delivery support that helps important work move forward with confidence.'],
]

const industries = [
  ['Healthcare', 'Technology and talent support for organizations where reliability, privacy and data matter.'],
  ['Financial Services', 'Specialist capabilities for complex, regulated and fast-moving environments.'],
  ['Government', 'Practical technology and workforce support for public-sector programs and initiatives.'],
  ['Energy & Utilities', 'Digital, data and specialist talent support for operationally important environments.'],
  ['Technology', 'Engineering, digital and talent capabilities for teams building what comes next.'],
  ['Growing Businesses', 'Flexible consulting and talent support that can adapt as priorities change.'],
]

const strengths = [
  ['01', 'Business first', 'We begin with the challenge, context and outcome — then shape the engagement around them.'],
  ['02', 'Right-fit capability', 'We focus on relevant experience, capability and fit rather than simply filling a requirement.'],
  ['03', 'Flexible engagement', 'Choose focused consulting, specialist talent or ongoing support depending on what the work needs.'],
  ['04', 'Built for partnership', 'We work closely with clients and aim to become a dependable extension of their team.'],
]

const principles = ['Understand the challenge', 'Bring the right expertise', 'Execute with accountability']

export default function Home() {
  return <>
    <nav className="nav">
      <div className="container navInner">
        <a className="brand" href="#top" aria-label="ROWBOAT Consulting Services home"><img src="/rowboat-mark.svg" alt="ROWBOAT"/><span><strong>ROWBOAT</strong><small>CONSULTING SERVICES</small></span></a>
        <div className="navLinks">
          <a href="#expertise">Expertise</a><a href="#industries">Industries</a><a href="#about">About</a><a href="#careers">Careers</a><a className="navCta" href="#contact">Let's talk <span>↗</span></a>
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
            <h1>Move your business forward with <em>the right capability.</em></h1>
            <p>ROWBOAT CONSULTING SERVICES brings together practical consulting, technology expertise and talent solutions to help organizations solve important problems and turn plans into progress.</p>
            <div className="heroActions"><a className="btn btnPrimary" href="#expertise">Explore our expertise <span>→</span></a><a className="textButton" href="#contact">Start a conversation <span>↗</span></a></div>
            <div className="heroNote"><span></span> A focused partner for technology, people and delivery</div>
          </div>
          <div className="heroPanel">
            <div className="panelKicker">ROWBOAT / CONSULTING SERVICES</div>
            <div className="heroPanelTitle">People.<br/>Technology.<br/><strong>Progress.</strong></div>
            <div className="heroLines"><span></span><span></span><span></span><span></span><span></span></div>
            <div className="heroPanelBottom"><span>STRATEGY</span><span>CAPABILITY</span><span>DELIVERY</span></div>
          </div>
        </div>
      </section>

      <section className="statement"><div className="container statementGrid"><div className="eyebrow">Our approach</div><h2>Good consulting should make <em>complex things clearer.</em></h2><p>We combine specialist knowledge with a practical, collaborative approach — helping clients make decisions, build capability and deliver with confidence.</p></div></section>

      <section className="section" id="expertise"><div className="container">
        <div className="sectionHead"><div><div className="eyebrow">What we do</div><h2>Expertise built around real business needs.</h2></div><p>Our services are designed to work together, so you can engage the capability you need without unnecessary complexity.</p></div>
        <div className="expertiseGrid">{expertise.map(([n,title,text]) => <article className="expertise" key={n}><span>{n}</span><h3>{title}</h3><p>{text}</p><a href="#contact">Discuss your need <b>↗</b></a></article>)}</div>
      </div></section>

      <section className="section lightSection" id="industries"><div className="container">
        <div className="sectionHead"><div><div className="eyebrow">Industry perspective</div><h2>Context matters. We work around yours.</h2></div><p>We adapt our approach to your sector, operating environment, priorities and pace of change.</p></div>
        <div className="industryGrid">{industries.map(([title,text],i) => <article className="industry" key={title}><span>0{i+1}</span><h3>{title}</h3><p>{text}</p></article>)}</div>
      </div></section>

      <section className="section" id="about"><div className="container">
        <div className="aboutIntro"><div><div className="eyebrow">About ROWBOAT</div><h2>Close to the problem. Focused on the outcome.</h2></div><p>ROWBOAT CONSULTING SERVICES is positioned as a practical partner for organizations that need dependable expertise, specialist capability and a clear path from challenge to execution. We believe relationships matter: understand the context, communicate clearly, take ownership and deliver useful outcomes.</p></div>
        <div className="strengthGrid">{strengths.map(([n,title,text]) => <article className="strength" key={n}><span>{n}</span><h3>{title}</h3><p>{text}</p></article>)}</div>
      </div></section>

      <section className="principles"><div className="container"><div className="eyebrow">How we work</div><div className="principleGrid">{principles.map((item,i)=><div key={item}><span>0{i+1}</span><strong>{item}</strong></div>)}</div></div></section>

      <section className="careersSection" id="careers"><div className="container careersWrap"><div><div className="eyebrow">ROWBOAT JOBS · CAREERS</div><h2>Build meaningful work with people who care about doing it well.</h2><p>Our careers channel is where future opportunities will appear. We are not listing placeholder roles today. When positions open, we will publish the details here.</p></div><div className="careerBox"><div className="careerIcon"><img src="/rowboat-mark.svg" alt=""/></div><strong>No open positions right now.</strong><span>Want to be considered for future opportunities?</span><a className="btn btnWhite" href="mailto:careers@rowboatcs.com?subject=Career%20Profile%20-%20ROWBOAT">Share your profile →</a></div></div></section>

      <section className="contactSection" id="contact"><div className="container"><div className="contactIntro"><div><div className="eyebrow">Contact ROWBOAT</div><h2>Let's talk about what you're building.</h2><p>Tell us what you need help with. We can start with a conversation and identify the right next step.</p></div><div className="contactDetails"><span>General enquiries</span><a href="mailto:careers@rowboatcs.com">careers@rowboatcs.com</a></div></div><form className="contactForm" action="mailto:careers@rowboatcs.com" method="post" encType="text/plain"><label>Name<input name="name" required placeholder="Your name"/></label><label>Company<input name="company" placeholder="Company name"/></label><label>Email<input name="email" type="email" required placeholder="you@company.com"/></label><label>How can we help?<textarea name="message" required rows={5} placeholder="Tell us a little about your requirement..."></textarea></label><button className="btn btnPrimary" type="submit">Send enquiry <span>↗</span></button></form></div></section>
    </main>

    <footer className="footer"><div className="container footerTop"><div className="footerBrand"><img src="/rowboat-mark.svg" alt="ROWBOAT"/><div><strong>ROWBOAT</strong><small>CONSULTING SERVICES</small></div></div><div className="footerLinks"><a href="#expertise">Expertise</a><a href="#industries">Industries</a><a href="#about">About</a><a href="#careers">Careers</a><a href="#contact">Contact</a></div></div><div className="container footerBottom"><span>© 2026 ROWBOAT CONSULTING SERVICES</span><span>Consulting · Technology · Talent</span></div></footer>
  </>
}
