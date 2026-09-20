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
  preferredLocation?: string
  dateOfBirth?: string
  panNumber?: string
  pfActiveAllEmployments?: boolean
  highestEducationQualification?: string
  highestEducationYear?: number
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
  'Python','Java','JavaScript','TypeScript','React','Next.js','Node.js','SQL','PostgreSQL','MySQL','Oracle','MongoDB','Redis','Data Engineering','Data Science','Apache Spark','PySpark','AWS','Azure','GCP','Docker','Kubernetes','Terraform','Power BI','Tableau','Snowflake','Databricks','Airflow','ETL','API','REST','GraphQL','Machine Learning','Artificial Intelligence','Generative AI','LLM','MLOps','DevOps','Figma','Salesforce','ServiceNow','C','C++','C#','.NET','Angular','Vue.js','Spring Boot','Django','Flask','AIX','SUSE Linux','Red Hat Linux','Redhat Linux','Windows','Linux','Unix','Stonebranch','Centrify','Vault','Vaults','Zabbix','Splunk','CHARM','Active Control','Cosmos','Freshservice','Confluence','Jira','SAP SPAD','STMS','Cloud Connector','Kernel Upgrade','SPS Upgrade','SPAM/SAINT','SUM','RFC','Java NWA','SLD','DB13','CUPS','SAP Router','HANA','Basis'
]
const SECTION_NAMES = ['professional experience','work experience','employment history','career history','experience','employment','work history','education','academic background','qualifications','academic qualifications','skills','technical skills','core skills','competencies','certifications','certificates','projects','project experience','project history','achievements','awards','accomplishments','recognition','responsibilities','technical responsibilities','management responsibilities','leadership','leadership responsibilities','summary','professional summary','objective']
const NAME_STOP = /^(resume|curriculum vitae|cv|profile|summary|objective|contact|skills|experience|education|professional experience|technical skills|work experience|employment history|career|references|projects?|certifications?|achievements?|awards?)$/i
function cleanText(text: string) { return text.replace(/\u0000/g, ' ').replace(/\r/g, '\n').replace(/[\u2000-\u200B\u202F]/g, ' ').replace(/[ \t]+/g, ' ').replace(/\n[ \t]+/g, '\n').replace(/\n{3,}/g, '\n\n').trim() }
function linesOf(text: string) { return text.split(/\n+/).map(line => line.trim().replace(/^[•●➢▪◦*\-]\s*/, '').trim()).filter(Boolean) }
function unique(values: string[]) { return [...new Set(values.map(v => v.trim()).filter(Boolean))] }
function firstMatch(text: string, patterns: RegExp[]) { for (const pattern of patterns) { const m = text.match(pattern); if (m?.[1]) return m[1].trim().replace(/[|•]+/g, ' ').trim() } return undefined }
function extractEmail(text: string) { return text.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i)?.[0]?.toLowerCase() }
function extractPhone(text: string) { const matches = text.match(/(?:\+?\d[\d\s().-]{8,}\d)/g) || []; return matches.map(v => v.trim()).find(v => { const digits = v.replace(/\D/g, ''); return digits.length >= 10 && digits.length <= 15 }) }
function extractLinkedIn(text: string) { const m = text.match(/(?:https?:\/\/)?(?:www\.)?linkedin\.com\/(?:in|pub)\/[A-Za-z0-9._%/-]+/i); return m?.[0] ? (m[0].startsWith('http') ? m[0] : `https://${m[0]}`).replace(/[),.;]+$/, '') : undefined }
function isHeading(line: string) { const value = line.toLowerCase().replace(/^[-•●➢▪◦*\s]+/, '').replace(/\s*\([^)]*\)\s*$/, '').replace(/[:\-]+$/, '').trim(); return SECTION_NAMES.some(name => value === name || value.startsWith(`${name} `)) }
function looksLikeName(value: string) { const line = value.replace(/^[•●➢▪◦*\-\s]+/, '').trim(); const words = line.split(/\s+/).filter(Boolean); if (words.length < 2 || words.length > 5 || line.length > 70 || NAME_STOP.test(line)) return false; if (/@|https?:\/\/|\d|linkedin|phone|email/i.test(line)) return false; return words.every(word => /^[A-Za-z][A-Za-z.'-]*$/.test(word)) }
function extractName(text: string) {
  const labeled = extractLabeled(text, ['candidate name','full name','name']);
  if (labeled && looksLikeName(labeled)) return labeled;
  const lines = linesOf(text).slice(0, 30);
  const roleWords = /\b(senior|junior|lead|principal|consultant|engineer|developer|architect|analyst|manager|specialist|professional|software|technology|integration|solution|administrator|basis|cpi|datasphere|hana|full\s*stack|cloud|data|sap)\b/i;
  const candidates = lines
    .filter(line => looksLikeName(line))
    .filter(line => !roleWords.test(line))
    .filter(line => !/^\d/.test(line));
  if (candidates.length) return candidates.sort((a,b) => {
    const ai = lines.indexOf(a);
    const bi = lines.indexOf(b);
    const score = (line:string) => {
      const words = line.split(/\s+/).length;
      return (words === 2 ? 20 : words === 3 ? 10 : 0) - lines.indexOf(line);
    };
    return score(b) - score(a) || ai - bi;
  })[0];
  return undefined;
}
function extractSkills(text: string) { const lower = text.toLowerCase(); return unique(SKILLS.filter(skill => lower.includes(skill.toLowerCase()))) }
function extractLabeled(text: string, labels: string[]) { const label = labels.map(v => v.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|'); return firstMatch(text, [new RegExp(`(?:^|\\n)\\s*(?:${label})\\s*[:\\-]\\s*([^\\n]{2,180})`, 'im')]) }
function extractPreferredLocation(text: string) { return extractLabeled(text, ['preferred location','preferred locations','preferred work location','desired location','preferred city']) }
function extractDateOfBirth(text: string) { const m=text.match(/(?:date of birth|dob|birth date)\s*[:\-]?\s*(\d{1,2})[\/-](\d{1,2})[\/-]((?:19|20)\d{2})/i); if(m)return `${m[3]}-${m[2].padStart(2,'0')}-${m[1].padStart(2,'0')}`; const n=text.match(/(?:date of birth|dob|birth date)\s*[:\-]?\s*([A-Za-z]{3,9})\s+(\d{1,2}),?\s+((?:19|20)\d{2})/i); if(n){const month=new Date(`${n[1]} 1, 2000`).getMonth()+1; if(month>=1&&month<=12)return `${n[3]}-${String(month).padStart(2,'0')}-${n[2].padStart(2,'0')}`} return undefined }
function extractPan(text: string) { const m=text.match(/(?:PAN|PAN No\.?|Permanent Account Number)\s*[:\-]?\s*([A-Z]{5}\d{4}[A-Z])/i); return m?.[1]?.toUpperCase() }
function extractPfStatus(text: string) { if(/\b(PF|EPF|provident fund)\b[\s\S]{0,80}\b(active|yes|available|all employment|all employers)\b/i.test(text)||/\b(active|yes)\b[\s\S]{0,80}\b(PF|EPF|provident fund)\b/i.test(text)) return true; if(/\b(PF|EPF|provident fund)\b[\s\S]{0,80}\b(no|not active|inactive|not available)\b/i.test(text)) return false; return undefined }
function extractEducationYear(text: string) { const values=extractEducation(text); const years=values.flatMap(v=>[...v.matchAll(/\b(?:19|20)\d{2}\b/g)].map(m=>Number(m[0]))); return years.length?Math.max(...years):undefined }
function extractHighestEducation(text: string) { const values=extractEducation(text); if(!values.length)return undefined; const ranked=['phd','doctorate','post doctoral','m.tech','m.e','master','mba','mca','m.sc','b.tech','b.e','bachelor','bca','b.sc','diploma']; const sorted=[...values].sort((a,b)=>{const ra=ranked.findIndex(x=>a.toLowerCase().includes(x));const rb=ranked.findIndex(x=>b.toLowerCase().includes(x));return (ra<0?999:ra)-(rb<0?999:rb)}); return sorted[0] }
function extractLocation(text: string) {
  const labelled = extractLabeled(text, ['current location','location','based in','residing in','current city','city']);
  if (labelled) {
    const cleaned = labelled
      .split(/\s*(?:\||;|\bcontact\b|\bphone\b|\bemail\b|\blinkedin\b|\bgithub\b)\s*/i)[0]
      .replace(/[,:\-]+$/, '')
      .trim();
    if (cleaned.length >= 2 && cleaned.length <= 100) return cleaned;
  }
  const lines = linesOf(text).slice(0, 20);
  for (const line of lines) {
    const cityMatch = line.match(/\b(Hyderabad|Pune|Mumbai|Bengaluru|Bangalore|Chennai|Delhi|Gurgaon|Gurugram|Noida|Kolkata|Ahmedabad|Jaipur|Kochi|Coimbatore|Mysore|Nashik|Nagpur|Indore|Visakhapatnam|Vijayawada)\b(?:\s*,\s*([A-Za-z .-]+))?/i);
    if (cityMatch) return cityMatch[2] ? cityMatch[0].trim() : cityMatch[1];
  }
  return undefined;
}
function extractExperience(text: string) { const total = firstMatch(text,[/(?:total|overall|professional|IT)\s*(?:IT\s*)?(?:professional\s*)?(?:experience)?\s*[:\-]?\s*(\d+(?:\.\d+)?)\s*\+?\s*years?/i,/(\d+(?:\.\d+)?)\s*\+?\s*years?\s+(?:of\s+)?(?:total\s+|overall\s+|professional\s+|IT\s+)?experience/i,/(?:experience|exp)\s*[:\-]?\s*(\d+(?:\.\d+)?)\s*\+?\s*years?/i]); const relevant = firstMatch(text,[/(\d+(?:\.\d+)?)\s*\+?\s*years?\s+(?:of\s+)?relevant\s+experience/i,/relevant\s+experience\s*[:\-]?\s*(\d+(?:\.\d+)?)\s*\+?\s*years?/i]); if (total) return { total:Number(total), relevant:relevant?Number(relevant):undefined }; const ranges=[...text.matchAll(/\b(19\d{2}|20\d{2})\s*(?:[/.]\s*\d{1,2})?\s*(?:-|–|—|to)\s*(?:(19\d{2}|20\d{2})\s*(?:[/.]\s*\d{1,2})?|present|current|till\s+date)\b/gi)]; if(!ranges.length) return {total:undefined,relevant:relevant?Number(relevant):undefined}; const earliest=Math.min(...ranges.map(r=>Number(r[1]))); return {total:Math.max(0,Math.round((new Date().getFullYear()-earliest)*10)/10),relevant:relevant?Number(relevant):undefined} }
function extractNotice(text: string) { if (/\b(immediate joiner|immediate joining|can join immediately|available immediately|join immediately)\b/i.test(text)) return 0; const m=text.match(/(?:notice\s+period|notice)\s*[:\-]?\s*(\d+)\s*(days?|weeks?|months?)/i); if(!m) return undefined; const n=Number(m[1]); const unit=m[2].toLowerCase(); return unit.startsWith('month')?n*30:unit.startsWith('week')?n*7:n }
function extractCurrentEmployment(text: string) { const labelledCompany=extractLabeled(text,['current company','current employer','present company','employer']); const labelledRole=extractLabeled(text,['current role','current designation','designation','job title','title','role']); if(labelledCompany||labelledRole) return {company:labelledCompany,role:labelledRole}; const lines=linesOf(text); const start=lines.findIndex(line=>/^(professional |work |employment |career )?(experience|history)$/i.test(line)); const window=lines.slice(start>=0?start+1:0,start>=0?start+45:45); for(const line of window){const m=line.match(/^(.+?)\s*\(([^)]*(?:current|present|till date)[^)]*)\)\s*[-–—|:]\s*(.+)$/i); if(m) return {company:m[1].trim(),role:m[3].trim()}} return {company:undefined,role:undefined} }
function extractCompanies(text:string){const companies:string[]=[];for(const line of linesOf(text)){const m=line.match(/^(.+?)\s*\([^)]*(?:19\d{2}|20\d{2})[^)]*\)/);if(m?.[1]&&m[1].length>2&&!isHeading(m[1]))companies.push(m[1].trim())}return unique(companies).slice(0,10)}
function extractSectionFlexible(text:string,headings:string[]){const lines=linesOf(text);const aliases=headings.map(h=>h.toLowerCase());const normalizeHeading=(line:string)=>line.toLowerCase().replace(/^[-•●➢▪◦*\s]+/,'').replace(/\s*\([^)]*\)\s*$/,'').replace(/[:\-]+$/,'').trim();const start=lines.findIndex(line=>aliases.includes(normalizeHeading(line)));if(start<0)return[];const values:string[]=[];for(let i=start+1;i<lines.length&&values.length<60;i++){if(isHeading(lines[i]))break;const value=lines[i].replace(/^[\-–—•●➢▪◦*]\s*/,'').trim();if(value.length>=3&&value.length<=800)values.push(value)}return values}
function extractCertifications(text:string){return extractSectionFlexible(text,['certifications','certificates','professional certifications'])}
function extractProjects(text:string){return extractSectionFlexible(text,['projects','key projects','project experience','project history'])}
function extractEducation(text:string){return extractSectionFlexible(text,['education','academic background','qualifications','academic qualifications'])}
function extractAchievements(text:string){return extractSectionFlexible(text,['achievements','awards','accomplishments','recognition'])}
function extractResponsibilities(text:string,type:'technical'|'management'){return extractSectionFlexible(text,type==='technical'?['technical responsibilities','technical skills and responsibilities','key responsibilities','responsibilities']:['management responsibilities','leadership responsibilities','management and leadership','leadership'])}
function extractMoney(text:string,labels:string[]){const label=labels.map(v=>v.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')).join('|');const m=text.match(new RegExp(`(?:${label})\\s*[:\\-]?\\s*(?:INR|Rs\\.?|₹)?\\s*([0-9]+(?:\\.[0-9]+)?)\\s*(lpa|lakhs?|lakh|crore|cr)?`,'i'));if(!m)return undefined;const n=Number(m[1]);const unit=(m[2]||'').toLowerCase();return unit==='lpa'||unit==='lakh'||unit==='lakhs'?n*100000:unit==='cr'||unit==='crore'?n*10000000:n}
function inferIndustry(text:string,skills:string[]){const lower=text.toLowerCase();if(/banking|finance|fintech|financial services|insurance/.test(lower))return'Banking & Financial Services';if(/healthcare|hospital|pharma|medical|life sciences/.test(lower))return'Healthcare';if(/manufacturing|automotive|production|industrial/.test(lower))return'Manufacturing';if(/retail|e-commerce|ecommerce|consumer/.test(lower))return'Retail & E-commerce';if(/telecom|telecommunications/.test(lower))return'Telecommunications';if(/energy|utilities|oil and gas|power/.test(lower))return'Energy & Utilities';return skills.length||/software|technology|IT services|developer|engineering|SAP|database/i.test(text)?'Information Technology':undefined}
function makeSummary(name:string|undefined,years:number|undefined,relevant:number|undefined,skills:string[],company?:string,location?:string){return`${name||'Candidate'} has ${years!=null?`${years} years of total experience`:'professional experience'}${relevant!=null?`, including ${relevant} years of relevant experience`:''}${company?` and is currently associated with ${company}`:''}${location?`, based in ${location}`:''}. Core capabilities explicitly listed in the resume include ${(skills.slice(0,12).join(', ')||'relevant skills')}. Recruiter validation is required.`}
export async function extractResumeText(buffer:Buffer,mimeType:string){
  if(mimeType==='application/pdf'){const result=await pdfParse(buffer);return cleanText(result.text||'')}
  if(mimeType==='application/vnd.openxmlformats-officedocument.wordprocessingml.document'){const result=await mammoth.extractRawText({buffer});return cleanText(result.value||'')}
  if(mimeType==='application/msword'){const extractor=new WordExtractor();const document=await extractor.extract(buffer);return cleanText(document.getBody()||'')}
  throw new Error('Unsupported resume format. Please upload PDF, DOCX or DOC.')
}
export function analyzeResume(text:string):ParsedResume{const normalized=cleanText(text);const skills=extractSkills(normalized);const email=extractEmail(normalized);const phone=extractPhone(normalized);const linkedinUrl=extractLinkedIn(normalized);const fullName=extractName(normalized);const experience=extractExperience(normalized);const noticePeriodDays=extractNotice(normalized);const location=extractLocation(normalized);const preferredLocation=extractPreferredLocation(normalized);const dateOfBirth=extractDateOfBirth(normalized);const panNumber=extractPan(normalized);const pfActiveAllEmployments=extractPfStatus(normalized);const highestEducationQualification=extractHighestEducation(normalized);const highestEducationYear=extractEducationYear(normalized);const current=extractCurrentEmployment(normalized);const previousCompanies=extractCompanies(normalized).filter(c=>c.toLowerCase()!==current.company?.toLowerCase()).slice(0,10);const certifications=extractCertifications(normalized);const projects=extractProjects(normalized);const education=extractEducation(normalized);const achievements=extractAchievements(normalized);const technicalResponsibilities=extractResponsibilities(normalized,'technical');const managementResponsibilities=extractResponsibilities(normalized,'management');const industry=extractLabeled(normalized,['industry','domain','sector'])||inferIndustry(normalized,skills);const employmentType=extractLabeled(normalized,['employment type','job type']);const workAuthorization=extractLabeled(normalized,['work authorization','work permit','visa status','authorization']);const currentCompensation=extractMoney(normalized,['current ctc','current compensation','current salary','present ctc','present salary']);const expectedCompensation=extractMoney(normalized,['expected ctc','expected compensation','expected salary','desired salary']);const technology=skills.slice(0,20).join(', ');const primarySkill=skills[0];return{text:normalized,fullName,email,phone,location,currentCompany:current.company,currentRole:current.role,experienceYears:experience.total,relevantExperienceYears:experience.relevant,noticePeriodDays,technology:technology||undefined,primarySkill,secondarySkills:skills.slice(1),industry,previousCompanies,certifications,projects,linkedinUrl,currentCompensation,expectedCompensation,preferredLocation,dateOfBirth,panNumber,pfActiveAllEmployments,highestEducationQualification,highestEducationYear,employmentType,workAuthorization,education,technicalResponsibilities,managementResponsibilities,achievements,aiSummary:makeSummary(fullName,experience.total,experience.relevant,skills,current.company,location)}}
