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

    let systemPrompt = `You are a chat title generation expert. Your task is to generate concise, descriptive titles for chat conversations based on the user's prompt and the AI's response.

TITLE GENERATION RULES:
- Create titles that are 3-8 words long
- Make them descriptive and specific to the conversation topic
- Use clear, simple language
- Avoid generic titles like "Chat" or "Conversation"
- Focus on the main topic or question being discussed
- If it's a technical topic, include relevant technical terms
- If it's a creative content, reflect the creative nature
- If it's a question, summarize the question topic
- If it's a request for help, indicate the type of help needed

EXAMPLES:
- User: "How do I make a cake?" AI: "Here's a simple cake recipe..." → "Cake Baking Guide"
- User: "Explain quantum physics" AI: "Quantum physics is..." → "Quantum Physics Explanation"
- User: "Write a poem about love" AI: "Here's a romantic poem..." → "Love Poem Creation"
- User: "Help me with my code" AI: "I can help debug..." → "Code Debugging Help"
- User: "What's the weather like?" AI: "I can't check real-time weather..." → "Weather Information Request"

RESPONSE FORMAT:
- Return ONLY the title, nothing else
- No quotes, no explanations, just the title
- Keep it concise and to the point
- Make it immediately understandable`

    // Enhanced system prompt for icon generation
    let iconSystemPrompt = `You are an icon suggestion expert. Based on the conversation topic, suggest the most appropriate Lucide icon name from the list below. You MUST ALWAYS suggest an icon.

ICON SELECTION RULES:
- Choose icons that represent the main topic or theme.
- Be aggressive in suggesting an icon; do not say "none" or "N/A".
- If the primary topic doesn't fit a specific icon, find the closest conceptual match.
- Consider the context and purpose of the conversation.
- Prefer icons that are immediately recognizable.
- If multiple topics are present, choose an icon for the most prominent one.
- If no clear topic, use a general but relevant icon like "MessageSquare", "Lightbulb", "HelpCircle", "Target", "Activity".

LIST OF AVAILABLE LUCIDE ICONS (choose one of these exactly):
- MessageSquare (general chat, communication)
- Code (programming, development, technical)
- Cpu (AI, processing, advanced tech)
- Database (data, information storage, backend)
- Terminal (commands, CLI, execution)
- Bug (debugging, errors, issues)
- GitBranch (version control, branching, projects)
- BookOpen (reading, learning, documentation)
- GraduationCap (education, academic, knowledge)
- Brain (intelligence, ideas, thinking)
- Lightbulb (ideas, concepts, solutions, innovation)
- Target (goals, objectives, planning, strategy)
- Palette (design, art, creativity, graphics)
- Music (audio, sound, entertainment)
- Camera (photography, images, visual content)
- Film (video, movies, media)
- PenTool (drawing, illustration, creative tools)
- Brush (painting, artistic expression)
- TrendingUp (growth, statistics, trends, finance)
- DollarSign (finance, money, economy, business)
- Briefcase (work, business, professional, management)
- ChartBar (analytics, reports, data visualization)
- Calculator (mathematics, calculations, budgeting)
- Activity (general activity, health, fitness, monitoring)
- Dumbbell (fitness, exercise, health)
- Leaf (nature, environment, biology, ecology)
- Sun (day, light, energy, positive)
- Moon (night, rest, space, cycles)
- Plane (travel, aviation, trips)
- Car (transportation, vehicles, driving)
- Train (rail, public transport, journeys)
- MapPin (location, navigation, places)
- Globe (world, international, global)
- Compass (direction, exploration, guidance)
- Utensils (cooking, dining, food preparation)
- ChefHat (cooking, culinary, recipes)
- Coffee (drinks, breaks, energy)
- Wine (drinks, social, relaxation)
- Apple (fruit, healthy food, simple ideas)
- Carrot (vegetables, health, growth)
- Trees (forest, nature, environment)
- Mountain (adventure, outdoors, challenges)
- Cloud (cloud computing, weather, internet)
- Flower (beauty, growth, nature)
- Phone (calls, communication, mobile)
- Mail (email, messages, correspondence)
- Users (people, community, teams)
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
- Calendar (scheduling, dates, events)
- Clock (time, duration, urgency)
- CreditCard (payments, transactions, banking)
- ShoppingCart (e-commerce, shopping, purchase)
- Sparkles (magic, special, enhance)
- Star (favorite, rating, quality)
- Fire (energy, passion, destruction)
- Droplet (water, liquid, purity)
- CloudRain (rain, weather, sadness)
- Zap (electricity, power, quick)
- Target (aim, goal, precision)
- Telescope (astronomy, observation, vision)
- Scissors (cut, edit, craft)
- Mic (audio input, speaking, recording)
- Type (text, typography, writing)
- MousePointerClick (interaction, click, UI)
- Laptop (work, portable)
- Speaker (audio output, sound)
- Headphones (listening, audio, music)
- Gamepad (gaming, entertainment)
- Heart (love, health, emotions)
- ThumbsUp (like, agreement, positive)
- ThumbsDown (dislike, disagreement, negative)
- Smile (happiness, positive emotion)
- Frown (sadness, negative emotion)
- Handshake (agreement, partnership, deal)
- Clipboard (notes, tasks, copy)
- Folder (organization, files, documents)
- FileText (documents, text files, content)
- Image (images, photos, visuals)
- PieChart (charts, data, statistics)
- Book (general knowledge, reading)
- Map (geography, directions)
- Users (multiple people, collaboration)

RESPONSE FORMAT:
- Return ONLY the icon name, nothing else.
- Use the exact Lucide icon name (e.g., "Code", "BookOpen", "Palette").
- No quotes, no explanations, just the icon name.
- If unsure, default to "MessageSquare".
- If the generated icon is not in the list, default to "MessageSquare".`

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
          parts: [{ text: 'I understand. I will generate concise, descriptive titles for chat conversations based on the conversation content.' }]
        },
        {
          role: 'user',
          parts: [{ text: `Generate a title for this conversation:\n\n${messages.map((msg: any) => `${msg.role}: ${msg.content}`).join('\n\n')}` }]
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
          parts: [{ text: 'I understand. I will generate concise, descriptive titles for chat conversations based on the user prompt and AI response.' }]
        },
        {
          role: 'user',
          parts: [{ text: `Generate a title for this conversation:\n\nUser: ${userPrompt}\n\nAI: ${aiResponse}` }]
        }
      ]
    }

    // Generate title
    const response = await ai.models.generateContent({
      model,
      config,
      contents
    })
    
    const title = response.text?.trim() || 'Untitled Conversation'
    
    // Generate icon suggestion if requested
    let icon = 'MessageSquare' // Default icon
    let iconName = 'MessageSquare'
    
    if (includeIcon) {
      try {
        const iconContents = [
          {
            role: 'user',
            parts: [{ text: iconSystemPrompt }]
          },
          {
            role: 'model',
            parts: [{ text: 'I understand. I will suggest appropriate Lucide icons based on conversation topics.' }]
          },
          {
            role: 'user',
            parts: [{ text: `Suggest an icon for this conversation:\n\nTitle: ${title}\n\nUser: ${userPrompt || 'N/A'}\n\nAI: ${aiResponse || 'N/A'}` }]
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
    } else if (title.toLowerCase().includes('chat') || title.toLowerCase().includes('conversation')) {
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
    console.error('Error in title generation route:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 