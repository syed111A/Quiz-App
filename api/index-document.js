import process from 'node:process'
import { getAuthenticatedSupabase } from '../server/auth.js'
import { embedTexts } from '../server/gemini.js'

export const config = { maxDuration: 60 }

const maxPages = 300
const maxTextLength = 120000
const chunkLength = 1000
const chunkOverlap = 140

function splitPages(pages) {
  const chunks = []
  for (const page of pages) {
    const text = page.text.trim()
    let start = 0
    while (start < text.length) {
      let end = Math.min(start + chunkLength, text.length)
      if (end < text.length) {
        const boundary = text.lastIndexOf(' ', end)
        if (boundary > start + chunkLength * 0.55) end = boundary
      }
      const content = text.slice(start, end).trim()
      if (content) chunks.push({ content, page_number: page.pageNumber })
      if (end >= text.length) break
      start = Math.max(start + 1, end - chunkOverlap)
    }
  }
  return chunks
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).json({ error: 'Method not allowed.' })
  }
  if (!process.env.GEMINI_API_KEY) {
    return res.status(503).json({ error: 'Document indexing is not configured. Add a Gemini API key to the server environment.' })
  }

  const context = await getAuthenticatedSupabase(req, res)
  if (!context) return
  const { supabase, user } = context
  const { documentId, pages } = req.body || {}
  if (typeof documentId !== 'string' || !/^[0-9a-f-]{36}$/i.test(documentId)) {
    return res.status(400).json({ error: 'A valid document ID is required.' })
  }
  if (!Array.isArray(pages) || pages.length < 1 || pages.length > maxPages) {
    return res.status(400).json({ error: `Provide between 1 and ${maxPages} pages of extracted PDF text.` })
  }
  let totalTextLength = 0
  for (const [index, page] of pages.entries()) {
    if (
      !page
      || page.pageNumber !== index + 1
      || typeof page.text !== 'string'
      || page.text.length > maxTextLength
    ) {
      return res.status(400).json({ error: 'The extracted document pages are invalid.' })
    }
    totalTextLength += page.text.length
    if (totalTextLength > maxTextLength) {
      return res.status(413).json({ error: 'This PDF contains too much text to index in one request. Split it into smaller files.' })
    }
  }

  const { data: document, error: documentError } = await supabase
    .from('study_documents')
    .select('id')
    .eq('id', documentId)
    .maybeSingle()
  if (documentError) {
    console.error('Document ownership check failed:', documentError.message)
    return res.status(503).json({ error: 'Could not verify this document. Please try again.' })
  }
  if (!document) return res.status(404).json({ error: 'Document not found in your learning space.' })

  const { data: quotaAvailable, error: quotaError } = await supabase.rpc('consume_document_index')
  if (quotaError) {
    console.error('Document indexing quota check failed:', quotaError.message)
    return res.status(503).json({ error: 'Could not verify your document-processing limit.' })
  }
  if (!quotaAvailable) return res.status(429).json({ error: 'You have reached today’s document-processing limit. Try again tomorrow.' })

  const { error: statusError } = await supabase
    .from('study_documents')
    .update({ status: 'processing', error_message: null })
    .eq('id', documentId)
  if (statusError) {
    console.error('Document status update failed:', statusError.message)
    return res.status(503).json({ error: 'Could not start document processing.' })
  }

  try {
    const chunks = splitPages(pages)
    if (!chunks.length) throw new Error('No selectable text was found in the PDF.')
    const embeddings = await embedTexts(chunks.map((chunk) => chunk.content), 'RETRIEVAL_DOCUMENT')
    const { error: deleteError } = await supabase.from('document_chunks').delete().eq('document_id', documentId)
    if (deleteError) throw new Error(`Could not replace the existing document index: ${deleteError.message}`)
    const rows = chunks.map((chunk, index) => ({
      user_id: user.id,
      document_id: documentId,
      chunk_index: index,
      page_number: chunk.page_number,
      content: chunk.content,
      embedding: embeddings[index],
    }))
    const { error: insertError } = await supabase.from('document_chunks').insert(rows)
    if (insertError) throw new Error(`Could not save document search data: ${insertError.message}`)
    const { error: readyError } = await supabase
      .from('study_documents')
      .update({ status: 'ready', error_message: null })
      .eq('id', documentId)
    if (readyError) throw new Error(`Could not mark the document ready: ${readyError.message}`)
    return res.status(200).json({ documentId, chunkCount: rows.length })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Document indexing failed.'
    console.error('Document indexing failed:', message)
    const { error: cleanupError } = await supabase.from('document_chunks').delete().eq('document_id', documentId)
    if (cleanupError) console.error('Failed document chunks could not be cleaned up:', cleanupError.message)
    const { error: statusError } = await supabase
      .from('study_documents')
      .update({ status: 'failed', error_message: message.slice(0, 300) })
      .eq('id', documentId)
    if (statusError) console.error('Failed document status could not be updated:', statusError.message)
    return res.status(502).json({ error: message })
  }
}
