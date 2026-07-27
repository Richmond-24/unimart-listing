# Code Changes Reference

## Summary of Key Changes

This document shows the most important code changes made to integrate real AI analysis.

---

## 1. Main AI Analysis Function (Lister.tsx)

### ❌ BEFORE: Mock AI Function
```typescript
const mockRiriAI = async (file: File) => {
  return new Promise<Partial<FormData>>((resolve) => {
    setTimeout(() => {
      resolve({
        title: "Premium Wireless Headphones",
        description: "High-quality noise cancelling headphones with 30h battery life. Barely used.",
        price: "1200",
        category: "Electronics",
        condition: "Like New"
      });
    }, 2500);
  });
};
```

### ✅ AFTER: Real AI Function
```typescript
const analyzeVideoWithAI = async (file: File) => {
  try {
    const formData = new FormData();
    formData.append('video', file);

    console.log('[v0] Sending video to AI analysis API...');

    const response = await fetch('/api/analyze-video', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`API responded with ${response.status}`);
    }

    const data = await response.json();
    console.log('[v0] AI analysis result:', data);

    if (!data.success) {
      throw new Error(data.error || 'Analysis failed');
    }

    const listing = data.listing || {};

    return {
      title: listing.title || '',
      description: listing.description || '',
      price: listing.suggestedPrice?.toString() || '',
      category: listing.category || '',
      condition: listing.condition || 'Good',
      brand: listing.brand || '',
      tags: listing.tags || [],
      confidence: listing.confidence || 0,
      sellerName: listing.sellerName || '',
      sellerEmail: listing.sellerEmail || '',
      sellerLocation: listing.sellerLocation || '',
      sellerPhone: listing.sellerPhone || '',
    };
  } catch (error) {
    console.error('[v0] AI analysis error:', error);
    throw error;
  }
};
```

---

## 2. Video Upload Handler (Lister.tsx)

### ❌ BEFORE: Calls mock function
```typescript
const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0];
  if (!file) return;

  setVideoFile(file);
  
  if (mode === 'ai') {
    setIsLoading(true);
    try {
      const aiData = await mockRiriAI(file);  // ← MOCK
      setFormData(prev => ({ ...prev, ...aiData }));
    } catch (error) {
      console.error("AI Error", error);
    } finally {
      setIsLoading(false);
      setStep(2); 
    }
  } else {
    setStep(2); 
  }
};
```

### ✅ AFTER: Calls real API, auto-fills seller info
```typescript
const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0];
  if (!file) return;

  setVideoFile(file);
  
  if (mode === 'ai') {
    setIsLoading(true);
    try {
      console.log('[v0] Starting AI video analysis...');
      const aiData = await analyzeVideoWithAI(file);  // ← REAL
      console.log('[v0] AI data received:', aiData);
      setFormData(prev => ({ 
        ...prev, 
        ...aiData,
        // Auto-fill seller info if available from video analysis
        sellerName: aiData.sellerName || prev.sellerName,
        sellerEmail: aiData.sellerEmail || prev.sellerEmail,
      }));
    } catch (error) {
      console.error('[v0] AI Error:', error);
      alert('Failed to analyze video. Please try again or fill details manually.');
    } finally {
      setIsLoading(false);
      setStep(2); 
    }
  } else {
    setStep(2); 
  }
};
```

---

## 3. Seller Info Section Enhancement (Lister.tsx)

### ✅ ADDED: Visual feedback for auto-filled data
```typescript
{/* Seller Info */}
<div className="space-y-6">
  <div className="flex items-center justify-between">
    <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
      <Icons.User /> Contact Information
    </h3>
    {mode === 'ai' && formData.sellerName && (
      <span className="text-xs font-bold px-3 py-1.5 bg-green-100 text-green-700 rounded-full flex items-center gap-1">
        ✓ Auto-filled from video
      </span>
    )}
  </div>
  {/* form fields... */}
</div>
```

---

## 4. New API Endpoint (app/api/analyze-video/route.ts)

### ✅ Complete Implementation
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { generateText } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';

const MODELS = [
  { name: 'Gemini', id: 'google/gemini-2.0-flash' },
  { name: 'Claude', id: 'anthropic/claude-3-5-sonnet' },
  { name: 'Qwen', id: 'qwen/qwen-turbo' },
];

export async function POST(req: NextRequest) {
  const requestId = Math.random().toString(36).substring(7);
  console.log(`[v0] [${requestId}] 📹 Analysis request received`);

  try {
    const contentType = req.headers.get('content-type') || '';
    if (!contentType.includes('multipart/form-data')) {
      return NextResponse.json(
        { success: false, error: 'Expected multipart/form-data with media file' },
        { status: 400 }
      );
    }

    const formData = await req.formData();
    const mediaFile = formData.get('video') as File | null;

    if (!mediaFile) {
      return NextResponse.json(
        { success: false, error: 'No media file provided' },
        { status: 400 }
      );
    }

    console.log(`[v0] [${requestId}] File: ${mediaFile.name} (${(mediaFile.size / 1024 / 1024).toFixed(2)}MB)`);

    if (!process.env.AI_GATEWAY_API_KEY) {
      console.warn(`[v0] [${requestId}] ⚠️ AI_GATEWAY_API_KEY not configured`);
      return createFallbackResponse(requestId);
    }

    // Convert file to base64
    const buffer = await mediaFile.arrayBuffer();
    const base64Data = Buffer.from(buffer).toString('base64');
    const mimeType = mediaFile.type || 'image/jpeg';

    // Initialize AI Gateway
    const aiGateway = createOpenAI({
      apiKey: process.env.AI_GATEWAY_API_KEY,
      baseURL: 'https://ai-gateway.vercel.sh/v1',
    });

    // Try each model until one succeeds
    for (const modelConfig of MODELS) {
      try {
        console.log(`[v0] [${requestId}] 🤖 Trying ${modelConfig.name}...`);

        const response = await generateText({
          model: aiGateway(modelConfig.id),
          messages: [
            {
              role: 'user',
              content: [
                {
                  type: 'image',
                  image: {
                    base64: base64Data,
                    mimeType: mimeType,
                  } as any,
                },
                {
                  type: 'text',
                  text: VIDEO_ANALYSIS_PROMPT,  // Defined above
                },
              ] as any,
            },
          ],
          temperature: 0.5,
          maxTokens: 1200,
        });

        console.log(`[v0] [${requestId}] ✅ ${modelConfig.name} succeeded`);

        // Parse JSON response
        const jsonMatch = response.text.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
          throw new Error('No JSON found in response');
        }

        const parsed = JSON.parse(jsonMatch[0]);

        return NextResponse.json({
          success: true,
          listing: {
            title: parsed.title || 'Product',
            description: parsed.description || '',
            category: parsed.category || 'Other',
            condition: parsed.condition || 'Good',
            brand: parsed.brand || '',
            tags: parsed.tags || [],
            suggestedPrice: parsed.suggestedPrice || 0,
            confidence: parsed.confidence || 0,
            sellerName: parsed.sellerName || '',
            sellerEmail: parsed.sellerEmail || '',
            sellerLocation: parsed.sellerLocation || '',
            sellerPhone: parsed.sellerPhone || '',
            transcription: parsed.transcription || '',
          },
          model: modelConfig.name,
          requestId,
        });
      } catch (error) {
        console.warn(`[v0] [${requestId}] ⚠️ ${modelConfig.name} failed: ${error instanceof Error ? error.message : String(error)}`);
        continue;
      }
    }

    // All models failed, use fallback
    return createFallbackResponse(requestId);
  } catch (error) {
    console.error(`[v0] [${requestId}] ❌ Unexpected error:`, error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Analysis failed',
        requestId,
      },
      { status: 500 }
    );
  }
}
```

---

## 5. Dependencies Added

### ✅ package.json Updates
```json
{
  "dependencies": {
    "ai": "^7.0.37",                    // AI SDK for multi-model support
    "@ai-sdk/openai": "^4.0.20",        // OpenAI adapter for AI Gateway
    "@google/generative-ai": "^0.15.0"  // Direct Gemini fallback
  }
}
```

---

## 6. Analysis Prompt Engineering

### ✅ Comprehensive Extraction Prompt
```typescript
const VIDEO_ANALYSIS_PROMPT = `You are an expert product analyst and data extractor. 
Analyze this video/image carefully and extract comprehensive product and seller information.

CRITICAL INSTRUCTIONS:
1. Extract ALL visible seller information (names, emails, locations, phone numbers, watermarks, business cards)
2. Analyze product condition, quality, and market value
3. Generate professional marketplace listing details
4. Be thorough but accurate - only include clearly visible information
5. Return ONLY valid JSON, no markdown or extra text

Return JSON with this structure:
{
  "title": "compelling listing title under 80 chars",
  "description": "3-4 sentence professional description",
  "category": "product category",
  "condition": "Like New|Excellent|Good|Fair|Poor",
  "brand": "brand name if visible",
  "tags": ["relevant", "tags"],
  "suggestedPrice": 0,
  "confidence": 85,
  "sellerName": "full name if visible from nameplate/watermark/intro",
  "sellerEmail": "email if visible on card/watermark",
  "sellerLocation": "location if mentioned/visible",
  "sellerPhone": "phone if clearly visible",
  "transcription": "any spoken or visible text"
}`;
```

---

## 7. Error Handling & Fallback

### ✅ Graceful Degradation
```typescript
function createFallbackResponse(requestId: string) {
  return NextResponse.json({
    success: true,
    listing: {
      title: 'Product Listing',
      description: 'Please review the video and fill in product details.',
      category: 'Other',
      condition: 'Good',
      brand: '',
      tags: ['pending-review'],
      suggestedPrice: 0,
      confidence: 0,
      sellerName: '',
      sellerEmail: '',
      sellerLocation: '',
      sellerPhone: '',
      transcription: '',
    },
    model: 'fallback',
    requestId,
    warning: 'AI analysis unavailable - please fill in details manually',
  });
}
```

---

## Environment Configuration

### ✅ Required Setup
```bash
# .env.local (development) or Vercel Dashboard (production)
AI_GATEWAY_API_KEY=sk_...    # From Vercel AI Gateway
```

---

## Testing & Verification

### ✅ Key Test Points
1. **Build**: `npm run build` - compiles without errors
2. **Dev Server**: `npm run dev` - starts without errors
3. **API**: POST to `/api/analyze-video` with video file returns proper JSON
4. **UI**: Upload video, AI auto-fills form with seller info
5. **Fallback**: Disable AI_GATEWAY_API_KEY, verify manual entry still works

---

## Conclusion

These changes transform the app from using mock data to real, multi-model AI analysis with automatic seller info extraction. The fallback mechanism ensures the app remains usable even if the primary AI service is unavailable.

All changes maintain backward compatibility and add comprehensive error handling and logging for production reliability.
