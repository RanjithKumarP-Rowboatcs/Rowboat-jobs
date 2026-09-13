import { PDFParse } from 'pdf-parse'
import mammoth from 'mammoth'
import WordExtractor from 'word-extractor'

export type ParsedResume = {
  text: string
  fullName?: string
  email?: string
  phone?: string
  location?: string
  currentCompany?: string
  currentRole?: string
  experienceYears?: number
  relevantExperienceYears?: number
  noticePeriodDays?: number
  technology?: string
  primarySkill?: string
  secondarySkills: string[]
  industry?: string
  previousCompanies: string[]
  certifications: string[]
  projects: string[]
  linkedinUrl?: string
  currentCompensation?: number
  expectedCompensation?: number
  employmentType?: string
  workAuthorization?: string
  education: string[]
  technicalResponsibilities: string[]
  managementResponsibilities: string[]
  achievements: string[]
  aiSummary: string
}

const SKILLS = [
  'SAP CPI','SAP BTP','SAP Basis','SAP Datasphere','SAP S/4HANA','SAP ECC','SAP HANA','SAP Integration Suite','SAP Ariba','SAP SuccessFactors','SAP BW','SAP Fiori','SAP ABAP','SAP PI/PO',
  'Python','Java','JavaScript','TypeScript','React','Next.js','Node.js','SQL','PostgreSQL','MySQL','Oracle','MongoDB','Redis','Data Engineering','Data Science','Apache Spark','PySpark',
  'AWS','Azure','GCP','Docker','Kubernetes','Terraform','Power BI','Tableau','Snowflake','Databricks','Airflow','ETL','API','REST','GraphQL','Machine Learning','Artificial Intelligence','Generative AI','LLM','MLOps','DevOps','Figma','Salesforce','ServiceNow','C','C++','C#','.NET','Angular','Vue.js','Spring Boot','Django','Flask',
  'AIX','SUSE Linux','Red Hat Linux','Redhat Linux','Windows','Linux','Unix','Stonebranch','Centrify','Vault','Vaults','Zabbix','Splunk','CHARM','Active Control','Cosmos','Freshservice','Confluence','Jira','SAP SPAD','STMS','Cloud Connector','Kernel Upgrade','SPS Upgrade','SPAM/SAINT','SUM','RFC','Java NWA','SLD','DB13','CUPS','SAP Router','HANA','Basis'
]

const SECTION_NAMES = [
  'professional experience','work experience','employment history','career history','experience','employment','work history',
  'education','academic background','qualifications','academic qualifications','skills','technical skills','core skills','competencies',
  'certifications','certificates','projects','project experience','project history','achievements','awards','accomplishments','recognition',
  'responsibilities','technical responsibilities','management responsibilities','leadership','leadership responsibilities','summary','professional summary','objective'
]

const NAME_STOP = /^(resume|curriculum vitae|cv|profile|summary|objective|contact|skills|experience|education|professional experience|technical skills|work experience|employment history|career|references|projects?|certifications?|achievements?|awards?)$/i

function cleanText(text: string) {
  return text.replace(/\u0000/g, ' ').replace(/\r/g, '\n').replace(/[\u2000-\u200B\u202F]/g, ' ').replace(/[ \t]+/g, ' ').replace(/\n[ \t]+/g, '\n').replace(/\n{3,}/g, '\n\n').trim()
}

function linesOf(text: string) {
  return text.split(/\n+/).map(line => line.trim().replace(/^[•●➢▪◦*\-]\s*/, '').trim()).filter(Boolean)
}

function unique(values: string[]) { return [...new Set(values.map(v => v.trim()).filter(Boolean))] }

function firstMatch(text: string, patterns: RegExp[]) {
  for (const pattern of patterns) { const m = text.match(pattern); if (m?.[1]) return m[1].trim().replace(/[|•]+/g, ' ').trim() }
  return undefined
}

function extractEmail(text: string) { return text.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i)?.[0]?.toLowerCase() }

function extractPhone(text: string) {
  const matches = text.match(/(?:\+?\d[\d\s().-]{8,}\d)/g) || []
  return matches.map(v => v.trim()).find(v => { const digits = v.replace(/\D/g, ''); return digits.length >= 10 && digits.length <= 15 })
}

function extractLinkedIn(text: string) {
  const m = text.match(/(?:https?:\/\/)?(?:www\.)?linkedin\.com\/(?:in|pub)\/[A-Za-z0-9._%/-]+/i)
  return m?.[0] ? (m[0].startsWith('http') ? m[0] : `https://${m[0]}`).replace(/[),.;]+$/, '') : undefined
}

function isHeading(line: string) {
  const value = line.toLowerCase().replace(/^[-•●➢▪◦*\s]+/, '').replace(/[:\-]+$/, '').trim()
  return SECTION_NAMES.some(name => value === name || value.startsWith(`${name} `))
}

function looksLikeName(value: string) {
  const line = value.replace(/^[•●➢▪◦*\-\s]+/, '').trim()
  const words = line.split(/\s+/).filter(Boolean)
  if (words.length < 2 || words.length > 5 || line.length > 70 || NAME_STOP.test(line)) return false
  if (/@|https?:\/\/|\d|linkedin|phone|email/i.test(line)) return false
  return words.every(word => /^[A-Za-z][A-Za-z.'-]*$/.test(word))
}

function extractName(text: string) {
  const lines = linesOf(text).slice(0, 25)
  for (const line of lines) if (looksLikeName(line)) return line

  // Handles common PDF column extraction such as: "Darshita Oza SAP BASIS/HANA"
  // and "John Smith | Senior Consultant".
  const titleWords = '(?:Senior|Lead|Principal|Consultant|Engineer|Developer|Architect|Analyst|Manager|Specialist|Professional|SAP|Software|Data|IT|BASIS|HANA)'
  for (const line of lines) {
    const m = line.match(new RegExp(`^([A-Za-z][A-Za-z.'-]+(?:\\s+[A-Za-z][A-Za-z.'-]+){1,3})(?=\\s+(?:${titleWords})\\b|\\s*[-|,])`, 'i'))
    if (m?.[1] && looksLikeName(m[1])) return m[1]
  }

  // If the first line contains contact information, take the leading 2-5 alphabetic words.
  const first = lines[0] || ''
  const prefix = first.match(/^([A-Za-z][A-Za-z.'-]+(?:\s+[A-Za-z][A-Za-z.'-]+){1,3})(?=\s)/)?.[1]
  if (prefix && looksLikeName(prefix)) return prefix
  return undefined
}

function extractSkills(text: string) {
  const lower = text.toLowerCase()
  return unique(SKILLS.filter(skill => lower.includes(skill.toLowerCase())))
}

function extractLabeled(text: string, labels: string[]) {
  const label = labels.map(v => v.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')
  return firstMatch(text, [new RegExp(`(?:^|\\n)\\s*(?:${label})\\s*[:\\-]\\s*([^\\n]{2,180})`, 'im')])
}

function extractLocation(text: string) {
  const labelled = extractLabeled(text, ['current location','location','based in','residing in','city'])
  if (labelled) return labelled.replace(/\b(?:linkedin|email|phone)\b.*$/i, '').trim()

  const commonCities = ['Hyderabad','Pune','Mumbai','Bengaluru','Bangalore','Chennai','Delhi','Gurgaon','Gurugram','Noida','Kolkata','Ahmedabad','Jaipur','Kochi','Coimbatore','Mysore','Nashik','Nagpur']
  for (const city of commonCities) if (new RegExp(`\\b${city}\\b`, 'i').test(text)) return city

  const header = linesOf(text).slice(0, 15).find(line => /\b[A-Za-z .'-]+,\s*[A-Za-z .'-]+\b/.test(line) && !line.includes('@') && !/linkedin|phone/i.test(line))
  return header?.replace(/\|.*$/, '').trim()
}

function extractExperience(text: string) {
  const total = firstMatch(text, [
    /(?:total|overall|professional|IT)\s*(?:IT\s*)?(?:professional\s*)?(?:experience)?\s*[:\-]?\s*(\d+(?:\.\d+)?)\s*\+?\s*years?/i,
    /(\d+(?:\.\d+)?)\s*\+?\s*years?\s+(?:of\s+)?(?:total\s+|overall\s+|professional\s+|IT\s+)?experience/i,
    /(?:experience|exp)\s*[:\-]?\s*(\d+(?:\.\d+)?)\s*\+?\s*years?/i
  ])
  const relevant = firstMatch(text, [
    /(\d+(?:\.\d+)?)\s*\+?\s*years?\s+(?:of\s+)?relevant\s+experience/i,
    /relevant\s+experience\s*[:\-]?\s*(\d+(?:\.\d+)?)\s*\+?\s*years?/i
  ])
  if (total) return { total: Number(total), relevant: relevant ? Number(relevant) : undefined }

  const ranges = [...text.matchAll(/\b(19\d{2}|20\d{2})\s*(?:[/.]\s*\d{1,2})?\s*(?:-|–|—|to)\s*(?:(19\d{2}|20\d{2})\s*(?:[/.]\s*\d{1,2})?|present|current|till\s+date)\b/gi)]
  if (!ranges.length) return { total: undefined, relevant: relevant ? Number(relevant) : undefined }
  const earliest = Math.min(...ranges.map(r => Number(r[1])))
  return { total: Math.max(0, Math.round((new Date().getFullYear() - earliest) * 10) / 10), relevant: relevant ? Number(relevant) : undefined }
}

function extractNotice(text: string) {
  if (/\b(immediate joiner|immediate joining|can join immediately|available immediately|join immediately)\b/i.test(text)) return 0
  const m = text.match(/(?:notice\s+period|notice)\s*[:\-]?\s*(\d+)\s*(days?|weeks?|months?)/i)
  if (!m) return undefined
  const n = Number(m[1]); const unit = m[2].toLowerCase()
  return unit.startsWith('month') ? n * 30 : unit.startsWith('week') ? n * 7 : n
}

function extractCurrentEmployment(text: string) {
  const labelledCompany = extractLabeled(text, ['current company','current employer','present company','employer'])
  const labelledRole = extractLabeled(text, ['current role','current designation','designation','job title','title','role'])
  if (labelledCompany || labelledRole) return { company: labelledCompany, role: labelledRole }

  const lines = linesOf(text)
  const start = lines.findIndex(line => /^(professional |work |employment |career )?(experience|history)$/i.test(line))
  const window = lines.slice(start >= 0 ? start + 1 : 0, start >= 0 ? start + 45 : 45)
  for (const line of window) {
    const m = line.match(/^(.+?)\s*\(([^)]*(?:current|present|till date)[^)]*)\)\s*[-–—|:]\s*(.+)$/i)
    if (m) return { company: m[1].trim(), role: m[3].trim() }
  }
  return { company: undefined, role: undefined }
}

function extractCompanies(text: string) {
  const companies: string[] = []
  for (const line of linesOf(text)) {
    const m = line.match(/^(.+?)\s*\([^)]*(?:19\d{2}|20\d{2})[^)]*\)/)
    if (m?.[1] && m[1].length > 2 && !isHeading(m[1])) companies.push(m[1].trim())
  }
  return unique(companies).slice(0, 10)
}

function extractSectionFlexible(text: string, headings: string[]) {
  const lines = linesOf(text)
  const aliases = headings.map(h => h.toLowerCase())
  const start = lines.findIndex(line => aliases.includes(line.toLowerCase().replace(/^[-•●➢▪◦*\s]+/, '').replace(/[:\-]+$/, '').trim()))
  if (start < 0) return []
  const values: string[] = []
  for (let i = start + 1; i < lines.length && values.length < 60; i++) {
    if (isHeading(lines[i])) break
    const value = lines[i].replace(/^[\-–—•●➢▪◦*]\s*/, '').trim()
    if (value.length >= 3 && value.length <= 800) values.push(value)
  }
  return values
}

function extractCertifications(text: string) { return extractSectionFlexible(text, ['certifications','certificates','professional certifications']) }
function extractProjects(text: string) { return extractSectionFlexible(text, ['projects','key projects','project experience','project history']) }
function extractEducation(text: string) { return extractSectionFlexible(text, ['education','academic background','qualifications','academic qualifications']) }
function extractAchievements(text: string) { return extractSectionFlexible(text, ['achievements','awards','accomplishments','recognition']) }
function extractResponsibilities(text: string, type: 'technical' | 'management') {
  return extractSectionFlexible(text, type === 'technical' ? ['technical responsibilities','technical skills and responsibilities','key responsibilities','responsibilities'] : ['management responsibilities','leadership responsibilities','management and leadership','leadership'])
}

function extractMoney(text: string, labels: string[]) {
  const label = labels.map(v => v.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')
  const m = text.match(new RegExp(`(?:${label})\\s*[:\\-]?\\s*(?:INR|Rs\\.?|₹)?\\s*([0-9]+(?:\\.[0-9]+)?)\\s*(lpa|lakhs?|lakh|crore|cr)?`, 'i'))
  if (!m) return undefined
  const n = Number(m[1]); const unit = (m[2] || '').toLowerCase()
  return unit === 'lpa' || unit === 'lakh' || unit === 'lakhs' ? n * 100000 : unit === 'cr' || unit === 'crore' ? n * 10000000 : n
}

function inferIndustry(text: string, skills: string[]) {
  const lower = text.toLowerCase()
  if (/banking|finance|fintech|financial services|insurance/.test(lower)) return 'Banking & Financial Services'
  if (/healthcare|hospital|pharma|medical|life sciences/.test(lower)) return 'Healthcare'
  if (/manufacturing|automotive|production|industrial/.test(lower)) return 'Manufacturing'
  if (/retail|e-commerce|ecommerce|consumer/.test(lower)) return 'Retail & E-commerce'
  if (/telecom|telecommunications/.test(lower)) return 'Telecommunications'
  if (/energy|utilities|oil and gas|power/.test(lower)) return 'Energy & Utilities'
  return skills.length || /software|technology|IT services|developer|engineering|SAP|database/i.test(text) ? 'Information Technology' : undefined
}

function makeSummary(name: string | undefined, years: number | undefined, relevant: number | undefined, skills: string[], company?: string, location?: string) {
  return `${name || 'Candidate'} has ${years != null ? `${years} years of total experience` : 'professional experience'}${relevant != null ? `, including ${relevant} years of relevant experience` : ''}${company ? ` and is currently associated with ${company}` : ''}${location ? `, based in ${location}` : ''}. Core capabilities explicitly listed in the resume include ${(skills.slice(0, 12).join(', ') || 'relevant skills')}. Recruiter validation is required.`
}

export async function extractResumeText(buffer: Buffer, mimeType: string) {
  if (mimeType === 'application/pdf') {
    const parser = new PDFParse({ data: buffer })
    try { const result = await parser.getText(); return cleanText(result.text || '') } finally { await parser.destroy() }
  }
  if (mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
    const result = await mammoth.extractRawText({ buffer }); return cleanText(result.value || '')
  }
  if (mimeType === 'application/msword') {
    const extractor = new WordExtractor(); const document = await extractor.extract(buffer); return cleanText(document.getBody() || '')
  }
  throw new Error('Unsupported resume format. Please upload PDF, DOCX or DOC.')
}

export function analyzeResume(text: string): ParsedResume {
  const normalized = cleanText(text)
  const skills = extractSkills(normalized)
  const email = extractEmail(normalized)
  const phone = extractPhone(normalized)
  const linkedinUrl = extractLinkedIn(normalized)
  const fullName = extractName(normalized)
  const experience = extractExperience(normalized)
  const noticePeriodDays = extractNotice(normalized)
  const location = extractLocation(normalized)
  const current = extractCurrentEmployment(normalized)
  const previousCompanies = extractCompanies(normalized).filter(c => c.toLowerCase() !== current.company?.toLowerCase()).slice(0, 10)
  const certifications = extractCertifications(normalized)
  const projects = extractProjects(normalized)
  const education = extractEducation(normalized)
  const achievements = extractAchievements(normalized)
  const technicalResponsibilities = extractResponsibilities(normalized, 'technical')
  const managementResponsibilities = extractResponsibilities(normalized, 'management')
  const industry = extractLabeled(normalized, ['industry','domain','sector']) || inferIndustry(normalized, skills)
  const employmentType = extractLabeled(normalized, ['employment type','job type'])
  const workAuthorization = extractLabeled(normalized, ['work authorization','work permit','visa status','authorization'])
  const currentCompensation = extractMoney(normalized, ['current ctc','current compensation','current salary','present ctc','present salary'])
  const expectedCompensation = extractMoney(normalized, ['expected ctc','expected compensation','expected salary','desired salary'])
  const technology = skills.slice(0, 20).join(', ')
  const primarySkill = skills[0]

  return {
    text: normalized, fullName, email, phone, location, currentCompany: current.company, currentRole: current.role,
    experienceYears: experience.total, relevantExperienceYears: experience.relevant, noticePeriodDays,
    technology: technology || undefined, primarySkill, secondarySkills: skills.slice(1), industry,
    previousCompanies, certifications, projects, linkedinUrl, currentCompensation, expectedCompensation,
    employmentType, workAuthorization, education, technicalResponsibilities, managementResponsibilities, achievements,
    aiSummary: makeSummary(fullName, experience.total, experience.relevant, skills, current.company, location)
  }
}
