import { GoogleGenerativeAI } from '@google/generative-ai'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)
const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })

export interface GeminiResult {
  productType: string
  brand: string
  condition: 'New' | 'Like New' | 'Good' | 'Fair' | 'Poor'
  conditionNotes: string
  title: string
  description: string
  category: string
  suggestedPrice: number
  originalRRP: number | null
  tags: string[]
  edition: string
  confidence: number
}

const PROMPT = `You are an expert product listing assistant for a marketplace. Analyze this product image very carefully.

Return ONLY a raw JSON object (no markdown, no backticks, no extra text) with exactly these fields:
{
  "productType": "specific product type e.g. laptop, textbook, phone, jacket",
  "brand": "detected brand name or empty string if unclear",
  "condition": "one of exactly: New | Like New | Good | Fair | Poor",
  "conditionNotes": "1-2 sentences describing specific visible wear, scratches, marks, or pristine state",
  "title": "compelling marketplace title under 80 characters, include brand+model+key specs",
  "description": "3-4 sentence marketplace description. Mention key features, condition details, and selling points. Write as if you're the seller.",
  "category": "one of: Textbooks & Education | Electronics | Phones & Tablets | Computers & Laptops | Clothing & Apparel | Furniture & Home | Sports & Outdoors | Gaming | Kitchen & Dining | Books & Media | Other",
  "suggestedPrice": 45,
  "originalRRP": 120,
  "tags": ["tag1","tag2","tag3","tag4","tag5","tag6"],
  "edition": "edition/version/year if detectable, empty string if not",
  "confidence": 0.91
}

Be accurate with pricing — research realistic resale values based on condition. Tags should be searchable keywords.`

export async function analyzeImage(base64: string, mimeType: string): Promise<GeminiResult> {
  const result = await model.generateContent([
    { inlineData: { data: base64, mimeType: mimeType as 'image/jpeg' | 'image/png' | 'image/webp' } },
    PROMPT,
  ])

  const text = result.response.text().trim()
  // Strip any accidental markdown fences
  const clean = text.replace(/^```json\s*/i, '').replace(/```\s*$/i, '').trim()
  return JSON.parse(clean) as GeminiResult
}
