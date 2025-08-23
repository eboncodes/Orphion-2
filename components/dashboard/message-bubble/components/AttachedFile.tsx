"use client"

import React, { useState } from "react"
import { AttachedFileProps } from '../types'
import ImagePopup from './ImagePopup'

export default function AttachedFile({ attachedFile, isUserMessage }: AttachedFileProps) {
  if (!attachedFile) return null

  const [isPopupOpen, setIsPopupOpen] = useState(false)

  return (
    <div className={`mb-3 ${isUserMessage ? 'text-right' : 'text-left'}`}>
      {attachedFile.type === 'image' ? (
        <div className={`inline-block ${isUserMessage ? 'ml-auto' : 'mr-auto'}`}>
          <button
            type="button"
            onClick={() => setIsPopupOpen(true)}
            className="focus:outline-none"
          >
            <img
              src={attachedFile.preview}
              alt="Attached image"
              className="max-w-[200px] max-h-[150px] rounded-lg object-cover border border-gray-200 shadow-sm hover:brightness-105 hover:scale-[1.01] transition"
            />
          </button>
          <ImagePopup
            isOpen={isPopupOpen}
            onClose={() => setIsPopupOpen(false)}
            imageSrc={attachedFile.preview}
            alt="Attached image"
          />
        </div>
      ) : (
        <div className={`inline-block ${isUserMessage ? 'ml-auto' : 'mr-auto'}`}>
          <div className="flex items-center space-x-2 p-3 bg-gray-50 rounded-lg border border-gray-200 shadow-sm max-w-[300px]">
            <div className="w-8 h-8 bg-blue-100 rounded flex items-center justify-center flex-shrink-0">
              <span className="text-blue-600 text-xs font-medium">
                {attachedFile.type === 'pdf' ? 'PDF' : 
                 attachedFile.type === 'document' ? 'DOC' :
                 attachedFile.type === 'excel' ? 'XLS' : 'CSV'}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {attachedFile.file?.name || 'Unknown file'}
              </p>
              <p className="text-xs text-gray-500">
                {attachedFile.type.toUpperCase()} file
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
} 