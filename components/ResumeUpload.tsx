'use client'

import { useRef, useState } from 'react'

const MAX_SIZE = 10 * 1024 * 1024
const ALLOWED = new Set([
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
])

export default function ResumeUpload({ value, onUploaded }: { value?: string; onUploaded: (value: string) => void | Promise<void> }) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [fileName, setFileName] = useState('')
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  async function upload() {
    const file = inputRef.current?.files?.[0]
    setError('')
    setMessage('')
    if (!file) return setError('Choose a PDF, DOC or DOCX resume first.')
    if (!ALLOWED.has(file.type)) return setError('Only PDF, DOC and DOCX resumes are supported.')
    if (file.size > MAX_SIZE) return setError('The resume must be 10 MB or smaller.')
    setBusy(true)
    try {
      const body = new FormData()
      body.append('file', file)
      const response = await fetch('/api/resumes', { method: 'POST', body })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error || 'Unable to upload resume.')
      await onUploaded(result.resume_url)
      setFileName(file.name)
      setMessage('Resume uploaded and saved.')
      if (inputRef.current) inputRef.current.value = ''
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to upload resume.')
    } finally {
      setBusy(false)
    }
  }

  const currentUploaded = value?.startsWith('storage:')

  return (
    <div className="resumeUpload">
      <div className="resumeUploadRow">
        <input ref={inputRef} type="file" accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document" onChange={e => setFileName(e.target.files?.[0]?.name || '')} />
        <button type="button" className="secondaryUploadButton" onClick={upload} disabled={busy}>{busy ? 'Uploading…' : 'Upload resume'}</button>
      </div>
      <span className="resumeUploadHint">Choose from Desktop, Downloads or another folder. PDF, DOC or DOCX up to 10 MB.</span>
      {fileName && <span className="resumeUploadName">Selected: {fileName}</span>}
      {currentUploaded && !fileName && <span className="resumeUploadName">A resume is already uploaded to your profile.</span>}
      {message && <span className="resumeUploadMessage">{message}</span>}
      {error && <span className="resumeUploadError">{error}</span>}
    </div>
  )
}
