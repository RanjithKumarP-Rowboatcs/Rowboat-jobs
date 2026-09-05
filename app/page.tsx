'use client'

import { useMemo, useState } from 'react'

const industries = [
  ['Information Technology', 'Software, cloud, AI, data, cybersecurity, infrastructure and digital roles.'],
  ['Manufacturing', 'Production, quality, operations, maintenance, engineering and supply chain.'],
  ['Pharmaceuticals', 'Pharma, biotechnology, clinical research, regulatory, quality and laboratory roles.'],
  ['Healthcare & Medical', 'Hospitals, diagnostics, nursing, allied healthcare and administration.'],
  ['Banking & Finance', 'Banking, accounting, financial services, insurance, fintech and risk.'],
  ['Engineering', 'Mechanical, electrical, civil, electronics, industrial and specialist engineering.'],
  ['Startups', 'Opportunities with early-stage, growth-stage and emerging businesses.'],
  ['Government & Public Sector', 'Publicly available government and public-sector employment opportunities.'],
  ['Automotive', 'Automotive engineering, production, service, design, sales and operations.'],
  ['Construction & Infrastructure', 'Construction, architecture, project management and infrastructure.'],
  ['Education', 'Teaching, training, academic administration, research and EdTech.'],
  ['Logistics & Supply Chain', 'Procurement, warehousing, transportation and supply chain operations.'],
]

const sampleJobs = [
  { title: 'Software Engineer', company: 'Example Technology Company', location: 'Hyderabad, Telangana', industry: 'Information Technology', experience: '2–5 years', type: 'Full-time' },
  { title: 'Production Engineer', company: 'Example Manufacturing Company', location: 'Pune, Maharashtra', industry: 'Manufacturing', experience: '1–4 years', type: 'Full-time' },
  { title: 'Quality Assurance Associate', company: 'Example Pharma Company', location: 'Ahmedabad, Gujarat', industry: 'Pharmaceuticals', experience: '2–5 years', type: 'Full-time' },
]

export default function Home() {
  const [query, setQuery] = useState('')
  const [industry, setIndustry] = useState('All industries')

  const filteredJobs = useMemo(() => sampleJobs.filter((job) => {
    const matchesQuery = !query || `${job.title} ${job.company} ${job.location} ${job.industry}`.toLowerCase().includes(query.toLowerCase())
    const matchesIndustry = industry === 'All industries' || job.industry === industry
    return matchesQuery && matchesIndustry
  }), [query, industry])

  return <>
    <nav className="nav"><div className="container navInner">
      <a className="brand" href="#top" aria-label="ROWBOAT Jobs home"><img src="/rowboat-mark.svg" alt="ROWBOAT"/><span><strong>ROWBOAT</strong><small>JOBS · OPPORTUNITIES</small></span></a>
      <div className="navLinks"><a href="#opportunities">Opportunities</a><a href="#industries">Industries</a><a href="#employers">Employers</a><a href="#about">About</a><a className="navCta" href="#contact">Contact ↗</a></div>
      <a className="mobileMenu" href="#opportunities" aria-label="Explore opportunities">☰</a>
    </div></nav>

    <main id="top">
      <section className="jobsHero"><div className="heroBackdrop"></div><div className="container jobsHeroInner">
        <div><div className="eyebrow">India · Careers · Opportunities</div><h1>Every Industry.<br/><em>Every Opportunity.</em><br/>One Platform.</h1><p>Discover employment opportunities across India's diverse industries and sectors — from IT and startups to manufacturing, pharmaceuticals, healthcare, finance, engineering, government and more.</p><div className="heroActions"><a className="btn btnPrimary" href="#opportunities">Explore opportunities →</a><a className="textButton" href="#employers">For employers ↗</a></div></div>
        <div className="heroPanel"><div className="panelKicker">ROWBOAT / OPPORTUNITY PLATFORM</div><div className="heroPanelTitle">Discover.<br/>Explore.<br/><strong>Connect.</strong></div><div className="heroLines"><span/><span/><span/><span/><span/></div><div className="heroPanelBottom"><span>INDIA FIRST</span><span>MULTI-SECTOR</span><span>ACCESSIBLE</span></div></div>
      </div></section>

      <section className="searchSection" id="opportunities"><div className="container"><div className="eyebrow">Explore opportunities</div><h2>Find an opportunity that fits you.</h2><p className="sectionLead">Search by role, skill, company or location and narrow results by industry.</p><div className="searchBar"><input value={query} onChange={e => setQuery(e.target.value)} placeholder="Job title, skill, company or location" aria-label="Search opportunities"/><select value={industry} onChange={e => setIndustry(e.target.value)} aria-label="Filter by industry"><option>All industries</option>{industries.map(([name]) => <option key={name}>{name}</option>)}</select><button className="btn btnPrimary" type="button">Search</button></div>
        <div className="jobResults"><div className="resultsHeader"><strong>{filteredJobs.length} sample opportunities</strong><span>Listings will grow as verified requirements are added.</span></div>{filteredJobs.map(job => <article className="jobCard" key={`${job.title}-${job.company}`}><div><span className="jobIndustry">{job.industry}</span><h3>{job.title}</h3><p>{job.company} · {job.location}</p></div><div className="jobMeta"><span>{job.experience}</span><span>{job.type}</span><a href="#contact">View opportunity →</a></div></article>)}{filteredJobs.length === 0 && <div className="emptyState">No matching opportunities in this sample set. Try another search or check back as new listings are added.</div>}</div>
      </div></section>

      <section className="section lightSection" id="industries"><div className="container"><div className="sectionHead"><div><div className="eyebrow">Browse by industry</div><h2>Opportunities across India's business landscape.</h2></div><p>We are building a structured way to discover requirements across industries, locations, experience levels and employment types.</p></div><div className="industryGrid">{industries.map(([title,text],i)=><article className="industry" key={title}><span>{String(i+1).padStart(2,'0')}</span><h3>{title}</h3><p>{text}</p><a href="#opportunities">Explore →</a></article>)}</div></div></section>

      <section className="section" id="about"><div className="container aboutIntro"><div><div className="eyebrow">About Rowboat</div><h2>Making opportunities easier to discover.</h2></div><p>Rowboat Consulting Services is building an India-first opportunity discovery platform that brings employment requirements from different industries and sectors into one accessible place. Our aim is to help job seekers, professionals and businesses discover relevant opportunities with clear information and appropriate application channels.</p></div><div className="valueGrid"><article><b>01</b><h3>Accessibility</h3><p>Make opportunities easier for people to find.</p></article><article><b>02</b><h3>Transparency</h3><p>Present requirements clearly and identify external sources.</p></article><article><b>03</b><h3>Multi-sector</h3><p>Cover diverse industries rather than a single profession.</p></article><article><b>04</b><h3>India first</h3><p>Start with India and build toward a wider global ecosystem.</p></article></div></section>

      <section className="darkSection" id="employers"><div className="container employerGrid"><div><div className="eyebrow">For employers & organizations</div><h2>Have a hiring requirement?</h2><p>Share your requirement with Rowboat. As the platform develops, employers will be able to reach candidates across industries and locations.</p><a className="btn btnWhite" href="#contact">Post a requirement →</a></div><div className="employerPoints"><span>01</span><strong>Share the role</strong><span>02</span><strong>Define skills & location</strong><span>03</span><strong>Connect with relevant talent</strong></div></div></section>

      <section className="section government"><div className="container twoCol"><div><div className="eyebrow">Government & public sector</div><h2>Discover publicly available government opportunities.</h2></div><div><p>Rowboat can help users discover publicly available employment information across central government, state government, public-sector organizations and other public institutions.</p><p className="notice">Rowboat is an independent platform and is not a government organization. Applicants should verify recruitment details and apply through the official recruitment source wherever available.</p><a className="textButton" href="#contact">Explore government opportunities →</a></div></div></section>

      <section className="careersSection"><div className="container careersWrap"><div><div className="eyebrow">Careers at Rowboat</div><h2>We are building the platform as we go.</h2><p>When Rowboat Consulting Services has its own open positions, they will be published here. We will not create placeholder vacancies simply to make the site look complete.</p></div><div className="careerBox"><img src="/rowboat-mark.svg" alt=""/><strong>No current Rowboat openings.</strong><span>Check back for future opportunities.</span></div></div></section>

      <section className="contactSection" id="contact"><div className="container"><div className="contactIntro"><div><div className="eyebrow">Contact Rowboat</div><h2>Let's connect.</h2><p>Whether you are a job seeker, employer, business partner or organization, tell us what you need.</p></div><div className="contactDetails"><span>General enquiries</span><a href="mailto:careers@rowboatcs.com">careers@rowboatcs.com</a></div></div><form className="contactForm" action="mailto:careers@rowboatcs.com" method="post" encType="text/plain"><label>Name<input name="name" required placeholder="Your name"/></label><label>Email<input name="email" type="email" required placeholder="you@company.com"/></label><label>I'm interested in<select name="interest"><option>Finding opportunities</option><option>Posting a hiring requirement</option><option>Business partnership</option><option>General enquiry</option></select></label><label>Message<textarea name="message" required rows={5} placeholder="Tell us what you need..."></textarea></label><button className="btn btnPrimary" type="submit">Send enquiry ↗</button></form></div></section>
    </main>

    <footer className="footer"><div className="container footerTop"><div className="footerBrand"><img src="/rowboat-mark.svg" alt="ROWBOAT"/><div><strong>ROWBOAT</strong><small>CONSULTING SERVICES</small></div></div><div className="footerLinks"><a href="#opportunities">Opportunities</a><a href="#industries">Industries</a><a href="#employers">Employers</a><a href="#about">About</a><a href="#contact">Contact</a></div></div><div className="container footerBottom"><span>© 2026 ROWBOAT CONSULTING SERVICES</span><span>Every Industry. Every Opportunity. One Platform.</span></div></footer>
  </>
}
