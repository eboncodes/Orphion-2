"use client"

import { useState, useEffect } from "react"

interface ExamplePromptsProps {
  selectedTool: 'study' | 'image' | 'pages' | 'table' | 'webpage' | null
  onPromptClick: (prompt: string) => void
  messageValue: string
  messages: any[]
}

export default function ExamplePrompts({ selectedTool, onPromptClick, messageValue, messages }: ExamplePromptsProps) {
  const [hoveredPrompt, setHoveredPrompt] = useState<string | null>(null)
  const [randomPrompts, setRandomPrompts] = useState<string[]>([])
  const [isVisible, setIsVisible] = useState(false)
  const [position, setPosition] = useState<'below' | 'above'>('below')

  const getAllPromptsForTool = (tool: string) => {
    switch (tool) {

      case 'study':
        return [
          "Explain quantum physics in simple terms",
          "Help me understand calculus derivatives",
          "Create a study plan for learning Spanish",
          "Explain the water cycle step by step",
          "Help me memorize the periodic table",
          "Explain photosynthesis for a biology test",
          "Create flashcards for world history",
          "Help me understand Shakespeare's plays"
        ]
      case 'image':
        return [
          "Create a cozy reading nook by a window with warm morning light, a steaming mug, and plants in a calm, minimalist style",
          "Design a modern desk setup with a laptop, soft purple LED lighting, a plant, and a notebook in a clean aesthetic",
          "Generate a peaceful sunset beach scene with gentle waves, pastel colors, and a couple walking along the shore",
          "Make a watercolor-style illustration of a small cabin in a pine forest at sunrise with soft light and mist",
          "Produce a product shot of matte black earbuds on a marble surface with soft studio lighting (3:4 aspect ratio)"
        ]
      case 'pages':
        return [
          "Create a page about the benefits of mindfulness meditation",
          "Create a page outlining a 4-week workout plan for beginners",
          "Create a page explaining the basics of blockchain technology",
          "Create a page summarizing the French Revolution with key events",
          "Create a page with a travel guide for Tokyo (must-see spots, food, tips)"
        ]
      case 'table':
        return [
          "Create a table comparing the top 5 programming languages (name, paradigm, use cases, popularity)",
          "Create a table of monthly expenses (category, budget, actual, variance)",
          "Create a table of world capitals (country, capital, population, region)",
          "Create a table of a weekly study schedule (day, subject, duration, notes)",
          "Create a table of project tasks (task, owner, due date, status)"
        ]
      case 'webpage':
        return [
          "Generate a simple landing page for a coffee shop (hero, menu section, contact)",
          "Generate a responsive portfolio webpage with a grid gallery and contact form",
          "Generate a single-page app with a todo list (add, toggle, delete)",
          "Generate an HTML page for a startup landing with CTA and features grid",
          "Generate a product page layout with hero, features, pricing, and FAQ"
        ]
      default:
        return []
    }
  }

  // Calculate optimal position based on viewport
  const calculatePosition = () => {
    if (typeof window !== 'undefined') {
      const viewportHeight = window.innerHeight
      const element = document.querySelector('[data-message-input]')
      if (element) {
        const rect = element.getBoundingClientRect()
        const spaceBelow = viewportHeight - rect.bottom
        const spaceAbove = rect.top

        // If there's less than 200px below, position above
        if (spaceBelow < 200 && spaceAbove > spaceBelow) {
          setPosition('above')
        } else {
          setPosition('below')
        }
      }
    }
  }

  // Generate 3 random prompts when tool changes
  useEffect(() => {
    if (selectedTool) {
      const allPrompts = getAllPromptsForTool(selectedTool)
      const shuffled = [...allPrompts].sort(() => Math.random() - 0.5)
      setRandomPrompts(shuffled.slice(0, 3))
      calculatePosition()
      setIsVisible(true)
    } else {
      setIsVisible(false)
      // Delay clearing prompts to allow exit animation
      setTimeout(() => setRandomPrompts([]), 300)
    }
  }, [selectedTool])

  // Hide prompts if user has started typing, no tool selected, or conversation has started
  if (!selectedTool || messageValue.trim() !== '' || randomPrompts.length === 0 || messages.length > 0) {
    return null
  }

  return (
    <div
      className={`absolute z-10 transition-all duration-500 ease-out ${
        isVisible
          ? 'opacity-100 transform translate-y-0'
          : position === 'below'
            ? 'opacity-0 transform translate-y-4 pointer-events-none'
            : 'opacity-0 transform -translate-y-4 pointer-events-none'
      }`}
      style={{
        ...(position === 'below'
          ? { top: '100%', marginTop: '0.5rem', left: 0, right: 0 }
          : { bottom: '100%', marginBottom: '0.5rem', left: 0, right: 0 }
        ),
        maxWidth: '100%', // Prevent overflow
      }}
    >
      <div className="rounded-lg p-2 max-h-40 overflow-y-auto scrollbar-hide bg-transparent">
        <div className="space-y-2">
          {randomPrompts.map((prompt, index) => (
            <button
              key={index}
              onClick={() => onPromptClick(prompt)}
              onMouseEnter={() => setHoveredPrompt(prompt)}
              onMouseLeave={() => setHoveredPrompt(null)}
              className={`w-full text-left p-3 rounded-lg transition-all duration-200 text-sm border-b border-gray-200 hover:border-gray-400 bg-transparent hover:bg-gray-50 ${
                hoveredPrompt === prompt
                  ? 'bg-gray-100 text-gray-900 border-gray-400'
                  : ''
              }`}
              style={{
                animationDelay: `${index * 100}ms`,
                animation: isVisible ? `fadeInUp 0.5s ease-out ${index * 100}ms both` : 'none'
              }}
            >
              {prompt}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
} 