/**
 * Seller Extractor - Uses Gemini AI to extract seller details from videos/images
 * Identifies seller name, email patterns, location, and other metadata
 */

import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

export interface SellerInfo {
  sellerName?: string;
  sellerEmail?: string;
  location?: string;
  phoneNumber?: string;
  confidence: number;
}

const SELLER_EXTRACTION_PROMPT = `You are an expert at extracting seller information from images and videos.
Analyze this image/video and extract any visible seller details such as:
- Seller name (from name tags, business cards, signs, watermarks, etc.)
- Email address (from visible business cards, watermarks, or text)
- Location (from background, signs, or context clues)
- Phone number (if visible)

Return ONLY a raw JSON object with these fields:
{
  "sellerName": "extracted name or null",
  "sellerEmail": "extracted email or null",
  "location": "extracted location or null",
  "phoneNumber": "extracted phone or null",
  "confidence": 0.85,
  "notes": "any additional context"
}

Be conservative with confidence scores. Only include information that is clearly visible or highly likely from context.
If no seller information is found, return all fields as null with confidence 0.`;

/**
 * Extract seller information from a base64 encoded image
 * @param base64 - Base64 encoded image
 * @param mimeType - Image MIME type
 * @returns Extracted seller information
 */
export async function extractSellerInfo(
  base64: string,
  mimeType: 'image/jpeg' | 'image/png' | 'image/webp' = 'image/jpeg'
): Promise<SellerInfo> {
  try {
    const result = await model.generateContent([
      { inlineData: { data: base64, mimeType } },
      SELLER_EXTRACTION_PROMPT,
    ]);

    const text = result.response.text().trim();
    const clean = text.replace(/^```json\s*/i, '').replace(/```\s*$/i, '').trim();
    const parsed = JSON.parse(clean);

    return {
      sellerName: parsed.sellerName || undefined,
      sellerEmail: parsed.sellerEmail || undefined,
      location: parsed.location || undefined,
      phoneNumber: parsed.phoneNumber || undefined,
      confidence: parsed.confidence || 0,
    };
  } catch (error) {
    console.error('[v0] Error extracting seller info:', error);
    return { confidence: 0 };
  }
}

/**
 * Extract seller info from multiple images and merge results
 * @param frames - Array of base64 encoded frames
 * @returns Merged seller information from all frames
 */
export async function extractSellerInfoFromFrames(
  frames: string[]
): Promise<SellerInfo> {
  if (!frames || frames.length === 0) {
    return { confidence: 0 };
  }

  const results: SellerInfo[] = [];

  // Analyze up to 2 frames for seller info
  for (const frame of frames.slice(0, 2)) {
    try {
      const info = await extractSellerInfo(frame);
      if (info.confidence > 0) {
        results.push(info);
      }
    } catch (error) {
      console.error('[v0] Error processing frame for seller info:', error);
    }
  }

  // Merge results - prefer highest confidence values
  const merged: SellerInfo = { confidence: 0 };

  for (const result of results) {
    if (result.sellerName && (!merged.sellerName || result.confidence > merged.confidence)) {
      merged.sellerName = result.sellerName;
    }
    if (result.sellerEmail && (!merged.sellerEmail || result.confidence > merged.confidence)) {
      merged.sellerEmail = result.sellerEmail;
    }
    if (result.location && (!merged.location || result.confidence > merged.confidence)) {
      merged.location = result.location;
    }
    if (result.phoneNumber && (!merged.phoneNumber || result.confidence > merged.confidence)) {
      merged.phoneNumber = result.phoneNumber;
    }
    merged.confidence = Math.max(merged.confidence, result.confidence || 0);
  }

  return merged;
}
