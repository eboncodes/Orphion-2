import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenAI } from '@google/genai'
import { getAPIKey } from '@/lib/api-keys'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userPrompt, aiResponse, messages, model = 'gemini-2.5-flash', includeIcon = false } = body

    if (!userPrompt && !messages) {
      return NextResponse.json(
        { error: 'User prompt or messages are required' },
        { status: 400 }
      )
    }

    // Get API key from request headers
    const geminiApiKey = getAPIKey('gemini')
    
    if (!geminiApiKey) {
      return NextResponse.json(
        { error: 'Gemini API key is required' },
        { status: 400 }
      )
    }

    // Initialize Gemini
    const ai = new GoogleGenAI({
      apiKey: geminiApiKey,
    })
    
    const tools = [
      { codeExecution: {} },
    ]
    
    const config = {
      temperature: 0.3,
      thinkingConfig: {
        thinkingBudget: 14426,
      },
      tools,
    }

    let systemPrompt = `You are a canvas/document title generation expert. Your task is to generate concise, descriptive titles for canvas documents based on the user's prompt and the AI's response.

TITLE GENERATION RULES:
- Create titles that are 3-8 words long
- Make them descriptive and specific to the document content
- Use clear, simple language
- Avoid generic titles like "Document" or "Page"
- Focus on the main topic or content being created
- If it's a technical document, include relevant technical terms
- If it's creative content, reflect the creative nature
- If it's a business document, indicate the business purpose
- If it's educational content, reflect the learning topic

EXAMPLES:
- User: "Write a business plan" AI: "Here's a comprehensive business plan..." → "Business Plan Template"
- User: "Create a project proposal" AI: "Here's a detailed project proposal..." → "Project Proposal Document"
- User: "Write a technical specification" AI: "Here's the technical specification..." → "Technical Specification Doc"
- User: "Create a marketing strategy" AI: "Here's a marketing strategy..." → "Marketing Strategy Plan"
- User: "Write a research report" AI: "Here's a research report..." → "Research Report Analysis"

RESPONSE FORMAT:
- Return ONLY the title, nothing else
- No quotes, no explanations, just the title
- Keep it concise and to the point
- Make it immediately understandable`

    // Enhanced system prompt for icon generation
    let iconSystemPrompt = `You are an icon suggestion expert. Based on the document topic, suggest the most appropriate Lucide icon name from the list below. You MUST ALWAYS suggest an icon.

ICON SELECTION RULES:
- Choose icons that represent the main topic or theme of the document.
- Be aggressive in suggesting an icon; do not say "none" or "N/A".
- If the primary topic doesn't fit a specific icon, find the closest conceptual match.
- Consider the context and purpose of the document.
- Prefer icons that are immediately recognizable.
- If multiple topics are present, choose an icon for the most prominent one.
- If no clear topic, use a general but relevant icon like "FileText", "Document", "BookOpen", "Target", "Activity".

LIST OF AVAILABLE LUCIDE ICONS (choose one of these exactly):
- FileText (documents, text files, content)
- Document (general documents, files)
- BookOpen (reading, learning, documentation)
- Target (goals, objectives, planning, strategy)
- Briefcase (work, business, professional, management)
- ChartBar (analytics, reports, data visualization)
- TrendingUp (growth, statistics, trends, finance)
- DollarSign (finance, money, economy, business)
- Code (programming, development, technical)
- Database (data, information storage, backend)
- Palette (design, art, creativity, graphics)
- PenTool (drawing, illustration, creative tools)
- Lightbulb (ideas, concepts, solutions, innovation)
- Brain (intelligence, ideas, thinking)
- GraduationCap (education, academic, knowledge)
- Users (people, community, teams)
- MessageSquare (general chat, communication)
- Calendar (scheduling, dates, events)
- Clock (time, duration, urgency)
- CheckCircle (completion, success, done)
- AlertCircle (warnings, important notices)
- Info (information, details, facts)
- Settings (configuration, setup, preferences)
- Search (research, investigation, discovery)
- Globe (world, international, global)
- MapPin (location, navigation, places)
- Phone (calls, communication, mobile)
- Mail (email, messages, correspondence)
- Share2 (sharing, collaboration, distribution)
- Download (saving, exporting, retrieval)
- Upload (importing, adding, submission)
- Copy (duplication, replication)
- Edit (modification, changes, updates)
- Trash2 (deletion, removal, cleanup)
- Archive (storage, organization, filing)
- Folder (organization, files, documents)
- Image (images, photos, visuals)
- Video (video content, media)
- Music (audio, sound, entertainment)
- Camera (photography, images, visual content)
- Film (video, movies, media)
- Mic (audio input, speaking, recording)
- Speaker (audio output, sound)
- Headphones (listening, audio, music)
- Gamepad (gaming, entertainment)
- Heart (love, health, emotions)
- Star (favorite, rating, quality)
- ThumbsUp (like, agreement, positive)
- ThumbsDown (dislike, disagreement, negative)
- Smile (happiness, positive emotion)
- Frown (sadness, negative emotion)
- Handshake (agreement, partnership, deal)
- Clipboard (notes, tasks, copy)
- PieChart (charts, data, statistics)
- Book (general knowledge, reading)
- Map (geography, directions)
- Wrench (tools, repair, maintenance, engineering)
- Hammer (building, construction, tools)
- Shield (security, protection, defense)
- Lock (privacy, security, access)
- Key (access, solution, essential)
- Rocket (launch, progress, ambition, space)
- FlaskConical (science, experiments, chemistry)
- Dna (biology, genetics, life science)
- Puzzle (problems, complexity, solutions)
- Gem (value, precious, rare, luxury)
- Gift (rewards, presents, generosity)
- Crown (leadership, royalty, importance)
- Anchor (stability, nautical, firm)
- Bell (notifications, alerts, attention)
- CreditCard (payments, transactions, banking)
- ShoppingCart (e-commerce, shopping, purchase)
- Sparkles (magic, special, enhance)
- Fire (energy, passion, destruction)
- Droplet (water, liquid, purity)
- CloudRain (rain, weather, sadness)
- Zap (electricity, power, quick)
- Telescope (astronomy, observation, vision)
- Scissors (cut, edit, craft)
- Type (text, typography, writing)
- MousePointerClick (interaction, click, UI)
- Laptop (work, portable)
- Gamepad (gaming, entertainment)

RESPONSE FORMAT:
- Return ONLY the icon name, nothing else.
- Use the exact Lucide icon name (e.g., "FileText", "BookOpen", "Palette").
- No quotes, no explanations, just the icon name.
- If unsure, default to "FileText".
- If the generated icon is not in the list, default to "FileText".`

    let contents: any[] = []

    if (messages) {
      // Generate title from conversation history
      contents = [
        {
          role: 'user',
          parts: [{ text: systemPrompt }]
        },
        {
          role: 'model',
          parts: [{ text: 'I understand. I will generate concise, descriptive titles for canvas documents based on the conversation content.' }]
        },
        {
          role: 'user',
          parts: [{ text: `Generate a title for this canvas document:\n\n${messages.map((msg: any) => `${msg.role}: ${msg.content}`).join('\n\n')}` }]
        }
      ]
    } else {
      // Generate title from user prompt and AI response
      contents = [
        {
          role: 'user',
          parts: [{ text: systemPrompt }]
        },
        {
          role: 'model',
          parts: [{ text: 'I understand. I will generate concise, descriptive titles for canvas documents based on the user prompt and AI response.' }]
        },
        {
          role: 'user',
          parts: [{ text: `Generate a title for this canvas document:\n\nUser: ${userPrompt}\n\nAI: ${aiResponse}` }]
        }
      ]
    }

    // Generate title
    const response = await ai.models.generateContent({
      model,
      config,
      contents
    })
    
    const title = response.text?.trim() || 'Untitled Document'
    
    // Generate icon suggestion if requested
    let icon = 'FileText' // Default icon for documents
    let iconName = 'FileText'
    
    if (includeIcon) {
      try {
        const iconContents = [
          {
            role: 'user',
            parts: [{ text: iconSystemPrompt }]
          },
          {
            role: 'model',
            parts: [{ text: 'I understand. I will suggest appropriate Lucide icons based on document topics.' }]
          },
          {
            role: 'user',
            parts: [{ text: `Suggest an icon for this canvas document:\n\nTitle: ${title}\n\nUser: ${userPrompt || 'N/A'}\n\nAI: ${aiResponse || 'N/A'}` }]
          }
        ]
        
        const iconResponse = await ai.models.generateContent({
          model,
          config,
          contents: iconContents
        })
        
        const suggestedIcon = iconResponse.text?.trim()
        if (suggestedIcon && suggestedIcon.length > 0 && suggestedIcon.length < 50) {
          icon = suggestedIcon
          iconName = suggestedIcon
        }
      } catch (iconError) {
        console.warn('Icon generation failed, using default:', iconError)
        // Keep default icon if icon generation fails
      }
    }
    
    // Calculate confidence based on title quality
    let confidence = 0.8 // Default confidence
    if (title.length < 3 || title.length > 50) {
      confidence = 0.5 // Low confidence for very short or very long titles
    } else if (title.toLowerCase().includes('document') || title.toLowerCase().includes('page')) {
      confidence = 0.6 // Lower confidence for generic titles
    } else if (title.split(' ').length >= 3 && title.split(' ').length <= 8) {
      confidence = 0.9 // High confidence for well-formed titles
    }
    
    return NextResponse.json({
      title,
      timestamp: new Date(),
      confidence,
      icon,
      iconName,
      metadata: {
        model,
        processingTime: 0
      }
    })
  } catch (error) {
    console.error('Error in canvas title generation route:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
