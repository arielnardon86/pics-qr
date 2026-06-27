import { google } from 'googleapis'
import { Readable } from 'stream'

export function getOAuthClient() {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI || `${process.env.NEXT_PUBLIC_BASE_URL}/api/auth/google/callback`
  )
}

export function getAuthUrl(eventId: string) {
  const client = getOAuthClient()
  return client.generateAuthUrl({
    access_type: 'offline',
    prompt: 'consent',
    state: eventId,
    scope: [
      'https://www.googleapis.com/auth/drive.file',
      'https://www.googleapis.com/auth/userinfo.email',
    ],
  })
}

interface TokenSet {
  access_token: string
  refresh_token?: string | null
  expiry_date?: number | null
}

export function getDriveClient(tokens: TokenSet) {
  const client = getOAuthClient()
  client.setCredentials(tokens)
  return google.drive({ version: 'v3', auth: client })
}

export async function refreshTokenIfNeeded(tokens: TokenSet): Promise<TokenSet> {
  const client = getOAuthClient()
  client.setCredentials(tokens)

  if (tokens.expiry_date && Date.now() > tokens.expiry_date - 60_000) {
    const { credentials } = await client.refreshAccessToken()
    return {
      access_token: credentials.access_token!,
      refresh_token: credentials.refresh_token ?? tokens.refresh_token,
      expiry_date: credentials.expiry_date,
    }
  }
  return tokens
}

export async function createDriveFolder(tokens: TokenSet, folderName: string, parentId?: string) {
  const drive = getDriveClient(tokens)
  const res = await drive.files.create({
    requestBody: {
      name: folderName,
      mimeType: 'application/vnd.google-apps.folder',
      parents: parentId ? [parentId] : undefined,
    },
    fields: 'id, webViewLink',
  })

  await drive.permissions.create({
    fileId: res.data.id!,
    requestBody: { role: 'reader', type: 'anyone' },
  })

  return { id: res.data.id!, url: res.data.webViewLink! }
}

export async function uploadBufferToDrive(
  tokens: TokenSet,
  folderId: string,
  filename: string,
  buffer: Buffer,
  mimeType: string = 'image/jpeg'
) {
  const drive = getDriveClient(tokens)
  const res = await drive.files.create({
    requestBody: {
      name: filename,
      parents: [folderId],
    },
    media: {
      mimeType,
      body: Readable.from(buffer),
    },
    fields: 'id, webViewLink',
  })

  const fileId = res.data.id!

  // Make the file publicly readable so thumbnail URLs work without auth
  await drive.permissions.create({
    fileId,
    requestBody: { role: 'reader', type: 'anyone' },
  })

  return {
    id: fileId,
    url: res.data.webViewLink!,
    thumbnailUrl: `https://drive.google.com/thumbnail?id=${fileId}&sz=w800`,
  }
}
