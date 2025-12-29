// Minimal Google Drive uploader using Google Identity Services (GIS)
// Requires env vars: VITE_GOOGLE_CLIENT_ID and optional VITE_GOOGLE_DRIVE_FOLDER_ID

const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID
const DEFAULT_FOLDER_ID = import.meta.env.VITE_GOOGLE_DRIVE_FOLDER_ID

async function loadGoogleScript() {
  if (window.google && window.google.accounts && window.google.accounts.oauth2) return
  await new Promise((resolve, reject) => {
    const script = document.createElement('script')
    script.src = 'https://accounts.google.com/gsi/client'
    script.async = true
    script.onload = resolve
    script.onerror = () => reject(new Error('No se pudo cargar Google Identity Services'))
    document.head.appendChild(script)
  })
}

async function getAccessToken() {
  if (!CLIENT_ID) throw new Error('Falta VITE_GOOGLE_CLIENT_ID')
  await loadGoogleScript()
  return await new Promise((resolve, reject) => {
    try {
      const tokenClient = window.google.accounts.oauth2.initTokenClient({
        client_id: CLIENT_ID,
        scope: 'https://www.googleapis.com/auth/drive.file',
        callback: (resp) => {
          if (resp && resp.access_token) resolve(resp.access_token)
          else reject(new Error('No se obtuvo access_token'))
        },
      })
      tokenClient.requestAccessToken()
    } catch (e) {
      reject(e)
    }
  })
}

async function driveFetch(token, url, init) {
  const res = await fetch(url, init)
  if (!res.ok) {
    const txt = await res.text()
    throw new Error(txt)
  }
  return res.json()
}

async function searchFolderByName(token, name, parentId) {
  const params = new URLSearchParams()
  let q = `name='${name.replace(/'/g, "\\'")}' and mimeType='application/vnd.google-apps.folder' and trashed=false`
  if (parentId) q += ` and '${parentId}' in parents`
  params.set('q', q)
  params.set('fields', 'files(id, name, parents)')
  const data = await driveFetch(token, `https://www.googleapis.com/drive/v3/files?${params.toString()}`)
  return data.files?.[0] || null
}

async function createFolder(token, name, parentId) {
  const body = {
    name,
    mimeType: 'application/vnd.google-apps.folder',
    ...(parentId ? { parents: [parentId] } : {}),
  }
  return await driveFetch(token, 'https://www.googleapis.com/drive/v3/files?fields=id,name,parents', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

export async function ensureCaseFolder(caseId, label) {
  const token = await getAccessToken()
  const parentId = DEFAULT_FOLDER_ID
  const folderName = label || `CASO_${caseId}`
  const existing = await searchFolderByName(token, folderName, parentId)
  if (existing) return existing.id
  const created = await createFolder(token, folderName, parentId)
  // Make folder discoverable by link (optional)
  try {
    await fetch(`https://www.googleapis.com/drive/v3/files/${created.id}/permissions`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ role: 'reader', type: 'anyone' }),
    })
  } catch {}
  return created.id
}

export async function uploadFileToDrive(file, options = {}) {
  const token = await getAccessToken()
  let folderId = options.folderId || DEFAULT_FOLDER_ID
  if (!folderId && options.caseId) {
    folderId = await ensureCaseFolder(options.caseId, options.caseLabel)
  } else if (options.caseId && folderId === DEFAULT_FOLDER_ID) {
    // Prefer case-specific subfolder
    folderId = await ensureCaseFolder(options.caseId, options.caseLabel)
  }

  const metadata = {
    name: file.name,
    mimeType: file.type || 'application/octet-stream',
    ...(folderId ? { parents: [folderId] } : {}),
  }

  const boundary = 'fooobar_' + Math.random().toString(16).slice(2)
  const delimiter = `\r\n--${boundary}\r\n`
  const closeDelimiter = `\r\n--${boundary}--`

  const metadataPart = `${delimiter}Content-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify(
    metadata
  )}`
  const fileArrayBuffer = await file.arrayBuffer()
  const filePartHeader = `${delimiter}Content-Type: ${metadata.mimeType}\r\n\r\n`

  const body = new Blob([metadataPart, filePartHeader, new Uint8Array(fileArrayBuffer), closeDelimiter], {
    type: `multipart/related; boundary=${boundary}`,
  })

  const uploadRes = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,webViewLink,parents', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body,
  })

  if (!uploadRes.ok) {
    const txt = await uploadRes.text()
    throw new Error(txt)
  }

  const uploaded = await uploadRes.json()

  // Make the file viewable by link (optional). Comment out if you prefer restricted access.
  try {
    await fetch(`https://www.googleapis.com/drive/v3/files/${uploaded.id}/permissions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ role: 'reader', type: 'anyone' }),
    })
  } catch (e) {
    // ignore permission errors to avoid blocking upload
    console.warn('Drive: no se pudo establecer permiso público', e?.message)
  }

  return { id: uploaded.id, webViewLink: uploaded.webViewLink, folderId }
}
