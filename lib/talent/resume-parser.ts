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

// Broad, recruiter-oriented vocabulary. The parser also keeps factual text from
// resumes instead of requiring a fixed template, so new technologies can still
// appear in the extracted sections even when they are not in this list.
const SKILLS = [
  'SAP CPI','SAP BTP','SAP Basis','SAP Datasphere','SAP S/4HANA','SAP ECC','SAP HANA','SAP Integration Suite',
  'SAP Ariba','SAP SuccessFactors','SAP BW','SAP Fiori','SAP ABAP','SAP PI/PO','Python','Java','JavaScript','TypeScript',
  'React','Next.js','Node.js','SQL','PostgreSQL','MySQL','Oracle','MongoDB','Redis','Data Engineering','Data Science',
  'Apache Spark','PySpark','AWS','Azure','GCP','Docker','Kubernetes','Terraform','Power BI','Tableau','Snowflake',
  'Databricks','Airflow','ETL','API','REST','GraphQL','Machine Learning','Artificial Intelligence','Generative AI','LLM',
  'MLOps','DevOps','Figma','Salesforce','ServiceNow','C','C++','C#','.NET','Angular','Vue.js','Spring Boot','Django',
  'Flask','AIX','SUSE Linux','Red Hat Linux','Redhat Linux','Windows','Linux','Unix','Stonebranch','Centrify','Vault',
  'Zabbix','Splunk','CHARM','Active Control','Cosmos','Freshservice','Confluence','Jira','SAP SPAD','STMS','Cloud Connector',
  'Kernel Upgrade','SPS Upgrade','SPAM/SAINT','SUM','RFC','Java NWA','SLD','DB13','CUPS','SAP Router','HANA','Basis'
]

const NAME_STOP = /^(resume|curriculum vitae|cv|profile|summary|objective|contact|skills|experience|education|professional experience|technical skills|work experience|employment history|career|references|projects?|certifications?|achievements?|awards?)$/i
const SECTION_NAMES = [
  'professional experience','work experience','employment history','career history','experience','employment','work history',
  'education','academic background','qualifications','skills','technical skills','core skills','competencies','certifications',
  'certificates','projects','project experience','achievements','awards','accomplishments','responsibilities',
  'technical responsibilities','management responsibilities','leadership','summary','professional summary','objective'
]

function cleanText(text: string) {
  return text
    .replace(/\u0000/g, ' ')
    .replace(/\r/g, '\n')
    .replace(/[\u2000-\u200B\u202F]/g, ' ')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n[ \t]+/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

function linesOf(text: string) {
  return text.split(/\n+/).map(line => line.trim().replace(/^[•●➢▪◦*]\s*/, '').trim()).filter(Boolean)
}

function unique(values: string[]) {
  return [...new Set(values.map(v => v.trim()).filter(Boolean))]
}

function firstMatch(text: string, patterns: RegExp[]) {
  for (const pattern of patterns) {
    const match = text.match(pattern)
    if (match?.[1]) return match[1].trim().replace(/[|•]+/g, ' ').trim()
  }
  return undefined
}

function extractEmail(text: string) {
  return text.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i)?.[0]?.toLowerCase()
}

function extractPhone(text: string) {
  const matches = text.match(/(?:\+?\d[\d\s().-]{8,}\d)/g) || []
  return matches.map(v => v.trim()).find(v => {
    const digits = v.replace(/\D/g, '')
    return digits.length >= 10 && digits.length <= 15
  })
}

function extractLinkedIn(text: string) {
  const match = text.match(/(?:https?:\/\/)?(?:www\.)?linkedin\.com\/(?:in|pub)\/[A-Za-z0-9._%/-]+/i)
  if (!match?.[0]) return undefined
  return (match[0].startsWith('http') ? match[0] : `https://${match[0]}`).replace(/[),.;]+$/, '')
}

function looksLikeName(line: string) {
  const value = line.replace(/^[•●➢▪◦*-]\s*/, '').trim().replace(/[|,:;]+$/, '')
  const words = value.split(/\s+/).filter(Boolean)
  if (words.length < 2 || words.length > 5 || value.length > 70 || NAME_STOP.test(value)) return false
  if (/@|https?:\/\/|\d/.test(value)) return false
  if (SECTION_NAMES.some(section => value.toLowerCase() === section)) return false
  return words.every(word => /^[A-Za-z][A-Za-z.'-]*$/.test(word))
}

function extractName(text: string) {
  const lines = linesOf(text).slice(0, 20)
  // Most resumes put the name before contact details. Accept normal and all-caps names.
  for (const line of lines) if (looksLikeName(line)) return line
  // Some PDF extractors concatenate the name and title on one line.
  for (const line of lines) {
    const cleaned = line.replace(/\s+/g, ' ')
    const match = cleaned.match(/^([A-Za-z][A-Za-z.'-]+(?:\s+[A-Za-z][A-Za-z.'-]+){1,3})(?:\s*[|,-]\s*|\s+)(?:Senior|Lead|Principal|Consultant|Engineer|Developer|Architect|Analyst|Manager|Specialist|Professional|SAP|Software|Data|IT)\b/i)
    if (match && looksLikeName(match[1])) return match[1]
  }
  return undefined
}

function extractSkills(text: string) {
  const lower = text.toLowerCase()
  return unique(SKILLS.filter(skill => lower.includes(skill.toLowerCase())))
}

function extractLabeled(text: string, labels: string[]) {
  const label = labels.map(v => v.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')
  return firstMatch(text, [new RegExp(`(?:^|\\n)\\s*(?:${label})\\s*[:\\-]\\s*([^\\n]{2,160})`, 'im')])
}

function isHeading(line: string) {
  const normalized = line.toLowerCase().replace(/[:\-]+$/, '').trim()
  return SECTION_NAMES.some(name => normalized === name || normalized.startsWith(`${name} `))
}

function sectionLines(text: string, headings: string[], maxItems = 50) {
  const lines = linesOf(text)
  const normalizedHeadings = headings.map(v => v.toLowerCase())
  const start = lines.findIndex(line => normalizedHeadings.includes(line.toLowerCase().replace(/[:\-]+$/, '').trim()))
  if (start < 0) return []
  const result: string[] = []
  for (let i = start + 1; i < lines.length && result.length < maxItems; i++) {
    if (isHeading(lines[i])) break
    const value = lines[i].replace(/^[\-–—•●➢▪◦*]\s*/, '').trim()
    if (value.length >= 3 && value.length <= 600) result.push(value)
  }
  return result
}

function extractDateRanges(text: string) {
  return [...text.matchAll(/\b(19\d{2}|20\d{2})\s*(?:[\/.]\s*\d{1,2})?\s*(?:-|–|—|to)\s*(?:(19\d{2}|20\d{2})\s*(?:[\/.]\s*\d{1,2})?|present|current|till\s+date)\b/gi)]
}

function extractExperience(text: string) {
  const totalText = firstMatch(text, [
    /(?:total|overall|professional|IT)\s*(?:years?\s*)?(?:of\s*)?(?:IT\s*)?(?:professional\s*)?experience\s*[:\-]?\s*(\d+(?:\.\d+)?)\s*\+?\s*years?/i,
    /(\d+(?:\.\d+)?)\s*\+?\s*years?\s+(?:of\s+)?(?:total\s+|overall\s+|professional\s+|IT\s+)?experience/i,
    /(?:experience|exp)\s*[:\-]?\s*(\d+(?:\.\d+)?)\s*\+?\s*years?/i
  ])
  const relevantText = firstMatch(text, [
    /(\d+(?:\.\d+)?)\s*\+?\s*years?\s+(?:of\s+)?relevant\s+experience/i,
    /relevant\s+experience\s*[:\-]?\s*(\d+(?:\.\d+)?)\s*\+?\s*years?/i,
    /(\d+(?:\.\d+)?)\s*\+?\s*years?\s+(?:of\s+)?experience\s+(?:in|with)\s+[A-Za-z0-9+./ -]{2,80}/i
  ])
  if (totalText) return { total: Number(totalText), relevant: relevantText ? Number(relevantText) : undefined }
  const ranges = extractDateRanges(text)
  if (!ranges.length) return { total: undefined, relevant: relevantText ? Number(relevantText) : undefined }
  const earliest = Math.min(...ranges.map(r => Number(r[1])))
  const currentYear = new Date().getFullYear()
  const total = Math.max(0, Math.round((currentYear - earliest) * 10) / 10)
  return { total, relevant: relevantText ? Number(relevantText) : undefined }
}

function extractNotice(text: string) {
  if (/\b(immediate joiner|immediate joining|can join immediately|available immediately|join immediately)\b/i.test(text)) return 0
  const value = firstMatch(text, [
    /(?:notice\s+period|notice)\s*[:\-]?\s*(\d+)\s*days?/i,
    /(\d+)\s*days?\s*(?:notice|notice\s+period)/i,
    /(?:notice\s+period|notice)\s*[:\-]?\s*(\d+)\s*(?:weeks?|months?)/i
  ])
  if (!value) return undefined
  const match = text.match(/(?:notice\s+period|notice)\s*[:\-]?\s*(\d+)\s*(days?|weeks?|months?)/i)
  if (!match) return Number(value)
  const n = Number(match[1]); const unit = match[2].toLowerCase()
  return unit.startsWith('month') ? n * 30 : unit.startsWith('week') ? n * 7 : n
}

function extractLocation(text: string) {
  const labelled = extractLabeled(text, ['current location','location','based in','residing in','city'])
  if (labelled) return labelled.replace(/\b(?:linkedin|email|phone)\b.*$/i, '').trim()
  const header = linesOf(text).slice(0, 12).find(line => /\b[A-Za-z .'-]+,\s*[A-Za-z .'-]+\b/.test(line) && !line.includes('@') && !/linkedin|phone/i.test(line))
  if (header) return header.replace(/\|.*$/, '').trim()
  return undefined
}

function extractCurrentEmployment(text: string) {
  const labelledCompany = extractLabeled(text, ['current company','current employer','present company','employer'])
  const labelledRole = extractLabeled(text, ['current role','current designation','designation','job title','title','role'])
  if (labelledCompany || labelledRole) return { company: labelledCompany, role: labelledRole }

  const lines = linesOf(text)
  const experienceHead = lines.findIndex(line => /^(professional |work |employment |career )?(experience|history)$/i.test(line))
  const start = experienceHead >= 0 ? experienceHead + 1 : 0
  const window = lines.slice(start, Math.min(lines.length, start + 35))
  for (let i = 0; i < window.length; i++) {
    const line = window[i]
    if (!/\b(?:current|present|till date)\b/i.test(line)) continue
    const beforeDate = line.split(/\s*\([^)]*(?:current|present|till date)[^)]*\)/i)[0].trim()
    const parts = beforeDate.split(/\s+[-–—|]\s+/).map(v => v.trim()).filter(Boolean)
    if (parts.length >= 2) return { company: parts[0], role: parts[1] }
    const next = window[i + 1]
    if (next && !isHeading(next)) return { company: beforeDate, role: next }
    return { company: beforeDate, role: undefined }
  }
  return { company: undefined, role: undefined }
}

function extractCompanies(text: string) {
  const lines = linesOf(text)
  const companies: string[] = []
  for (const line of lines) {
    if (!/\b(?:19\d{2}|20\d{2})\b/.test(line)) continue
    const match = line.match(/^(.+?)\s*\([^)]*(?:19\d{2}|20\d{2})[^)]*\)/)
    if (match?.[1] && match[1].length > 2 && !isHeading(match[1])) companies.push(match[1].replace(/\s*[-–—|]\s*$/, '').trim())
  }
  return unique(companies).slice(0, 10)
}

function extractSectionFlexible(text: string, headings: string[]) {
  const lines = linesOf(text)
  const aliases = headings.map(h => h.toLowerCase())
  const index = lines.findIndex(line => aliases.some(alias => line.toLowerCase().replace(/[:\-]+$/, '').trim() === alias))
  if (index < 0) return []
  const values: string[] = []
  for (let i = index + 1; i < lines.length && values.length < 50; i++) {
    if (isHeading(lines[i])) break
    const value = lines[i].replace(/^[\-–—•●➢▪◦*]\s*/, '').trim()
    if (value.length > 3 && value.length < 600) values.push(value)
  }
  return values
}

function extractCertifications(text: string) { return extractSectionFlexible(text, ['certifications','certificates','professional certifications']) }
function extractProjects(text: string) { return extractSectionFlexible(text, ['projects','key projects','project experience','project history']) }
function extractEducation(text: string) { return extractSectionFlexible(text, ['education','academic background','qualifications','academic qualifications']) }
function extractAchievements(text: string) { return extractSectionFlexible(text, ['achievements','awards','accomplishments','recognition']) }

function extractResponsibilities(text: string, type: 'technical' | 'management') {
  const headings = type === 'technical'
    ? ['technical responsibilities','technical skills and responsibilities','key responsibilities','responsibilities']
    : ['management responsibilities','leadership responsibilities','management and leadership','leadership']
  return extractSectionFlexible(text, headings)
}

function extractMoney(text: string, labels: string[]) {
  const label = labels.map(v => v.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')
  const match = text.match(new RegExp(`(?:${label})\\s*[:\\-]?\\s*(?:INR|Rs\\.?|₹)?\\s*([0-9]+(?:\\.[0-9]+)?)\\s*(lpa|lakhs?|lakh|crore|cr)?`, 'i'))
  if (!match) return undefined
  const value = Number(match[1]); if (!Number.isFinite(value)) return undefined
  const unit = (match[2] || '').toLowerCase()
  if (unit === 'lpa' || unit === 'lakh' || unit === 'lakhs') return value * 100000
  if (unit === 'cr' || unit === 'crore') return value * 10000000
  return value
}

function inferIndustry(text: string, skills: string[]) {
  const lower = text.toLowerCase()
  const rules: Array<[string, string[]]> = [
    ['Information Technology',['software','technology','it services','saas','cloud','developer','engineering','sap','database']],
    ['Banking & Financial Services',['banking','finance','fintech','financial services','insurance']],
    ['Healthcare',['healthcare','hospital','pharma','medical','life sciences']],
    ['Manufacturing',['manufacturing','automotive','production','plant','industrial']],
    ['Retail & E-commerce',['retail','e-commerce','ecommerce','consumer']],
    ['Telecommunications',['telecom','telecommunications','networking']],
    ['Energy & Utilities',['energy','utilities','oil and gas','power']],
    ['Education',['education','university','school','academic']]
  ]
  for (const [industry, words] of rules) if (words.some(w => lower.includes(w))) return industry
  return skills.length ? 'Information Technology' : undefined
}

function makeSummary(name: string | undefined, years: number | undefined, relevantYears: number | undefined, skills: string[], company: string | undefined, location: string | undefined) {
  const who = name || 'Candidate'
  const exp = years != null ? `${years} years of total experience` : 'professional experience'
  const relevant = relevantYears != null ? `, including ${relevantYears} years of relevant experience` : ''
  const skillText = skills.slice(0, 10).join(', ') || 'relevant skills'
  const companyText = company ? ` currently associated with ${company}` : ''
  const locationText = location ? ` based in ${location}` : ''
  return `${who} has ${exp}${relevant}${companyText}${locationText}. Core capabilities explicitly listed in the resume include ${skillText}. This is factual resume extraction and must be validated by a recruiter.`
}

export async function extractResumeText(buffer: Buffer, mimeType: string) {
  if (mimeType === 'application/pdf') {
    const parser = new PDFParse({ data: buffer })
    try {
      const parsed = await parser.getText()
      return cleanText(parsed.text || '')
    } finally {
      await parser.destroy()
    }
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
  const currentCompany = current.company
  const previousCompanies = extractCompanies(normalized).filter(company => company.toLowerCase() !== currentCompany?.toLowerCase()).slice(0, 10)
  const industry = extractLabeled(normalized, ['industry','domain','sector']) || inferIndustry(normalized, skills)
  const employmentType = extractLabeled(normalized, ['employment type','job type','employment'])
  const workAuthorization = extractLabeled(normalized, ['work authorization','work permit','visa status','authorization'])
  const technology = skills.slice(0, 20).join(', ')
  const primarySkill = skills[0]
  const certifications = extractCertifications(normalized)
  const projects = extractProjects(normalized)
  const education = extractEducation(normalized)
  const achievements = extractAchievements(normalized)
  const technicalResponsibilities = extractResponsibilities(normalized, 'technical')
  const managementResponsibilities = extractResponsibilities(normalized, 'management')
  const currentCompensation = extractMoney(normalized, ['current ctc','current compensation','current salary','present ctc','present salary'])
  const expectedCompensation = extractMoney(normalized, ['expected ctc','expected compensation','expected salary','desired salary'])

  return {
    text: normalized, fullName, email, phone, location, currentCompany, currentRole: current.role,
    experienceYears: experience.total, relevantExperienceYears: experience.relevant, noticePeriodDays,
    technology: technology || undefined, primarySkill, secondarySkills: skills.slice(1), industry,
    previousCompanies, certifications, projects, linkedinUrl, currentCompensation, expectedCompensation,
    employmentType, workAuthorization, education, technicalResponsibilities, managementResponsibilities,
    achievements, aiSummary: makeSummary(fullName, experience.total, experience.relevant, skills, currentCompany, location)
  }
}
