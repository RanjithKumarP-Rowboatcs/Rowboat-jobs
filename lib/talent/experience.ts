import type { ParsedResume } from './resume-parser'

export type ExperienceResult = {
  total?: number
  relevant?: number
  source: 'explicit' | 'date_ranges' | 'unavailable'
}

const MONTHS: Record<string, number> = {
  jan:1,january:1,feb:2,february:2,mar:3,march:3,apr:4,april:4,may:5,
  jun:6,june:6,jul:7,july:7,aug:8,august:8,sep:9,sept:9,september:9,
  oct:10,october:10,nov:11,november:11,dec:12,december:12
}

const NUMBER_WORDS: Record<string, number> = {
  one:1,two:2,three:3,four:4,five:5,six:6,seven:7,eight:8,nine:9,ten:10,
  eleven:11,twelve:12,fourteen:14,fifteen:15,sixteen:16,eighteen:18,twenty:20
}

function numberValue(value: string) {
  const numeric = Number(value)
  if (Number.isFinite(numeric)) return numeric
  return NUMBER_WORDS[value.toLowerCase()]
}

function parseDuration(value: string) {
  const normalized = value.toLowerCase().replace(/\s+/g, ' ').trim()
  const ym = normalized.match(/(\d+(?:\.\d+)?)\s*y(?:ears?|rs?)?\s*(?:&|and|,)\s*(\d+(?:\.\d+)?)\s*m(?:onths?|ths?)/)
  if (ym) return Math.round((Number(ym[1]) + Number(ym[2]) / 12) * 10) / 10
  const yearsOnly = normalized.match(/(\d+(?:\.\d+)?)\s*(?:years?|yrs?)\b/)
  if (yearsOnly) return Number(yearsOnly[1])
  const monthsOnly = normalized.match(/(\d+(?:\.\d+)?)\s*m(?:onths?|ths?)\b/)
  if (monthsOnly) return Math.round((Number(monthsOnly[1]) / 12) * 10) / 10
  const wordYears = normalized.match(/(?:more than|over|at least|around|approximately)?\s*([a-z]+)\s*(?:years?|yrs?)\b/)
  if (wordYears) {
    const n = numberValue(wordYears[1])
    return n == null ? undefined : n
  }
  return undefined
}

function experienceSection(text: string) {
  const lines = text.split(/\n+/).map(v => v.trim()).filter(Boolean)
  const start = lines.findIndex(line => /^(professional\s+experience|work\s+experience|employment\s+history|career\s+history|experience|employment|work\s+history)$/i.test(line.replace(/[:\-]+$/, '').trim()))
  if (start < 0) return lines.join('\n')
  const result: string[] = []
  const stop = /^(education|academic\s+background|qualifications|skills|technical\s+skills|certifications?|projects?|achievements?|awards?|summary|professional\s+summary|objective|references?)$/i
  for (let i=start+1; i<lines.length; i++) {
    if (stop.test(lines[i].replace(/[:\-]+$/, '').trim())) break
    result.push(lines[i])
  }
  return result.join('\n')
}

function explicitTotal(text: string) {
  const top = text.split(/\n+/).slice(0, 120).join('\n')
  const patterns = [
    /(?:\bexp|\bexperience)\s*[:=]?\s*\(?\s*(\d+(?:\.\d+)?)\s*y(?:ears?|rs?)?\s*(?:&|and|,)\s*(\d+(?:\.\d+)?)\s*m(?:onths?|ths?)/i,
    /(?:\bexp|\bexperience)\s*[:=]?\s*\(?\s*(\d+(?:\.\d+)?)\s*\+?\s*(?:years?|yrs?)\b/i,
    /\b(?:more than|over|at least|around|approximately)\s+([a-z]+|\d+(?:\.\d+)?)\s*(?:years?|yrs?)\b/i,
    /\b(\d+(?:\.\d+)?)\s*\+?\s*(?:years?|yrs?)\s+(?:of\s+)?(?:total\s+|overall\s+|professional\s+|IT\s+)?experience\b/i,
    /\btotal\s+(?:IT\s+|professional\s+)?experience\s*[:=]?\s*(\d+(?:\.\d+)?)\s*\+?\s*(?:years?|yrs?)\b/i,
    /\boverall\s+(?:IT\s+|professional\s+)?experience\s*[:=]?\s*(\d+(?:\.\d+)?)\s*\+?\s*(?:years?|yrs?)\b/i,
    /\b(\d+(?:\.\d+)?)\s*\+?\s*(?:years?|yrs?)\s+experience\b/i
  ]
  for (let i=0; i<patterns.length; i++) {
    const match = top.match(patterns[i])
    if (!match) continue
    if (i === 0) return Math.round((Number(match[1]) + Number(match[2]) / 12) * 10) / 10
    const n = numberValue(match[1])
    if (n != null) return n
  }
  return parseDuration(top.match(/\b(?:exp|experience)\s*[:=]\s*\(?([^\n|,)]{3,30})/i)?.[1] || '')
}

function explicitRelevant(text: string) {
  const patterns = [
    /\b(\d+(?:\.\d+)?)\s*\+?\s*(?:years?|yrs?)\s+(?:of\s+)?relevant\s+experience\b/i,
    /\brelevant\s+experience\s*[:=]?\s*(\d+(?:\.\d+)?)\s*\+?\s*(?:years?|yrs?)\b/i
  ]
  for (const pattern of patterns) {
    const match = text.match(pattern)
    if (match) return Number(match[1])
  }
  return undefined
}

function dateParts(value: string | undefined, end=false, current=false) {
  if (!value) return current ? { year:new Date().getFullYear(), month:new Date().getMonth()+1 } : undefined
  const clean = value.trim().toLowerCase()
  const yearMatch = clean.match(/(19|20)\d{2}/)
  if (!yearMatch) return undefined
  const year = Number(yearMatch[0])
  const alphaMonth = clean.match(/\b(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:t)?(?:ember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\b/i)
  if (alphaMonth) return { year, month:MONTHS[alphaMonth[1].toLowerCase()] }
  const numericMonth = clean.match(/\b(0?[1-9]|1[0-2])\s*[\/.]\s*(?:19|20)\d{2}\b/)
  return { year, month:numericMonth ? Number(numericMonth[1]) : (end ? 12 : 1) }
}

function toIndex(value:{year:number,month?:number}) {
  return value.year * 12 + ((value.month || 1) - 1)
}

function dateRanges(section:string) {
  const monthName = '(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:t)?(?:ember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)'
  const date = '(?:(?:' + monthName + ')\s+|\d{1,2}[\/.]\s*)?(?:19\d{2}|20\d{2})'
  const range = new RegExp('\\b(' + date + ')\\s*(?:-|–|—|to)\\s*(' + date + '|present|current|till\\s+date|till\\s+now)\\b','gi')
  const ranges:Array<{start:{year:number,month?:number},end:{year:number,month?:number}}> = []
  for (const match of section.matchAll(range)) {
    const start = dateParts(match[1], false)
    const end = /^(present|current|till\s+date|till\s+now)$/i.test(match[2]) ? dateParts(undefined, true, true) : dateParts(match[2], true)
    if (start && end && toIndex(end) >= toIndex(start)) ranges.push({start,end})
  }
  return ranges
}

function mergedMonths(ranges:Array<{start:{year:number,month?:number},end:{year:number,month?:number}}>) {
  const intervals = ranges.map(r => [toIndex(r.start),toIndex(r.end)] as [number,number]).sort((a,b) => a[0]-b[0])
  if (!intervals.length) return 0
  const merged:Array<[number,number]> = []
  for (const interval of intervals) {
    const last = merged[merged.length-1]
    if (!last || interval[0] > last[1] + 1) merged.push(interval)
    else last[1] = Math.max(last[1], interval[1])
  }
  return merged.reduce((sum,[start,end]) => sum + (end-start+1), 0)
}

export function calculateExperience(text:string, parsed?:Pick<ParsedResume,'experienceYears'|'relevantExperienceYears'>):ExperienceResult {
  const explicit = explicitTotal(text)
  const relevant = explicitRelevant(text) ?? parsed?.relevantExperienceYears
  if (explicit != null && explicit >= 0 && explicit <= 60) return {total:explicit,relevant,source:'explicit'}
  const ranges = dateRanges(experienceSection(text))
  if (!ranges.length) return {total:parsed?.experienceYears,relevant,source:parsed?.experienceYears != null ? 'explicit' : 'unavailable'}
  const months = mergedMonths(ranges)
  return {total:Math.round((months/12)*10)/10,relevant,source:'date_ranges'}
}
