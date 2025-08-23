import { NextRequest, NextResponse } from 'next/server'
import * as XLSX from 'xlsx'
import { getAPIKey } from '@/lib/api-keys'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const excelFile = formData.get('excel') as File
    const userMessage = formData.get('message') as string || 'What is this Excel file about?'

    if (!excelFile) {
      return NextResponse.json(
        { error: 'Excel file is required' },
        { status: 400 }
      )
    }

    // Check for Excel and CSV file types
    const validTypes = [
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel.sheet.macroEnabled.12',
      'application/vnd.ms-excel.template.macroEnabled.12',
      'text/csv',
      'text/plain' // For CSV files that might be detected as text/plain
    ]

    if (!validTypes.includes(excelFile.type) && !excelFile.name.toLowerCase().endsWith('.csv')) {
      return NextResponse.json(
        { error: 'File must be an Excel file (.xls, .xlsx, .xlsm, .xltx) or CSV file (.csv)' },
        { status: 400 }
      )
    }

    console.log('📊 Starting Excel/CSV analysis pipeline...')

    // Step 1: Extract data from Excel or CSV
    console.log('📝 Step 1: Extracting data from file...')
    let excelData = ''
    
    try {
      // Check if it's a CSV file
      const isCSV = excelFile.type === 'text/csv' || 
                    excelFile.type === 'text/plain' || 
                    excelFile.name.toLowerCase().endsWith('.csv')
      
      if (isCSV) {
        // Handle CSV file
        const text = await excelFile.text()
        const lines = text.split('\n')
        
        if (lines.length > 0) {
          const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''))
          excelData = `CSV File: "${excelFile.name}"\n`
          excelData += 'Headers: ' + headers.join(' | ') + '\n'
          
          // Add first few rows for context
          const dataRows = lines.slice(1, 6) // First 5 data rows
          dataRows.forEach((line, rowIndex) => {
            if (line.trim()) {
              const values = line.split(',').map(v => v.trim().replace(/"/g, ''))
              excelData += `Row ${rowIndex + 1}: ${values.join(' | ')}\n`
            }
          })
          
          if (lines.length > 6) {
            excelData += `... and ${lines.length - 6} more rows\n`
          }
        }
      } else {
        // Handle Excel file
        const arrayBuffer = await excelFile.arrayBuffer()
        const buffer = Buffer.from(arrayBuffer)
        
        // Read Excel file
        const workbook = XLSX.read(buffer, { type: 'buffer' })
        
        // Extract data from all sheets
        const sheetNames = workbook.SheetNames
        const allData: string[] = []
        
        sheetNames.forEach((sheetName, index) => {
          const worksheet = workbook.Sheets[sheetName]
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as unknown[][]
          
          if (jsonData.length > 0) {
            allData.push(`Sheet ${index + 1}: "${sheetName}"`)
            const headers = jsonData[0] as unknown[]
            allData.push('Headers: ' + headers.map(h => String(h)).join(' | '))
            
            // Add first few rows for context
            const dataRows = jsonData.slice(1, 6) // First 5 data rows
            dataRows.forEach((row, rowIndex) => {
              if (row && Array.isArray(row) && row.length > 0) {
                allData.push(`Row ${rowIndex + 1}: ${row.map(cell => String(cell)).join(' | ')}`)
              }
            })
            
            if (jsonData.length > 6) {
              allData.push(`... and ${jsonData.length - 6} more rows`)
            }
            allData.push('') // Empty line between sheets
          }
        })
        
        excelData = allData.join('\n')
      }
      
      if (!excelData || excelData.trim().length === 0) {
        return NextResponse.json(
          { error: 'No data found in file. The file might be empty or corrupted.' },
          { status: 400 }
        )
      }
    } catch (error) {
      console.error('Data extraction error:', error)
      return NextResponse.json(
        { error: 'Failed to extract data from file. The file might be corrupted or password-protected.' },
        { status: 500 }
      )
    }

    console.log('✅ Data extraction completed')

    // Step 2: Gemini processes the data and user message
    console.log('🤖 Step 2: Gemini processing data...')
    
    // Get API key from request headers (sent from client)
    const geminiApiKey = getAPIKey('gemini')
    
    if (!geminiApiKey) {
      return NextResponse.json(
        { error: 'Gemini API key is required' },
        { status: 400 }
      )
    }
    
    // Initialize Gemini
    const { GoogleGenAI } = await import('@google/genai')
    const ai = new GoogleGenAI({ apiKey: geminiApiKey })

    const processingPrompt = `You are a helpful AI assistant that processes spreadsheet data (Excel and CSV files). You receive data and user questions about the spreadsheet. Your job is to:

1. Understand the data structure and content provided
2. Answer the user's question about the data in a conversational, helpful way
3. Provide insights, summaries, or analysis of the data as needed
4. Keep responses natural and engaging
5. If the user asks for a summary, provide a comprehensive but concise summary of the data
6. If the user asks specific questions, answer them based on the data content
7. Help identify patterns, trends, or interesting findings in the data
8. Explain what the data represents and its structure
9. For CSV files, help understand the comma-separated structure
10. For Excel files, help understand multi-sheet data

Always be helpful, accurate, and conversational in your responses.

Here's the data:

${excelData}

User's question: ${userMessage}

Please provide a helpful response to the user's question about this file.`

    const result = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [
        { role: 'user', parts: [{ text: processingPrompt }] }
      ]
    })
    const finalResponse = result.text || 'Unable to process file'
    
    console.log('✅ Gemini processing completed')

    // Step 3: Return the final chat-ready response
    return NextResponse.json({
      response: finalResponse,
      excelData: excelData.substring(0, 500) + '...', // Include first 500 chars for debugging
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Error in Excel analysis pipeline:', error)
    return NextResponse.json(
      { error: 'Internal server error in Excel processing pipeline' },
      { status: 500 }
    )
  }
} 