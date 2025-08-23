import { NextRequest, NextResponse } from 'next/server'

interface TavilySearchResponse {
  answer?: string
  images?: Array<{ url: string; title?: string; alt?: string }>
  results?: Array<{
    title: string
    url: string
    content: string
    score: number
    published_date?: string | null
  }>
}

export async function POST(request: NextRequest) {
  try {
    const { query, searchDepth } = await request.json()

    if (!query || typeof query !== 'string') {
      return NextResponse.json({ error: 'Query is required' }, { status: 400 })
    }

    const apiKey = process.env.TAVILY_API_KEY
    if (!apiKey) {
      return NextResponse.json({ error: 'Tavily API key is missing' }, { status: 500 })
    }

    // Normalize search depth to values accepted by Tavily
    const normalizedDepth = (searchDepth === 'basic' || searchDepth === 'advanced') ? searchDepth : 'advanced'

    const tavilyResponse = await fetch('https://api.tavily.com/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Some environments are sensitive to header casing; provide both for safety
        'X-API-Key': apiKey,
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        query,
        include_answer: true,
        include_images: true,
        max_results: 10,
        search_depth: normalizedDepth,
      }),
    })

    if (!tavilyResponse.ok) {
      let errorBody: any
      try {
        errorBody = await tavilyResponse.json()
      } catch {
        errorBody = { error: await tavilyResponse.text() }
      }
      console.error('Tavily error:', tavilyResponse.status, errorBody)
      return NextResponse.json(errorBody, { status: tavilyResponse.status })
    }

    const data: TavilySearchResponse = await tavilyResponse.json()

    const images = Array.isArray(data.images)
      ? data.images.map((img: any) => {
          if (typeof img === 'string') return { url: img }
          return { url: img.url, title: img.title, alt: img.alt }
        })
      : []

    return NextResponse.json({
      answer: data.answer || '',
      sources: (data.results || []).map(r => ({
        title: r.title,
        url: r.url,
        content: r.content,
        score: r.score,
        published_date: r.published_date ?? null,
      })),
      images,
      query,
      timestamp: new Date(),
    })
  } catch (error) {
    console.error('Web search route error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}


