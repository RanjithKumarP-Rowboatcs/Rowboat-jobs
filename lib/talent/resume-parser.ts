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
  experienceYears?: number
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
  aiSummary: string
}

const SKILLS = [
  'SAP CPI','SAP BTP','SAP Basis','SAP Datasphere','SAP S/4HANA','SAP ECC','SAP Integration Suite','Python','Java','JavaScript','TypeScript','React','Next.js','Node.js','SQL','PostgreSQL','MySQL','Data Engineering','Apache Spark','PySpark','AWS','Azure','GCP','Docker','Kubernetes','Terraform','Power BI','Tableau','Snowflake','Databricks','Airflow','ETL','API','REST','GraphQL','Machine Learning','Artificial Intelligence','Generative AI','LLM','MLOps','DevOps','Figma','Salesforce','ServiceNow','C','C++','C#','.NET','Angular','Vue.js','Spring Boot','Django','Flask','Oracle','MongoDB','Redis',
]

function cleanText(text: string) { return text.replace(/\u0000/g, ' ').replace(/[ \t]+/g, ' ').replace(/\n{3,}/g, '\n\n').trim() }
function firstMatch(text: string, patterns: RegExp[]) { for (const pattern of patterns) { const match = text.match(pattern); if (match?.[1]) return match[1].trim().replace(/[|•]+/g, ' ').trim() } return undefined }
function extractEmail(text: string) { return text.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i)?.[0]?.toLowerCase() }
function extractPhone(text: string) { const matches = text.match(/(?:\+?\d[\d\s().-]{8,}\d)/g) || []; return matches.map(v => v.trim()).find(v => v.replace(/\D/g, '').length >= 10 && v.replace(/\D/g, '').length <= 15) }
function extractLinkedIn(text: string) { const match = text.match(/(?:https?:\/\/)?(?:www\.)?linkedin\.com\/(?:in|pub)\/[A-Za-z0-9._%/-]+/i); return match?.[0] ? (match[0].startsWith('http') ? match[0] : `https://${match[0]}`).replace(/[),.;]+$/, '') : undefined }
function extractName(text: string) { const lines = text.split(/\n+/).map(x => x.trim()).filter(Boolean).slice(0, 15); const bad = /resume|curriculum|vitae|profile|summary|objective|contact|email|phone|linkedin|github|skills|experience/i; return lines.find(line => /^[A-Za-z][A-Za-z .'-]{3,60}$/.test(line) && !bad.test(line)) }
function extractSkills(text: string) { const lower = text.toLowerCase(); return SKILLS.filter(skill => lower.includes(skill.toLowerCase())) }
function extractCompanies(text: string) { const values = [...text.matchAll(/(?:worked at|working at|employed at|company|employer)\s*[:\-]?\s*([A-Z][A-Za-z0-9&.,' -]{2,60})/gi)].map(m => m[1].trim()).filter(Boolean); return [...new Set(values)].slice(0, 10) }
function extractCertifications(text: string) { const section = firstMatch(text, [/(?:certifications?|certificates?)\s*[:\-]?\s*([\s\S]{0,1600})/i]) || ''; return section.split(/\n|•|,|;/).map(x => x.trim()).filter(x => x.length > 3 && x.length < 120).slice(0, 15) }
function extractProjects(text: string) { const section = firstMatch(text, [/(?:projects?|key projects?|project experience)\s*[:\-]?\s*([\s\S]{0,2200})/i]) || ''; return section.split(/\n|•/).map(x => x.trim()).filter(x => x.length > 10 && x.length < 240).slice(0, 15) }
function extractEducation(text: string) { const section = firstMatch(text, [/(?:education|academic background|qualifications?)\s*[:\-]?\s*([\s\S]{0,1600})/i]) || ''; return section.split(/\n|•/).map(x => x.trim()).filter(x => x.length > 4 && x.length < 180).slice(0, 12) }
function extractMoney(text: string, labels: string[]) { const label = labels.join('|'); const match = text.match(new RegExp(`(?:${label})\\s*[:\\-]?\\s*(?:INR|Rs\\.?|₹)?\\s*([0-9]+(?:\\.[0-9]+)?)\\s*(lpa|lakhs?|lakh|crore|cr)?`, 'i')); if (!match) return undefined; const value = Number(match[1]); if (!Number.isFinite(value)) return undefined; const unit = (match[2] || '').toLowerCase(); if (unit === 'lpa' || unit === 'lakh' || unit === 'lakhs') return value * 100000; if (unit === 'cr' || unit === 'crore') return value * 10000000; return value }
function inferIndustry(text: string, skills: string[]) { const lower = text.toLowerCase(); const rules: Array<[string, string[]]> = [['Information Technology',['software','technology','it services','saas','cloud','developer','engineering']],['Banking & Financial Services',['banking','finance','fintech','financial services','insurance']],['Healthcare',['healthcare','hospital','pharma','medical','life sciences']],['Manufacturing',['manufacturing','automotive','production','plant','industrial']],['Retail & E-commerce',['retail','e-commerce','ecommerce','consumer']],['Telecommunications',['telecom','telecommunications','networking']]]; for (const [industry, words] of rules) if (words.some(w => lower.includes(w))) return industry; if (skills.length) return 'Information Technology'; return undefined }
function makeSummary(name: string | undefined, years: number | undefined, skills: string[], company: string | undefined, location: string | undefined, certifications: string[]) { const who = name || 'Candidate'; const exp = years != null ? `${years} years of experience` : 'professional experience'; const skillText = skills.slice(0, 8).join(', ') || 'relevant skills'; const companyText = company ? ` currently associated with ${company}` : ''; const locationText = location ? ` based in ${location}` : ''; const certText = certifications.length ? ` Certifications listed include ${certifications.slice(0, 3).join(', ')}.` : ''; return `${who} has ${exp}${companyText}${locationText}. The submitted resume lists ${skillText}.${certText} This is a factual resume extraction and must be validated by a recruiter.` }

export async function extractResumeText(buffer: Buffer, mimeType: string) {
  if (mimeType === 'application/pdf') { const parsed = await pdfParse(buffer); return cleanText(parsed.text || '') }
  if (mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') { const parsed = await mammoth.extractRawText({ buffer }); return cleanText(parsed.value || '') }
  if (mimeType === 'application/msword') { const extractor = new WordExtractor(); const document = await extractor.extract(buffer); return cleanText(document.getBody() || '') }
  throw new Error('Unsupported resume format. Please upload PDF, DOCX or DOC.')
}

export function analyzeResume(text: string): ParsedResume {
  const skills = extractSkills(text)
  const experienceRaw = firstMatch(text, [/(?:total\s+)?(?:years?|yrs?)\s+(?:of\s+)?experience\s*[:\-]?\s*(\d+(?:\.\d+)?)/i, /(\d+(?:\.\d+)?)\+?\s+years?\s+(?:of\s+)?experience/i])
  const noticeRaw = firstMatch(text, [/(?:notice\s+period|notice)\s*[:\-]?\s*(\d+)\s*days?/i, /(\d+)\s*days?\s*(?:notice|notice\s+period)/i])
  const location = firstMatch(text, [/(?:location|based in|current location)\s*[:\-]?\s*([^\n]{2,100})/i])
  const company = firstMatch(text, [/(?:current company|current employer|present company)\s*[:\-]?\s*([^\n]{2,120})/i])
  const industry = firstMatch(text, [/(?:industry|domain)\s*[:\-]?\s*([^\n]{2,80})/i]) || inferIndustry(text, skills)
  const employmentType = firstMatch(text, [/(?:employment type|job type|employment)\s*[:\-]?\s*([^\n]{2,60})/i])
  const workAuthorization = firstMatch(text, [/(?:work authorization|work permit|visa status|authorization)\s*[:\-]?\s*([^\n]{2,100})/i])
  const technology = skills.slice(0, 8).join(', ') || undefined
  const primarySkill = skills[0]
  const certifications = extractCertifications(text)
  const projects = extractProjects(text)
  const previousCompanies = extractCompanies(text)
  const education = extractEducation(text)
  const name = extractName(text)
  const experienceYears = experienceRaw ? Number(experienceRaw) : undefined
  const noticePeriodDays = noticeRaw ? Number(noticeRaw) : undefined
  const email = extractEmail(text)
  const phone = extractPhone(text)
  const linkedinUrl = extractLinkedIn(text)
  const currentCompensation = extractMoney(text, ['current ctc','current compensation','current salary','present ctc','present salary'])
  const expectedCompensation = extractMoney(text, ['expected ctc','expected compensation','expected salary','desired salary'])

  return { text, fullName: name, email, phone, location, currentCompany: company, experienceYears, noticePeriodDays, technology, primarySkill, secondarySkills: skills.slice(1), industry, previousCompanies, certifications, projects, linkedinUrl, currentCompensation, expectedCompensation, employmentType, workAuthorization, education, aiSummary: makeSummary(name, experienceYears, skills, company, location, certifications) }
}
