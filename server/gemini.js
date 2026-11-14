import process from 'node:process'

const embeddingModel = 'gemini-embedding-001'
const embeddingDimensions = 768
const defaultModel = 'gemini-3.8-flash'
const fallbackModel = 'gemini-3.5-flash-lite'
const interactionsApiRevision = '2026-05-20'

function getApiKey() {
  const key = process.env.GEMINI_API_KEY
  if (!key) throw new Error('Gemini is not configured.')
  return key
}

async function postJson(url, body, label, apiKey) {
  let response
  try {
    response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(60000),
    })
  } catch (error) {
    throw new Error(`${label} request failed: ${error instanceof Error ? error.message : 'network error'}`)
  }
  if (!response.ok) throw new Error(`${label} returned HTTP ${response.status}.`)
  return response.json()
}

export async function embedTexts(texts, taskType) {
  const key = getApiKey()
  const embeddings = []
  for (let start = 0; start < texts.length; start += 32) {
    const batch = texts.slice(start, start + 32)
    const result = await postJson(
      `https://generativelanguage.googleapis.com/v1beta/models/${embeddingModel}:batchEmbedContents`,
      {
        requests: batch.map((text) => ({
          model: `models/${embeddingModel}`,
          content: { parts: [{ text }] },
          taskType,
          outputDimensionality: embeddingDimensions,
        })),
      },
      'Gemini embeddings',
      key,
    )
    if (!Array.isArray(result.embeddings) || result.embeddings.length !== batch.length) {
      throw new Error('Gemini returned an incomplete embedding batch.')
    }
    for (const item of result.embeddings) {
      if (!Array.isArray(item.values) || item.values.length !== embeddingDimensions || !item.values.every(Number.isFinite)) {
        throw new Error('Gemini returned an invalid embedding.')
      }
      embeddings.push(item.values)
    }
  }
  return embeddings
}

class GeminiApiError extends Error {
  constructor(status, message) {
    super(message)
    this.status = status
  }
}

async function requestInteraction(model, prompt, options, apiKey) {
  let response
  try {
    response = await fetch('https://generativelanguage.googleapis.com/v1beta/interactions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': apiKey,
        'Api-Revision': interactionsApiRevision,
      },
      body: JSON.stringify({
        model,
        input: prompt,
        store: false,
        ...(options.responseFormat ? { response_format: options.responseFormat } : {}),
        ...(options.generationConfig ? { generation_config: options.generationConfig } : {}),
      }),
      signal: AbortSignal.timeout(60000),
    })
  } catch (error) {
    const detail = error instanceof Error ? error.message : 'Unknown network error'
    console.error('Gemini interaction request failed:', detail)
    if (error instanceof Error && (error.name === 'TimeoutError' || /timed out|timeout/i.test(error.message))) {
      throw new Error('Gemini timed out while generating a response. Please try again.')
    }
    throw new Error('Gemini could not be reached. Check your internet connection and try again.')
  }

  let payload
  try {
    payload = await response.json()
  } catch (error) {
    console.error('Gemini returned an unreadable interaction response:', error instanceof Error ? error.message : 'Unknown response error')
    if (!response.ok) throw new GeminiApiError(response.status, `Gemini returned HTTP ${response.status}. Please try again.`)
    throw new Error('Gemini returned an unreadable response. Please try again.')
  }

  if (!response.ok) {
    const providerMessage = typeof payload.error?.message === 'string' ? payload.error.message.slice(0, 400) : ''
    console.error('Gemini interaction returned an unsuccessful response:', {
      status: response.status,
      model,
      message: providerMessage || 'No provider error details returned.',
    })
    throw new GeminiApiError(
      response.status,
      providerMessage ? `Gemini error (${response.status}): ${providerMessage}` : `Gemini returned HTTP ${response.status}. Please try again.`,
    )
  }

  return payload
}

async function createInteraction(prompt, options, apiKey) {
  const model = process.env.GEMINI_MODEL || defaultModel
  try {
    return await requestInteraction(model, prompt, options, apiKey)
  } catch (error) {
    if (!(error instanceof GeminiApiError) || error.status !== 503 || model !== defaultModel) throw error
    console.warn(`Gemini ${model} is overloaded; retrying with ${fallbackModel}.`)
    return requestInteraction(fallbackModel, prompt, options, apiKey)
  }
}

export async function generateText(prompt, options = {}) {
  const key = getApiKey()
  const generationConfig = options.generationConfig || { temperature: 0.4, max_output_tokens: 1400 }
  const response = await createInteraction(prompt, { ...options, generationConfig }, key)
  const text = response.steps
    ?.filter((step) => step.type === 'model_output')
    .flatMap((step) => Array.isArray(step.content) ? step.content : [])
    .filter((content) => content.type === 'text' && typeof content.text === 'string')
    .map((content) => content.text)
    .join('')
    .trim()
  if (!text) throw new Error('Gemini returned an empty answer.')
  return text
}
