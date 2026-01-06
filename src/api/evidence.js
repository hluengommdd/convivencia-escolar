import { supabase } from './supabaseClient'
import { withRetry } from './withRetry'

const BUCKET = 'evidencias'

function safeFileName(name = '') {
  return name.replace(/[^\w.\-()]/g, '_')
}

export async function uploadEvidenceFiles({ caseId, followupId, files = [] }) {
  if (!caseId) throw new Error('Falta caseId para evidencias')
  if (!followupId) throw new Error('Falta followupId para evidencias')
  if (!files.length) return []

  const uploadedRows = []

  for (const file of files) {
    const safeName = safeFileName(file.name)
    const path = `cases/${caseId}/followups/${followupId}/${Date.now()}_${safeName}`

    const { error: upErr } = await supabase.storage
      .from(BUCKET)
      .upload(path, file, {
        contentType: file.type || 'application/octet-stream',
        upsert: false,
      })

    if (upErr) throw upErr

    const { data, error: dbErr } = await withRetry(() =>
      supabase
        .from('followup_evidence')
        .insert([
          {
            case_id: caseId,
            followup_id: followupId,
            storage_bucket: BUCKET,
            storage_path: path,
            file_name: file.name,
            content_type: file.type,
            file_size: file.size,
          },
        ])
        .select()
        .single()
    )

    if (dbErr) throw dbErr
    uploadedRows.push(data)
  }

  return uploadedRows
}

export async function listEvidenceByFollowup(followupId) {
  if (!followupId) return []
  const { data, error } = await withRetry(() =>
    supabase
      .from('followup_evidence')
      .select('*')
      .eq('followup_id', followupId)
      .order('created_at', { ascending: false })
  )
  if (error) throw error
  return data || []
}

export async function getEvidenceSignedUrl(storagePath, seconds = 3600) {
  if (!storagePath) throw new Error('Falta storagePath para URL firmada')
  const { data, error } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(storagePath, seconds)
  if (error) throw error
  return data.signedUrl
}

export async function deleteEvidence(row) {
  if (!row?.id) throw new Error('Fila de evidencia inválida')

  const { error: sErr } = await supabase.storage
    .from(BUCKET)
    .remove([row.storage_path])
  if (sErr) throw sErr

  const { error: dErr } = await withRetry(() =>
    supabase
      .from('followup_evidence')
      .delete()
      .eq('id', row.id)
  )
  if (dErr) throw dErr
}
