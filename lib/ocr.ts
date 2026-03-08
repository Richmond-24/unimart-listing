export interface OCRResult {
  rawText: string
  isbn: string | null
  lines: string[]
}

export async function extractText(base64: string, mimeType: string): Promise<OCRResult> {
  try {
    const body = new FormData()
    body.append('base64Image', `data:${mimeType};base64,${base64}`)
    body.append('language', 'eng')
    body.append('isOverlayRequired', 'false')
    body.append('detectOrientation', 'true')
    body.append('scale', 'true')
    body.append('OCREngine', '2')

    const res = await fetch('https://api.ocr.space/parse/image', {
      method: 'POST',
      headers: { apikey: process.env.OCR_SPACE_API_KEY! },
      body,
    })

    const data = await res.json()
    if (data.IsErroredOnProcessing) {
      return { rawText: '', isbn: null, lines: [] }
    }

    const rawText: string = data.ParsedResults?.[0]?.ParsedText ?? ''
    const lines = rawText.split('\n').map((l: string) => l.trim()).filter(Boolean)

    // ISBN-13 or ISBN-10 extraction
    const isbnMatch =
      rawText.match(/(?:ISBN[-:\s]?)?(?:97[89])[-\s]?\d{1,5}[-\s]?\d{1,7}[-\s]?\d{1,7}[-\s]?\d/i) ||
      rawText.match(/(?:ISBN[-:\s]?)?\d{9}[\dXx]/i)
    const isbn = isbnMatch ? isbnMatch[0].replace(/[\s-]/g, '') : null

    return { rawText, isbn, lines }
  } catch {
    // OCR is best-effort — never block the main flow
    return { rawText: '', isbn: null, lines: [] }
  }
}
