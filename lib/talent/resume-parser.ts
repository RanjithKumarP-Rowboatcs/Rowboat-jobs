import pdfParse from 'pdf-parse'
import mammoth from 'mammoth'
import WordExtractor from 'word-extractor'

export type ParsedResume = {
  text: string
  fullName?: string
  location?: string
  currentCompany?: string
  experienceYears?: number
  noticePeriodDays?: number
  technology?: string
  primarySkill?: string
  secondarySkills: string[]
  industry?: string
  previousCompanies: string[]
  certifications: string[]
  projects: string[]
  aiSummary: string
}

const SKILLS = [
  'SAP CPI','SAP BTP','SAP Basis','SAP Datasphere','SAP S/4HANA','SAP ECC','SAP Integration Suite',
  'Python','Java','JavaScript','TypeScript','React','Next.js','Node.js','SQL','PostgreSQL','MySQL',
  'Data Engineering','Apache Spark','PySpark','AWS','Azure','GCP','Docker','Kubernetes','Terraform',
  'Power BI','Tableau','Snowflake','Databricks','Airflow','ETL','API','REST','GraphQL','Machine Learning',
  'Artificial Intelligence','Generative AI','LLM','MLOps','DevOps','Figma','Salesforce','ServiceNow',
]

function cleanText(text: string) {
  return text.replace(/\u0000/g, ' ').replace(/[ \t]+/g, ' ').replace(/\n{3,}/g, '\n\n').trim()
}

function firstMatch(text: string, patterns: RegExp[]) {
  for (const pattern of patterns) {
    const match = text.match(pattern)
    if (match?.[1]) return match[1].trim().replace(/[|•]+/g, ' ').trim()
  }
  return undefined
}

function extractName(text: string) {
  const lines = text.split(/\n+/).map(x => x.trim()).filter(Boolean).slice(0, 12)
  const bad = /resume|curriculum|vitae|profile|summary|objective|contact|email|phone|linkedin|github|skills/i
  return lines.find(line => /^[A-Za-z][A-Za-z .'-]{3,60}$/.test(line) && !bad.test(line))
}

function extractSkills(text: string) {
  const lower = text.toLowerCase()
  return SKILLS.filter(skill => lower.includes(skill.toLowerCase()))
}

function extractCompanies(text: string) {
  const values = [...text.matchAll(/(?:worked at|working at|employed at|company|employer)\s*[:\-]?\s*([A-Z][A-Za-z0-9&.,' -]{2,60})/gi)]
    .map(m => m[1].trim())
    .filter(Boolean)
  return [...new Set(values)].slice(0, 10)
}

function extractCertifications(text: string) {
  const section = firstMatch(text, [/(?:certifications?|certificates?)\s*[:\-]?\s*([\s\S]{0,1200})/i]) || ''
  return section.split(/\n|•|,|;/).map(x => x.trim()).filter(x => x.length > 3 && x.length < 120).slice(0, 12)
}

function extractProjects(text: string) {
  const section = firstMatch(text, [/(?:projects?|key projects?)\s*[:\-]?\s*([\s\S]{0,1800})/i]) || ''
  return section.split(/\n|•/).map(x => x.trim()).filter(x => x.length > 10 && x.length < 220).slice(0, 12)
}

function makeSummary(name: string | undefined, years: number | undefined, skills: string[], company: string | undefined, location: string | undefined, certifications: string[]) {
  const who = name || 'Candidate'
  const exp = years != null ? `${years} years of experience` : 'professional experience'
  const skillText = skills.slice(0, 8).join(', ') || 'relevant technical skills'
  const companyText = company ? ` currently associated with ${company}` : ''
  const locationText = location ? ` based in ${location}` : ''
  const certText = certifications.length ? ` Certifications include ${certifications.slice(0, 3).join(', ')}.` : ''
  return `${who} has ${exp}${companyText}${locationText}. Core capabilities include ${skillText}.${certText} This profile was generated from the candidate's submitted resume and should be validated by a recruiter before hiring decisions.`
}

export async function extractResumeText(buffer: Buffer, mimeType: string) {
  if (mimeType === 'application/pdf') {
    const parsed = await pdfParse(buffer)
    return cleanText(parsed.text || '')
  }
  if (mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
    const parsed = await mammoth.extractRawText({ buffer })
    return cleanText(parsed.value || '')
  }
  if (mimeType === 'application/msword') {
    const extractor = new WordExtractor()
    const document = await extractor.extract(buffer)
    return cleanText(document.getBody() || '')
  }
  throw new Error('Unsupported resume format')
}

export function analyzeResume(text: string): ParsedResume {
  const skills = extractSkills(text)
  const experienceRaw = firstMatch(text, [/(?:total\s+)?(?:years?|yrs?)\s+(?:of\s+)?experience\s*[:\-]?\s*(\d+(?:\.\d+)?)/i, /(\d+(?:\.\d+)?)\+?\s+years?\s+(?:of\s+)?experience/i])
  const noticeRaw = firstMatch(text, [/(?:notice\s+period|notice)\s*[:\-]?\s*(\d+)\s*days?/i, /(\d+)\s*days?\s*(?:notice|notice\s+period)/i])
  const location = firstMatch(text, [/(?:location|based in|current location)\s*[:\-]?\s*([^\n]{2,80})/i])
  const company = firstMatch(text, [/(?:current company|current employer|present company)\s*[:\-]?\s*([^\n]{2,100})/i])
  const industry = firstMatch(text, [/(?:industry|domain)\s*[:\-]?\s*([^\n]{2,80})/i])
  const technology = skills.slice(0, 5).join(', ') || undefined
  const primarySkill = skills[0]
  const certifications = extractCertifications(text)
  const projects = extractProjects(text)
  const previousCompanies = extractCompanies(text)
  const name = extractName(text)
  const experienceYears = experienceRaw ? Number(experienceRaw) : undefined
  const noticePeriodDays = noticeRaw ? Number(noticeRaw) : undefined

  return {
    text,
    fullName: name,
    location,
    currentCompany: company,
    experienceYears,
    noticePeriodDays,
    technology,
    primarySkill,
    secondarySkills: skills.slice(1),
    industry,
    previousCompanies,
    certifications,
    projects,
    aiSummary: makeSummary(name, experienceYears, skills, company, location, certifications),
  }
}
