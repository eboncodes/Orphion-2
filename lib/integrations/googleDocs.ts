export type ToastFn = (message: string) => void

const LS_GOOGLE_DRIVE_CONNECTED = 'orphion-google-drive-connected'

function toHtml(md: string): string {
	try {
		const escaped = (md || '')
			.replace(/&/g, '&amp;')
			.replace(/</g, '&lt;')
			.replace(/>/g, '&gt;')
		const lines = escaped.split('\n').map(l => {
			if (/^#\s+/.test(l)) return `<h1>${l.replace(/^#\s+/, '')}</h1>`
			if (/^##\s+/.test(l)) return `<h2>${l.replace(/^##\s+/, '')}</h2>`
			if (/^###\s+/.test(l)) return `<h3>${l.replace(/^###\s+/, '')}</h3>`
			return l
		})
		return `<html><head><meta charset="utf-8"/></head><body>${lines
			.join('\n')
			.split(/\n{2,}/)
			.map(p => `<p>${p.replace(/\n/g, '<br/>')}</p>`) 
			.join('')}</body></html>`
	} catch {
		return `<html><head><meta charset="utf-8"/></head><body><pre style="white-space:pre-wrap">${md || ''}</pre></body></html>`
	}
}

async function loadGis(): Promise<void> {
	return new Promise<void>((resolve, reject) => {
		if ((window as any).google?.accounts?.oauth2) {
			resolve()
			return
		}
		const s = document.createElement('script')
		s.src = 'https://accounts.google.com/gsi/client'
		s.async = true
		s.defer = true
		s.onload = () => resolve()
		s.onerror = () => reject(new Error('Failed to load Google Identity Services'))
		document.head.appendChild(s)
	})
}

export async function authorizeGoogleDrive(): Promise<string | null> {
	const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID
	if (!clientId) return null

	let wasConnected = false
	try { wasConnected = localStorage.getItem(LS_GOOGLE_DRIVE_CONNECTED) === 'true' } catch {}

	await loadGis()
	const google: any = (window as any).google
	return new Promise((resolve) => {
		const tokenClient = google.accounts.oauth2.initTokenClient({
			client_id: clientId,
			scope: 'https://www.googleapis.com/auth/drive.file',
			callback: (resp: any) => {
				if (!resp || !resp.access_token) {
					return resolve(null)
				}
				try { localStorage.setItem(LS_GOOGLE_DRIVE_CONNECTED, 'true') } catch {}
				resolve(resp.access_token as string)
			}
		})
		// After first connection, request token silently without showing in-page consent bar
		const requestOpts: any = wasConnected ? { prompt: '' } : undefined
		tokenClient.requestAccessToken(requestOpts)
	})
}

export async function openInGoogleDocs(pageContent: string, title: string, onToast?: ToastFn) {
	try {
		const token = await authorizeGoogleDrive()
		if (token) {
			const boundary = '-------orphion-doc-upload-boundary'
			const metadata = {
				name: `${title || 'Untitled'}.doc`,
				mimeType: 'application/vnd.google-apps.document'
			}
			const html = toHtml(pageContent || '')
			const body = `--${boundary}\r\n` +
				'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
				`${JSON.stringify(metadata)}\r\n` +
				`--${boundary}\r\n` +
				'Content-Type: text/html; charset=UTF-8\r\n\r\n' +
				`${html}\r\n` +
				`--${boundary}--`

			const res = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,webViewLink', {
				method: 'POST',
				headers: {
					'Authorization': `Bearer ${token}`,
					'Content-Type': `multipart/related; boundary=${boundary}`
				},
				body
			})
			if (!res.ok) throw new Error(`Drive upload failed: ${res.status}`)
			const data = await res.json()
			const link = data.webViewLink || `https://docs.google.com/document/d/${data.id}/edit`
			onToast?.('Redirecting to Google Docs…')
			window.open(link, '_blank', 'noopener,noreferrer')
			return
		}
	} catch (e) {
		// fall through to fallback
	}
	try {
		if (pageContent && navigator.clipboard) {
			await navigator.clipboard.writeText(pageContent)
		}
	} catch {}
	onToast?.('Redirecting to Google Docs…')
	window.open('https://docs.google.com/document/create', '_blank', 'noopener,noreferrer')
}
