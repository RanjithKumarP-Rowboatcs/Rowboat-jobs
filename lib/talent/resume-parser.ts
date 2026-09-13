import pdfParse from 'pdf-parse'
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
  'SAP CPI','SAP BTP','SAP Basis','SAP Datasphere','SAP S/4HANA','SAP ECC','SAP HANA','SAP Integration Suite',
  'Python','Java','JavaScript','TypeScript','React','Next.js','Node.js','SQL','PostgreSQL','MySQL','Data Engineering','Apache Spark','PySpark','AWS','Azure','GCP','Docker','Kubernetes','Terraform','Power BI','Tableau','Snowflake','Databricks','Airflow','ETL','API','REST','GraphQL','Machine Learning','Artificial Intelligence','Generative AI','LLM','MLOps','DevOps','Figma','Salesforce','ServiceNow','C','C++','C#','.NET','Angular','Vue.js','Spring Boot','Django','Flask','Oracle','MongoDB','Redis','AIX','SUSE Linux','Red Hat Linux','Redhat Linux','Windows','Linux','Unix','Stonebranch','Centrify','Vault','Zabbix','Splunk','CHARM','Active Control','Cosmos','Freshservice','Confluence','Jira','SAP SPAD','STMS','Cloud Connector','Kernel Upgrade','SPS Upgrade','SPAM/SAINT','SUM','RFC','Java NWA','SLD','DB13','CUPS','SAP Router'
]

const BAD_NAME_WORDS = /resume|curriculum|vitae|profile|summary|objective|contact|email|phone|linkedin|github|skills|experience|education|professional|technical|responsibilities|operations|management|consultant|engineer|developer|analyst|manager|architect|basis|hana|oracle|information technology/i

function cleanText(text: string) { return text.replace(/\u0000/g, ' ').replace(/\r/g, '\n').replace(/[ \t]+/g, ' ').replace(/\n{3,}/g, '\n\n').trim() }
function linesOf(text: string) { return text.split(/\n+/).map(line => line.trim().replace(/^[•●➢▪◦*-]\s*/, '')).filter(Boolean) }
function firstMatch(text: string, patterns: RegExp[]) { for (const pattern of patterns) { const match = text.match(pattern); if (match?.[1]) return match[1].trim().replace(/[|•]+/g, ' ').trim() } return undefined }
function extractEmail(text: string) { return text.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i)?.[0]?.toLowerCase() }
function extractPhone(text: string) { const matches = text.match(/(?:\+?\d[\d\s().-]{8,}\d)/g) || []; return matches.map(v => v.trim()).find(v => { const digits = v.replace(/\D/g, ''); return digits.length >= 10 && digits.length <= 15 }) }
function extractLinkedIn(text: string) { const match = text.match(/(?:https?:\/\/)?(?:www\.)?linkedin\.com\/(?:in|pub)\/[A-Za-z0-9._%/-]+/i); return match?.[0] ? (match[0].startsWith('http') ? match[0] : `https://${match[0]}`).replace(/[),.;]+$/, '') : undefined }

function looksLikeName(line: string) {
  const value = line.replace(/^[•●➢▪◦*-]\s*/, '').trim().replace(/[|,:;]+$/, '')
  const words = value.split(/\s+/).filter(Boolean)
  if (words.length < 2 || words.length > 5 || value.length > 70) return false
  if (BAD_NAME_WORDS.test(value) || /[@+\d]|https?:\/\//.test(value)) return false
  return words.every(word => /^[A-Za-z][A-Za-z.'-]*$/.test(word))
}

function extractName(text: string) {
  const lines = linesOf(text).slice(0, 12)
  for (const line of lines) {
    if (looksLikeName(line)) return line.replace(/[|,:;]+$/, '').trim()
    const header = line.match(/^([A-Z][a-z]+(?:\s+[A-Z][a-z.'-]+){1,3})\s+(?=(?:SAP|S\/4HANA|HANA|Software|Senior|Lead|Principal|Consultant|Engineer|Developer|Architect|Analyst|Manager|Data|IT)\b)/i)
    if (header && !BAD_NAME_WORDS.test(header[1])) return header[1].trim()
  }
  return undefined
}

function extractSkills(text: string) { const lower = text.toLowerCase(); return SKILLS.filter(skill => lower.includes(skill.toLowerCase())) }
function extractCompanies(text: string) {
  const lines = linesOf(text); const companies: string[] = []; const start = lines.findIndex(line => /^professional experience$/i.test(line)); const experienceLines = start >= 0 ? lines.slice(start + 1, start + 20) : lines
  for (const line of experienceLines) { const match = line.match(/^(.+?)\s*\((?:[A-Za-z]{3,9}\s+)?\d{4}\s*[–-]\s*(?:[A-Za-z]{3,9}\s+)?(?:\d{4}|current)\)/i); if (match?.[1]) companies.push(match[1].trim()) }
  return [...new Set(companies)].filter(v => v.length > 2).slice(0, 10)
}
function extractExperience(text: string) {
  const total = firstMatch(text, [/(?:total\s+)?(?:IT\s+)?experience\s*[:\-]?\s*(\d+(?:\.\d+)?)\s*\+?\s*years?/i, /(\d+(?:\.\d+)?)\s*\+?\s*years?\s+(?:of\s+)?(?:total\s+)?(?:IT\s+)?experience/i, /(\d+(?:\.\d+)?)\s*years?\b[\s\S]{0,50}\bexperience\b/i])
  const relevant = firstMatch(text, [/(\d+(?:\.\d+)?)\s*years?\s+of\s+relevant\s+experience/i, /(\d+(?:\.\d+)?)\s*years?\s+relevant\s+experience/i])
  if (total) return { total: Number(total), relevant: relevant ? Number(relevant) : undefined }
  const ranges = [...text.matchAll(/\b(20\d{2})\s*[–-]\s*(20\d{2}|current)\b/gi)]; if (!ranges.length) return { total: undefined, relevant: relevant ? Number(relevant) : undefined }
  const earliest = Math.min(...ranges.map(r => Number(r[1]))); return { total: Math.max(0, new Date().getFullYear() - earliest), relevant: relevant ? Number(relevant) : undefined }
}
function extractNotice(text: string) { const lower = text.toLowerCase(); if (/\b(immediate joiner|immediate joining|can join immediately|available immediately|immediate)\b/.test(lower)) return 0; const value = firstMatch(text, [/(?:notice\s+period|notice)\s*[:\-]?\s*(\d+)\s*days?/i, /(\d+)\s*days?\s*(?:notice|notice\s+period)/i]); return value ? Number(value) : undefined }
function extractLocation(text: string) {
  const labelled = firstMatch(text, [/(?:current\s+location|location|based\s+in|residing\s+in)\s*[:\-]\s*([^\n]{2,100})/i]); if (labelled) return labelled.replace(/\b(?:linkedin|email|phone)\b.*$/i, '').trim()
  const header = linesOf(text).slice(0, 5).find(line => /\b(?:Pune|Mumbai|Delhi|Bengaluru|Bangalore|Hyderabad|Chennai|Kolkata|Ahmedabad|Noida|Gurugram|Gurgaon|Nashik|Nagpur)\b/i.test(line) && !line.includes('@')); return header?.match(/\b(Pune|Mumbai|Delhi|Bengaluru|Bangalore|Hyderabad|Chennai|Kolkata|Ahmedabad|Noida|Gurugram|Gurgaon|Nashik|Nagpur)\b/i)?.[1]
}
function extractCurrentEmployment(text: string) {
  const lines = linesOf(text); const start = lines.findIndex(line => /^professional experience$/i.test(line)); if (start < 0) return { company: undefined, role: undefined }
  const entry = lines.slice(start + 1, start + 8).find(line => /\(.*20\d{2}.*(?:current|20\d{2}).*\)/i.test(line)); if (!entry) return { company: undefined, role: undefined }
  const company = entry.split(/\s*\([^)]*\)/)[0].trim(); const role = entry.match(/\)\s*[-–]\s*(.+)$/)?.[1]?.trim(); return { company, role }
}
function extractSection(text: string, headings: string[], maxChars: number) {
  const heading = headings.join('|'); const match = text.match(new RegExp(`(?:^|\\n)\\s*(?:${heading})\\s*[:\\-]?\\s*([\\s\\S]{0,${maxChars}})`, 'imi')); if (!match?.[1]) return []
  return match[1].split(/\n|•|●|➢|▪/).map(x => x.trim().replace(/^[*\-]+\s*/, '')).filter(x => x.length > 3 && x.length < 300 && !/^(skills|education|achievements?|professional experience|technical responsibilities|management responsibilities)$/i.test(x)).slice(0, 40)
}
function extractCertifications(text: string) { return extractSection(text, ['certifications?', 'certificates?'], 1800) }
function extractProjects(text: string) { return extractSection(text, ['projects?', 'key projects?', 'project experience'], 2600) }
function extractEducation(text: string) { const values = extractSection(text, ['education', 'academic background', 'qualifications?'], 1800); if (values.length) return values; const lines = linesOf(text); const index = lines.findIndex(line => /^education$/i.test(line)); return index >= 0 ? lines.slice(index + 1, index + 5) : [] }
function extractAchievements(text: string) { return extractSection(text, ['achievements', 'awards', 'accomplishments'], 2200) }
function extractResponsibilities(text: string, heading: 'technical' | 'management') {
  const title = heading === 'technical' ? 'Technical Responsibilities' : 'Management Responsibilities'; const other = heading === 'technical' ? 'Management Responsibilities' : 'Skills|Achievements|Education'; const re = new RegExp(`(?:^|\\n)\\s*${title}\\s*[:\\-]?\\s*([\\s\\S]*?)(?=\\n\\s*(?:${other})\\s*[:\\-]?\\s*(?:\\n|$)|$)`, 'i'); const section = re.exec(text)?.[1] || ''
  return section.split(/\n|●|•/).map(x => x.trim().replace(/^[*\-]+\s*/, '')).filter(x => x.length > 8 && x.length < 500).slice(0, 40)
}
function extractMoney(text: string, labels: string[]) { const label = labels.join('|'); const match = text.match(new RegExp(`(?:${label})\\s*[:\\-]?\\s*(?:INR|Rs\\.?|₹)?\\s*([0-9]+(?:\\.[0-9]+)?)\\s*(lpa|lakhs?|lakh|crore|cr)?`, 'i')); if (!match) return undefined; const value = Number(match[1]); if (!Number.isFinite(value)) return undefined; const unit = (match[2] || '').toLowerCase(); if (unit === 'lpa' || unit === 'lakh' || unit === 'lakhs') return value * 100000; if (unit === 'cr' || unit === 'crore') return value * 10000000; return value }
function inferIndustry(text: string, skills: string[]) { const lower = text.toLowerCase(); const rules: Array<[string, string[]]> = [['Information Technology',['software','technology','it services','saas','cloud','developer','engineering','sap','database']],['Banking & Financial Services',['banking','finance','fintech','financial services','insurance']],['Healthcare',['healthcare','hospital','pharma','medical','life sciences']],['Manufacturing',['manufacturing','automotive','production','plant','industrial']],['Retail & E-commerce',['retail','e-commerce','ecommerce','consumer']],['Telecommunications',['telecom','telecommunications','networking']]]; for (const [industry, words] of rules) if (words.some(w => lower.includes(w))) return industry; return skills.length ? 'Information Technology' : undefined }
function makeSummary(name: string | undefined, years: number | undefined, relevantYears: number | undefined, skills: string[], company: string | undefined, location: string | undefined) { const who = name || 'Candidate'; const exp = years != null ? `${years} years of total IT experience` : 'professional experience'; const relevant = relevantYears != null ? `, including ${relevantYears} years of relevant experience` : ''; const skillText = skills.slice(0, 10).join(', ') || 'relevant skills'; const companyText = company ? ` currently associated with ${company}` : ''; const locationText = location ? ` based in ${location}` : ''; return `${who} has ${exp}${relevant}${companyText}${locationText}. Core capabilities explicitly listed in the resume include ${skillText}. This is factual resume extraction and must be validated by a recruiter.` }

export async function extractResumeText(buffer: Buffer, mimeType: string) {
  if (mimeType === 'application/pdf') { const parsed = await pdfParse(buffer); return cleanText(parsed.text || '') }
  if (mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') { const parsed = await mammoth.extractRawText({ buffer }); return cleanText(parsed.value || '') }
  if (mimeType === 'application/msword') { const extractor = new WordExtractor(); const document = await extractor.extract(buffer); return cleanText(document.getBody() || '') }
  throw new Error('Unsupported resume format. Please upload PDF, DOCX or DOC.')
}

export function analyzeResume(text: string): ParsedResume {
  const skills = extractSkills(text); const email = extractEmail(text); const phone = extractPhone(text); const linkedinUrl = extractLinkedIn(text); const fullName = extractName(text); const experience = extractExperience(text); const noticePeriodDays = extractNotice(text); const location = extractLocation(text); const current = extractCurrentEmployment(text); const currentCompany = current.company
  const previousCompanies = extractCompanies(text).filter(company => company.toLowerCase() !== currentCompany?.toLowerCase()).slice(0, 10)
  const industry = firstMatch(text, [/(?:industry|domain)\s*[:\-]?\s*([^\n]{2,80})/i]) || inferIndustry(text, skills); const employmentType = firstMatch(text, [/(?:employment type|job type|employment)\s*[:\-]?\s*([^\n]{2,60})/i]); const workAuthorization = firstMatch(text, [/(?:work authorization|work permit|visa status|authorization)\s*[:\-]?\s*([^\n]{2,100})/i])
  const technology = skills.slice(0, 15).join(', '); const primarySkill = skills[0]; const certifications = extractCertifications(text); const projects = extractProjects(text); const education = extractEducation(text); const achievements = extractAchievements(text); const technicalResponsibilities = extractResponsibilities(text, 'technical'); const managementResponsibilities = extractResponsibilities(text, 'management')
  const currentCompensation = extractMoney(text, ['current ctc','current compensation','current salary','present ctc','present salary']); const expectedCompensation = extractMoney(text, ['expected ctc','expected compensation','expected salary','desired salary'])
  return { text, fullName, email, phone, location, currentCompany, currentRole: current.role, experienceYears: experience.total, relevantExperienceYears: experience.relevant, noticePeriodDays, technology: technology || undefined, primarySkill, secondarySkills: skills.slice(1), industry, previousCompanies, certifications, projects, linkedinUrl, currentCompensation, expectedCompensation, employmentType, workAuthorization, education, technicalResponsibilities, managementResponsibilities, achievements, aiSummary: makeSummary(fullName, experience.total, experience.relevant, skills, currentCompany, location) }
}
