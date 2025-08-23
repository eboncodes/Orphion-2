"use client"

import React, { useState } from "react"
import SearchSources from "../../ui/SearchSources"
import ImagePopup from "./ImagePopup"

interface SearchImage {
  url: string
  title?: string
  alt?: string
}

interface SearchSource {
  title: string
  url: string
  content: string
  score: number
  published_date?: string | null
}

interface SearchResultsProps {
  images?: SearchImage[]
  sources?: SearchSource[]
  query?: string
}

export default function SearchResults({ images, sources, query }: SearchResultsProps) {
  const [selectedImage, setSelectedImage] = useState<SearchImage | null>(null)
  const [isPopupOpen, setIsPopupOpen] = useState(false)

  const hasImages = images && images.length > 0
  const hasSources = sources && sources.length > 0

  const handleImageClick = (image: SearchImage) => {
    setSelectedImage(image)
    setIsPopupOpen(true)
  }

  const handleClosePopup = () => {
    setIsPopupOpen(false)
    setSelectedImage(null)
  }

  if (!hasImages && !hasSources) {
    return null
  }

  return (
    <div className="mt-4 bg-gray-50 border border-gray-300 rounded-2xl">
      {/* Header */}
      <div className="px-4 py-2.5 border-b border-gray-300 bg-gray-200 rounded-t-2xl">
        <div className="flex items-center justify-center gap-2">
          <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <h4 className="text-sm font-medium text-gray-700">{query || 'Search Results'}</h4>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Images Section */}
        {hasImages && (
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-3">
              <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span className="text-sm font-medium text-gray-700">Images ({images.length})</span>
            </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
            {images.slice(0, 5).map((image, index) => (
              <div
                key={index}
                className="relative cursor-pointer overflow-hidden rounded-lg border border-gray-200 hover:border-blue-300 transition-all duration-200"
                onClick={() => handleImageClick(image)}
              >
                <img
                  src={image.url}
                  alt={image.alt || image.title || `Search result image ${index + 1}`}
                  className="w-full h-24 object-cover transition-transform duration-200 hover:scale-105"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement
                    target.style.display = 'none'
                    const parent = target.parentElement
                    if (parent) {
                      const errorDiv = document.createElement('div')
                      errorDiv.className = 'w-full h-24 bg-gray-100 flex items-center justify-center'
                      errorDiv.innerHTML = `
                        <div class="text-center">
                          <svg class="w-6 h-6 text-gray-400 mx-auto mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                          </svg>
                          <div class="text-xs text-gray-500">Failed to load</div>
                        </div>
                      `
                      parent.appendChild(errorDiv)
                    }
                  }}
                />
                <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-20 transition-opacity flex items-center justify-center">
                  <div className="opacity-0 hover:opacity-100 transition-opacity">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                    </svg>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

        {/* Sources Section */}
        {hasSources && (
          <div className="mb-4">
            <SearchSources sources={sources} query={query || ''} />
          </div>
        )}
      </div>

      {/* Image Popup */}
      {selectedImage && (
        <ImagePopup
          isOpen={isPopupOpen}
          onClose={handleClosePopup}
          imageSrc={selectedImage.url}
          alt={selectedImage.alt || selectedImage.title || "Search result image"}
        />
      )}
    </div>
  )
}
