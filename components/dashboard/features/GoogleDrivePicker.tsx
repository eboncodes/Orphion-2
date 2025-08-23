"use client"

import React, { useEffect, useMemo, useState } from "react"
import { createPortal } from "react-dom"
import { X, Search, Loader2 } from "lucide-react"
import { authorizeGoogleDrive } from "@/lib/integrations/googleDocs"

interface GoogleDrivePickerProps {
  isOpen: boolean
  onClose: () => void
  onPick: (file: { file: File; preview: string; type: 'image' | 'document' | 'pdf' | 'excel' | 'csv' }) => void
}

interface DriveFileMeta {
  id: string
  name: string
  mimeType: string
  iconLink?: string
  thumbnailLink?: string
  modifiedTime?: string
  size?: string
}

function getAttachmentTypeFromMime(mime: string): 'image' | 'document' | 'pdf' | 'excel' | 'csv' {
  if (mime.startsWith('image/')) return 'image'
  if (mime === 'application/pdf') return 'pdf'
  if (mime === 'text/csv') return 'csv'
  if (
    mime === 'application/vnd.ms-excel' ||
    mime === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
    mime === 'application/vnd.ms-excel.sheet.macroEnabled.12' ||
    mime === 'application/vnd.ms-excel.template.macroEnabled.12'
  ) return 'excel'
  return 'document'
}

export default function GoogleDrivePicker({ isOpen, onClose, onPick }: GoogleDrivePickerProps) {
  const [token, setToken] = useState<string | null>(null)
  const [files, setFiles] = useState<DriveFileMeta[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [query, setQuery] = useState("")
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!isOpen) return
    let cancelled = false
    ;(async () => {
      try {
        setIsLoading(true)
        const t = await authorizeGoogleDrive()
        if (cancelled) return
        setToken(t)
        if (t) {
          const res = await fetch('https://www.googleapis.com/drive/v3/files?q=trashed=false&fields=files(id,name,mimeType,iconLink,thumbnailLink,modifiedTime,size)&pageSize=100', {
            headers: { Authorization: `Bearer ${t}` }
          })
          if (!res.ok) throw new Error(`Drive list failed: ${res.status}`)
          const data = await res.json()
          setFiles(data.files || [])
        }
      } catch (e: any) {
        setError(e?.message || 'Failed to load Google Drive')
      } finally {
        setIsLoading(false)
      }
    })()
    return () => { cancelled = true }
  }, [isOpen])

  const filteredFiles = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return files
    return files.filter(f => f.name.toLowerCase().includes(q))
  }, [files, query])

  const handlePick = async (f: DriveFileMeta) => {
    if (!token) return
    try {
      setIsLoading(true)
      let downloadUrl = `https://www.googleapis.com/drive/v3/files/${f.id}?alt=media`
      let outMime = f.mimeType
      let outName = f.name

      // Handle Google Docs/Sheets/Slides export
      if (f.mimeType === 'application/vnd.google-apps.document') {
        downloadUrl = `https://www.googleapis.com/drive/v3/files/${f.id}/export?mimeType=text/plain`
        outMime = 'text/plain'
        if (!/\.txt$/i.test(outName)) outName = `${outName}.txt`
      } else if (f.mimeType === 'application/vnd.google-apps.spreadsheet') {
        downloadUrl = `https://www.googleapis.com/drive/v3/files/${f.id}/export?mimeType=text/csv`
        outMime = 'text/csv'
        if (!/\.csv$/i.test(outName)) outName = `${outName}.csv`
      } else if (f.mimeType === 'application/vnd.google-apps.presentation') {
        downloadUrl = `https://www.googleapis.com/drive/v3/files/${f.id}/export?mimeType=application/pdf`
        outMime = 'application/pdf'
        if (!/\.pdf$/i.test(outName)) outName = `${outName}.pdf`
      }

      const res = await fetch(downloadUrl, { headers: { Authorization: `Bearer ${token}` } })
      if (!res.ok) throw new Error(`Download failed: ${res.status}`)
      const blob = await res.blob()
      const file = new File([blob], outName, { type: outMime })

      const reader = new FileReader()
      reader.onload = () => {
        const preview = reader.result as string
        const type = getAttachmentTypeFromMime(outMime)
        onPick({ file, preview, type })
        onClose()
      }
      reader.readAsDataURL(file)
    } catch (e: any) {
      setError(e?.message || 'Failed to download file')
    } finally {
      setIsLoading(false)
    }
  }

  if (!isOpen) return null

  const modal = (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-lg border border-gray-200 w-full max-w-2xl max-h-[85vh] overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-700">Google Drive</span>
            {isLoading && <Loader2 className="w-4 h-4 animate-spin text-gray-500" />}
          </div>
          <button onClick={onClose} className="p-1 rounded hover:bg-gray-100">
            <X className="w-4 h-4 text-gray-600" />
          </button>
        </div>
        <div className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-2 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search your Drive files"
                className="w-full pl-7 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-300"
              />
            </div>
          </div>
          {error && (
            <div className="mb-3 text-xs text-red-600">{error}</div>
          )}
          <div className="max-h-[60vh] overflow-auto">
            {filteredFiles.length === 0 && !isLoading ? (
              <div className="text-sm text-gray-500 text-center py-8">No files found</div>
            ) : (
              <ul className="divide-y divide-gray-100">
                {filteredFiles.map((f) => (
                  <li key={f.id} className="flex items-center gap-3 px-2 py-2 hover:bg-gray-50 cursor-pointer" onClick={() => handlePick(f)}>
                    {f.thumbnailLink ? (
                      <img src={f.thumbnailLink} alt="thumb" className="w-8 h-8 rounded object-cover border" />
                    ) : (
                      <div className="w-8 h-8 rounded bg-gray-100 border flex items-center justify-center text-[10px] text-gray-500">
                        {f.mimeType.split('/')[1] || 'file'}
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="text-sm text-gray-800 truncate">{f.name}</div>
                      <div className="text-xs text-gray-400 truncate">{f.mimeType}</div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  )

  return typeof document !== 'undefined' ? createPortal(modal, document.body) : null
}


