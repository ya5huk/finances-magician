import type { AIResponse, ParsedPayslip, ParsedCreditCardStatement } from './types'

const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions'
const MODEL = 'google/gemini-3-flash-preview'

interface OpenRouterMessage {
  role: 'user' | 'system' | 'assistant'
  content: string | Array<{ type: string; text?: string; image_url?: { url: string } }>
}

export async function callGemini(
  prompt: string,
  pdfBase64: string,
  mimeType: string = 'application/pdf'
): Promise<AIResponse> {
  const apiKey = process.env.OPENROUTER_API_KEY
  if (!apiKey) {
    return { success: false, data: null, error: 'OPENROUTER_API_KEY is not configured' }
  }

  const messages: OpenRouterMessage[] = [
    {
      role: 'user',
      content: [
        { type: 'text', text: prompt },
        {
          type: 'image_url',
          image_url: {
            url: `data:${mimeType};base64,${pdfBase64}`,
          },
        },
      ],
    },
  ]

  try {
    const response = await fetch(OPENROUTER_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
        'HTTP-Referer': 'https://finances-magician.app',
        'X-Title': 'Finances Magician',
      },
      body: JSON.stringify({
        model: MODEL,
        messages,
        temperature: 0.1,
        max_tokens: 4096,
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      return { success: false, data: null, error: `OpenRouter API error: ${response.status} - ${errorText}` }
    }

    const result = await response.json()
    const content = result.choices?.[0]?.message?.content

    if (!content) {
      return { success: false, data: null, error: 'No content in AI response' }
    }

    // Extract JSON from the response (handle potential markdown code blocks)
    const jsonMatch = content.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      return { success: false, data: null, error: 'Could not extract JSON from AI response' }
    }

    const parsed = JSON.parse(jsonMatch[0]) as ParsedPayslip | ParsedCreditCardStatement
    return { success: true, data: parsed }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error calling AI'
    return { success: false, data: null, error: message }
  }
}
