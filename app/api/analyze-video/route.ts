import { NextRequest, NextResponse } from 'next/server';

/**
 * Video/Image Analysis API
 * Analyzes uploaded video or image files using Vercel AI Gateway
 * Supports: Claude, Gemini, Qwen models
 * 
 * Returns:
 * - Product details (title, description, category, price, condition)
 * - Seller information (name, email, location, phone if visible)
 */

const ANALYSIS_PROMPT = `You are an expert product analyst. Analyze this video/image and extract product and seller information.

EXTRACT:
1. Product: type, brand, model, condition (New|Like New|Good|Fair|Poor), features, estimated price
2. Seller: name (from nameplate/watermark), email (from business card), phone (if visible), location, company

RETURN ONLY VALID JSON (no markdown):
{
  "productType": "string",
  "brand": "string or empty",
  "model": "string or empty",
  "condition": "New|Like New|Good|Fair|Poor",
  "conditionDescription": "2-3 sentences",
  "title": "marketplace title max 80 chars",
  "description": "3-4 sentence description",
  "category": "category name",
  "suggestedPrice": 0,
  "originalPrice": null,
  "tags": ["array", "of", "tags"],
  "confidence": 0.85,
  "sellerName": "extracted name or null",
  "sellerEmail": "extracted email or null",
  "sellerPhone": "phone or null",
  "sellerLocation": "location or null",
  "sellerCompany": "company name or null",
  "notes": "any observations"
}`;

const MODELS = [
  { name: 'Gemini', id: 'google/gemini-2.0-flash' },
  { name: 'Claude', id: 'anthropic/claude-3-5-sonnet' },
  { name: 'Qwen', id: 'qwen/qwen-turbo' },
];

export async function POST(req: NextRequest) {
  const requestId = Math.random().toString(36).substring(7);
  console.log(`[v0] [${requestId}] 🎥 Analysis request`);

  try {
    const formData = await req.formData();
    const file = formData.get('video') as File | null;

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'No file provided' },
        { status: 400 }
      );
    }

    console.log(`[v0] [${requestId}] File: ${file.name} (${(file.size / 1024 / 1024).toFixed(2)}MB)`);

    const buffer = await file.arrayBuffer();
    const base64 = Buffer.from(buffer).toString('base64');
    const isVideo = file.type.startsWith('video/');

    if (!process.env.AI_GATEWAY_API_KEY) {
      console.warn(`[v0] [${requestId}] No AI_GATEWAY_API_KEY - using fallback`);
      return createFallback();
    }

    // Try each model
    for (const model of MODELS) {
      try {
        console.log(`[v0] [${requestId}] 🤖 Trying ${model.name}...`);

        const response = await fetch('https://ai-gateway.vercel.sh/v1/messages', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.AI_GATEWAY_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: model.id,
            max_tokens: 1500,
            temperature: 0.5,
            messages: [
              {
                role: 'user',
                content: [
                  {
                    type: isVideo ? 'video' : 'image',
                    source: {
                      type: 'base64',
                      media_type: file.type,
                      data: base64,
                    },
                  },
                  {
                    type: 'text',
                    text: ANALYSIS_PROMPT,
                  },
                ],
              },
            ],
          }),
        });

        if (!response.ok) {
          throw new Error(`${response.status}`);
        }

        const data = await response.json();
        const text = data.content?.[0]?.text;

        if (!text) {
          throw new Error('No response');
        }

        // Extract JSON
        const match = text.match(/\{[\s\S]*\}/);
        const json = JSON.parse(match ? match[0] : text);

        console.log(`[v0] [${requestId}] ✅ ${model.name} success`);

        return NextResponse.json({
          success: true,
          listing: json,
          model: model.name,
          requestId,
        });
      } catch (err) {
        console.warn(`[v0] [${requestId}] ${model.name} failed:`, 
          err instanceof Error ? err.message : String(err));
      }
    }

    console.error(`[v0] [${requestId}] All models failed`);
    return createFallback();
  } catch (error) {
    console.error(`[v0] [${requestId}] Error:`, error);
    return createFallback();
  }
}

function createFallback() {
  return NextResponse.json({
    success: true,
    listing: {
      productType: 'Product',
      brand: '',
      model: '',
      condition: 'Good',
      conditionDescription: 'Please review and complete details.',
      title: 'Product Listing',
      description: 'Complete product details based on your upload.',
      category: 'Other',
      suggestedPrice: 0,
      originalPrice: null,
      tags: ['pending-review'],
      confidence: 0,
      sellerName: null,
      sellerEmail: null,
      sellerPhone: null,
      sellerLocation: null,
      sellerCompany: null,
      notes: 'AI unavailable - fill manually',
    },
    model: 'fallback',
    warning: 'AI analysis not available',
  });
}
