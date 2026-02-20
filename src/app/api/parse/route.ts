import { createClient } from '@/lib/supabase/server'
import { callGemini } from '@/lib/ai/gemini'
import { PAYSLIP_PARSE_PROMPT, CREDIT_CARD_PARSE_PROMPT } from '@/lib/ai/prompts'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { document_id } = body

    if (!document_id) {
      return NextResponse.json({ error: 'document_id is required' }, { status: 400 })
    }

    // Fetch the document record
    const { data: document, error: fetchError } = await supabase
      .from('uploaded_documents')
      .select('*')
      .eq('id', document_id)
      .eq('user_id', user.id)
      .single()

    if (fetchError || !document) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 })
    }

    // Download the file from storage
    // Extract the storage path from the public URL
    const fileUrl = document.file_url as string
    const storagePath = fileUrl.split('/storage/v1/object/public/documents/')[1]

    if (!storagePath) {
      return NextResponse.json({ error: 'Invalid file URL' }, { status: 400 })
    }

    const { data: fileData, error: downloadError } = await supabase.storage
      .from('documents')
      .download(decodeURIComponent(storagePath))

    if (downloadError || !fileData) {
      return NextResponse.json(
        { error: `Failed to download file: ${downloadError?.message}` },
        { status: 500 }
      )
    }

    // Convert to base64
    const arrayBuffer = await fileData.arrayBuffer()
    const base64 = Buffer.from(arrayBuffer).toString('base64')

    // Choose prompt based on document type
    const prompt =
      document.document_type === 'payslip'
        ? PAYSLIP_PARSE_PROMPT
        : CREDIT_CARD_PARSE_PROMPT

    // Call AI
    const aiResponse = await callGemini(prompt, base64, 'application/pdf')

    if (!aiResponse.success || !aiResponse.data) {
      // Update document status to error
      await supabase
        .from('uploaded_documents')
        .update({
          status: 'error',
          parsed_data: { error: aiResponse.error },
        })
        .eq('id', document_id)

      return NextResponse.json(
        { error: aiResponse.error || 'Failed to parse document' },
        { status: 500 }
      )
    }

    // Update document with parsed data
    await supabase
      .from('uploaded_documents')
      .update({
        status: 'parsed',
        parsed_data: aiResponse.data as unknown as Record<string, unknown>,
      })
      .eq('id', document_id)

    return NextResponse.json({
      success: true,
      document_type: document.document_type,
      data: aiResponse.data,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
