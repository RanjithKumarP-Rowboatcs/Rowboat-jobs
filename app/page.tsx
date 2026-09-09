'use client'

import { useMemo, useState } from 'react'
import RowboatLogo from '../components/RowboatLogo'

const industries = [
  ['Information Technology', 'Software, cloud, AI, data, cybersecurity, infrastructure and digital roles.'],
  ['Manufacturing', 'Production, quality, operations, maintenance, engineering and supply chain.'],
]

export default function Home() {
  const [query, setQuery] = useState('')
  const [industry, setIndustry] = useState('All industries')
  const [messageStatus, setMessageStatus] = useState('')

  const matchingIndustries = useMemo(() => industries.filter(([name, text]) => {
    const haystack = `${name} ${text}`.toLowerCase()
    const matchesQuery = !query || haystack.includes(query.toLowerCase())
    const matchesIndustry = industry === 'All industries' || name === industry
    return matchesQuery && matchesIndustry
  }), [query, industry])

  function handleContactSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const name = String(form.get('name') || '')
    const email = String(form.get('email') || '')
    const interest = String(form.get('interest') || '')
    const message = String(form.get('message') || '')
    const subject = `ROWBOAT website enquiry — ${interest}`
    const body = `Name: ${name}\nEmail: ${email}\nInterest: ${interest}\n\nMessage:\n${message}`
    window.location.href = `mailto:ranjith@rowboatcs.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
    setMessageStatus('Your email app has been opened with the enquiry addressed to ranjith@rowboatcs.com.')
  }

  return <>
    <nav className="nav"><div className="container navInner">
      <a className="brand" href="#top" aria-label="ROWBOAT Consulting Services home"><RowboatLogo className="brandLogo" /></a>
      <div className="navLinks">
        <a href="/opportunities">Opportunities</a><a href="#industries">Industries</a><a href="#employers">Employers</a><a href="#about">About</a><a className="navCta" href="#contact">Contact ↗</a>
      </div>
      <a className="mobileMenu" href="/opportunities" aria-label="Explore opportunities">Explore</a>
    </div></nav>

    <main id="top">
      <section className="jobsHero"><div className="heroBackdrop"></div><div className="container jobsHeroInner">
        <div><div className="eyebrow">India · Careers · Opportunities</div><h1>IT & Manufacturing.<br/><em>Relevant Opportunities.</em><br/>One Platform.</h1><p>Discover employment opportunities in Information Technology and Manufacturing, with clear requirements, locations, experience levels and application details.</p><div className="heroActions"><a className="btn btnPrimary" href="/opportunities">Explore opportunities →</a><a className="textButton" href="#employers">For employers ↗</a></div></div>
        <div className="heroPanel"><div className="panelKicker">ROWBOAT / OPPORTUNITY PLATFORM</div><div className="heroPanelTitle">Discover.<br/>Explore.<br/><strong>Connect.</strong></div><div className="heroLines"><span/><span/><span/><span/><span/></div><div className="heroPanelBottom"><span>INDIA FIRST</span><span>IT + MANUFACTURING</span><span>ACCESSIBLE</span></div></div>
      </div></section>

      <section className="searchSection" id="opportunities"><div className="container"><div className="eyebrow">Explore opportunities</div><h2>Find an opportunity that fits you.</h2><p className="sectionLead">Search current Rowboat openings by role, skill, company or location. Public listings are currently limited to Information Technology and Manufacturing.</p><div className="searchBar"><input value={query} onChange={e => setQuery(e.target.value)} placeholder="Job title, skill, company or location" aria-label="Search opportunities"/><select value={industry} onChange={e => setIndustry(e.target.value)} aria-label="Filter by industry"><option>All industries</option>{industries.map(([name]) => <option key={name}>{name}</option>)}</select><a className="btn btnPrimary" href="/opportunities">View openings →</a></div>
        <div className="jobResults"><div className="resultsHeader"><strong>{matchingIndustries.length} public industr{matchingIndustries.length === 1 ? 'y' : 'ies'}</strong><span>Currently showing IT and Manufacturing opportunities only.</span></div>{matchingIndustries.length > 0 ? <div className="directoryPreview">{matchingIndustries.map(([name, text]) => <article className="directoryCard" key={name}><span className="jobIndustry">{name}</span><h3>Explore {name}</h3><p>{text}</p><a href="/opportunities">View opportunities →</a></article>)}</div> : <div className="emptyState">No matching public industries found. Try another keyword or select “All industries”.</div>}</div>
      </div></section>

      <section className="section lightSection" id="industries"><div className="container"><div className="sectionHead"><div><div className="eyebrow">Browse by industry</div><h2>Focused on IT and Manufacturing.</h2></div><p>At this initial stage, Rowboat is publishing opportunities for Information Technology and Manufacturing only.</p></div><div className="industryGrid">{industries.map(([title,text],i)=><article className="industry" key={title}><span>{String(i+1).padStart(2,'0')}</span><h3>{title}</h3><p>{text}</p><a href="/opportunities">Explore →</a></article>)}</div></div></section>

      <section className="section" id="about"><div className="container aboutIntro"><div><div className="eyebrow">About Rowboat</div><h2>Making opportunities easier to discover.</h2></div><p>Rowboat Consulting Services is building an India-first opportunity discovery platform focused initially on Information Technology and Manufacturing. Our aim is to help job seekers, professionals and businesses discover relevant opportunities with clear information and appropriate application channels.</p></div><div className="valueGrid"><article><b>01</b><h3>Accessibility</h3><p>Make opportunities easier for people to find.</p></article><article><b>02</b><h3>Transparency</h3><p>Present requirements clearly and identify external sources.</p></article><article><b>03</b><h3>Focused sectors</h3><p>Start with IT and Manufacturing before expanding.</p></article><article><b>04</b><h3>India first</h3><p>Start with India and build toward a wider ecosystem.</p></article></div></section>

      <section className="darkSection" id="employers"><div className="container employerGrid"><div><div className="eyebrow">For employers & organizations</div><h2>Have an IT or manufacturing hiring requirement?</h2><p>Share your requirement with Rowboat. At this stage, public opportunities are focused on Information Technology and Manufacturing.</p><a className="btn btnWhite" href="#contact">Post a requirement →</a></div><div className="employerPoints"><span>01</span><strong>Share the role</strong><span>02</span><strong>Define skills & location</strong><span>03</span><strong>Connect with relevant talent</strong></div></div></section>

      <section className="careersSection" id="careers"><div className="container careersWrap"><div><div className="eyebrow">Careers at Rowboat</div><h2>We are building the platform as we go.</h2><p>When Rowboat Consulting Services has its own open positions, they will be published here. We will not create placeholder vacancies simply to make the site look complete.</p></div><div className="careerBox"><img src="/rowboat-mark.svg" alt=""/><strong>No current Rowboat openings.</strong><span>Check back for future opportunities.</span></div></div></section>

      <section className="contactSection" id="contact"><div className="container"><div className="contactIntro"><div><div className="eyebrow">Contact Rowboat</div><h2>Let's connect.</h2><p>Whether you are a job seeker, employer, business partner or organization, tell us what you need.</p></div><div className="contactDetails"><span>Enquiries</span><a href="mailto:ranjith@rowboatcs.com">ranjith@rowboatcs.com</a></div></div><form className="contactForm" onSubmit={handleContactSubmit}><label>Name<input name="name" required placeholder="Your name" autoComplete="name"/></label><label>Email<input name="email" type="email" required placeholder="you@company.com" autoComplete="email"/></label><label>I'm interested in<select name="interest"><option>Finding opportunities</option><option>Posting an IT hiring requirement</option><option>Posting a manufacturing hiring requirement</option><option>Business partnership</option><option>General enquiry</option></select></label><label>Message<textarea name="message" required rows={5} placeholder="Tell us what you need..."></textarea></label><div className="formActions"><button className="btn btnPrimary" type="submit">Send enquiry ↗</button><span className="formNote">Your enquiry is addressed to ranjith@rowboatcs.com.</span></div>{messageStatus && <p className="messageStatus" role="status">{messageStatus}</p>}</form></div></section>
    </main>

    <footer className="footer"><div className="container footerTop"><div className="footerBrand"><RowboatLogo className="footerLogo" /></div><div className="footerLinks"><a href="/opportunities">Opportunities</a><a href="#industries">Industries</a><a href="#employers">Employers</a><a href="#careers">Careers</a><a href="#about">About</a><a href="#contact">Contact</a></div></div><div className="container footerBottom"><span>© 2026 ROWBOAT CONSULTING SERVICES</span><span>IT + Manufacturing · Every Opportunity.</span></div></footer>
  </>
}
