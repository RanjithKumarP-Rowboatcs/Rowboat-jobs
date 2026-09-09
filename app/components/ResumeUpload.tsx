'use client'

import { ChangeEvent, useState } from 'react'

export default function ResumeUpload({ value, onUploaded }: { value?: string | null; onUploaded: (value: string) => void }) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [name, setName] = useState('')

  async function upload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) return
    setBusy(true); setError(''); setName('')
    try {
      const form = new FormData()
      form.append('file', file)
      const response = await fetch('/api/resumes', { method: 'POST', body: form })
      const body = await response.json()
      if (!response.ok) throw new Error(body.error || 'Unable to upload resume.')
      setName(body.file_name || file.name)
      onUploaded(body.resume_url)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to upload resume.')
    } finally {
      setBusy(false)
      event.target.value = ''
    }
  }

  return (
    <div className="resumeUpload">
      <label className="resumeUploadButton">
        {busy ? 'Uploading…' : 'Upload resume from computer'}
        <input type="file" accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document" onChange={upload} disabled={busy} hidden />
      </label>
      <small>PDF, DOC or DOCX · maximum 10 MB</small>
      {name && <span className="resumeUploadSuccess">Uploaded: {name}</span>}
      {value?.startsWith('storage:') && !name && <span className="resumeUploadSuccess">Resume saved in your private profile.</span>}
      {error && <span className="resumeUploadError">{error}</span>}
    </div>
  )
}
