import { ParsedResume } from './resume-parser'

type ExperienceResult = {
  total?: number
  relevant?: number
  source: 'explicit' | 'date_ranges' | 'unavailable'
}

const MONTHS: Record<string, number> = {
  jan: 1, january: 1, feb: 2, february: 2, mar: 3, march: 3,
  apr: 4, april: 4, may: 5, jun: 6, june: 6, jul: 7, july: 7,
  aug: 8, august: 8, sep: 9, sept: 9, september: 9, oct: 10,
  october: 10, nov: 11, november: 11, dec: 12, december: 12,
}

function monthYear(value: string | undefined, current = false) {
  if (!value) return current ? { year: new Date().getFullYear(), month: new Date().getMonth() + 1 } : undefined
  const clean = value.trim().toLowerCase()
  const yearMatch = clean.match(/(19|20)\d{2}/)
  if (!yearMatch) return undefined
  const year = Number(yearMatch[0])
  const monthWord = clean.replace(yearMatch[0], '').trim().replace(/[^a-z]/g, '')
  const month = MONTHS[monthWord] || Number(monthWord) || undefined
  return { year, month }
}

function toIndex(value: { year: number; month?: number }) {
  return value.year * 12 + ((value.month || 1) - 1)
}

function experienceSection(text: string) {
  const lines = text.split(/\n+/).map(v => v.trim()).filter(Boolean)
  const heading = /^(professional\s+experience|work\s+experience|employment\s+history|career\s+history|experience|employment|work\s+history)$/i
  const stop = /^(education|academic\s+background|qualifications|skills|technical\s+skills|certifications?|projects?|achievements?|awards?|summary|professional\s+summary|objective)$/i
  const start = lines.findIndex(line => heading.test(line.replace(/[:\-]+$/, '').trim()))
  if (start < 0) return lines.join('\n')
  const result: string[] = []
  for (let i = start + 1; i < lines.length; i++) {
    if (stop.test(lines[i].replace(/[:\-]+$/, '').trim())) break
    result.push(lines[i])
  }
  return result.join('\n')
}

function explicitTotal(text: string) {
  const section = text.split(/\n+/).slice(0, 80).join('\n')
  const patterns = [
    /\b(\d+(?:\.\d+)?)\s*\+?\s*years?\s+of\s+total\s+(?:IT\s+)?experience\b/i,
    /\b(\d+(?:\.\d+)?)\s*\+?\s*years?\s+total\s+(?:IT\s+)?experience\b/i,
    /\btotal\s+(?:IT\s+)?experience\s*[:\-]?\s*(\d+(?:\.\d+)?)\s*\+?\s*years?\b/i,
    /\boverall\s+(?:IT\s+)?experience\s*[:\-]?\s*(\d+(?:\.\d+)?)\s*\+?\s*years?\b/i,
    /\b(\d+(?:\.\d+)?)\s*\+?\s*years?\s+of\s+(?:professional|IT)\s+experience\b/i,
    /\b(\d+(?:\.\d+)?)\s*\+?\s*years?\s+(?:professional|IT)\s+experience\b/i,
  ]
  for (const pattern of patterns) {
    const match = section.match(pattern)
    if (match) return Number(match[1])
  }
  return undefined
}

function explicitRelevant(text: string) {
  const patterns = [
    /\b(\d+(?:\.\d+)?)\s*\+?\s*years?\s+(?:of\s+)?relevant\s+experience\b/i,
    /\brelevant\s+experience\s*[:\-]?\s*(\d+(?:\.\d+)?)\s*\+?\s*years?\b/i,
  ]
  for (const pattern of patterns) {
    const match = text.match(pattern)
    if (match) return Number(match[1])
  }
  return undefined
}

function dateRanges(section: string) {
  const ranges: Array<{ start: { year: number; month?: number }, end: { year: number; month?: number } }> = []
  const date = '(?:(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:t)?(?:ember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\\s+)?(?:19\\d{2}|20\\d{2})'
  const range = new RegExp(`\\b(${date})\\s*(?:-|–|—|to)\\s*(${date}|present|current|till\\s+date|till\\s+now)\\b`, 'gi')
  for (const match of section.matchAll(range)) {
    const start = monthYear(match[1])
    const end = /^(present|current|till\s+date|till\s+now)$/i.test(match[2]) ? monthYear(undefined, true) : monthYear(match[2])
    if (start && end && toIndex(end) >= toIndex(start)) ranges.push({ start, end })
  }
  return ranges
}

function mergedMonths(ranges: Array<{ start: { year: number; month?: number }, end: { year: number; month?: number } }>) {
  const intervals = ranges.map(r => [toIndex(r.start), toIndex(r.end)] as [number, number]).sort((a, b) => a[0] - b[0])
  if (!intervals.length) return 0
  const merged: Array<[number, number]> = []
  for (const interval of intervals) {
    const last = merged[merged.length - 1]
    if (!last || interval[0] > last[1] + 1) merged.push(interval)
    else last[1] = Math.max(last[1], interval[1])
  }
  return merged.reduce((sum, [start, end]) => sum + (end - start + 1), 0)
}

export function calculateExperience(text: string, parsed?: Pick<ParsedResume, 'experienceYears' | 'relevantExperienceYears'>): ExperienceResult {
  const explicit = explicitTotal(text)
  const relevant = explicitRelevant(text) ?? parsed?.relevantExperienceYears
  if (explicit != null) return { total: explicit, relevant, source: 'explicit' }

  const ranges = dateRanges(experienceSection(text))
  if (!ranges.length) return { total: parsed?.experienceYears, relevant, source: parsed?.experienceYears != null ? 'explicit' : 'unavailable' }

  const months = mergedMonths(ranges)
  return { total: Math.round((months / 12) * 10) / 10, relevant, source: 'date_ranges' }
}
