"use client"

import React from "react"
import { ImagePopupProps } from '../types'
import { X, Download } from 'lucide-react'

export default function ImagePopup({ isOpen, onClose, imageSrc, alt }: ImagePopupProps) {
  if (!isOpen) return null

  const handleDownload = () => {
    try {
      const link = document.createElement('a')
      link.href = imageSrc
      const defaultName = `generated-image-${Date.now()}.png`
      link.download = defaultName
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    } catch (e) {
      console.error('Download failed:', e)
    }
  }

  return (
    <div
      className="fixed inset-0 bg-black/80 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div
        className="relative max-w-[90vw] max-h-[90vh] w-[min(90vw,900px)] h-auto overflow-auto rounded-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Toolbar */}
        <div className="absolute top-3 right-3 flex gap-2 z-10">
          <button
            onClick={handleDownload}
            className="inline-flex items-center gap-1 bg-black/60 hover:bg-black/80 text-white rounded-md px-2 py-1 text-xs transition"
            title="Download"
          >
            <Download className="w-4 h-4" />
          </button>
          <button
            onClick={onClose}
            className="inline-flex items-center gap-1 bg-black/60 hover:bg-black/80 text-white rounded-md px-2 py-1 text-xs transition"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Image */}
        <div className="p-2">
          <img
            src={imageSrc}
            alt={alt}
            className="w-full max-h-[85vh] object-contain rounded-lg transition duration-300 ease-out hover:scale-[1.02] hover:brightness-105"
          />
        </div>
      </div>
    </div>
  )
}