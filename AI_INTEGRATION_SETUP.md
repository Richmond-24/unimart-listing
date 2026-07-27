# AI Integration Setup for UniMart Listing

## Overview

This project now has a fully working AI integration for transcribing videos and auto-filling seller details. The system uses **Google Gemini, Anthropic Claude, and Qwen models** via the **Vercel AI Gateway** with automatic fallback support.

## How It Works

### Video Upload & AI Analysis Flow

1. **User uploads video** → Lister component validates file
2. **API sends to `/api/analyze-video`** → Converts video to base64
3. **AI Gateway analyzes** with fallback strategy:
   - **Primary**: Google Gemini 2.0 Flash (fastest, best for images/video)
   - **Secondary**: Anthropic Claude 3.5 Sonnet (better text analysis)
   - **Tertiary**: Qwen Turbo (reliable fallback)
4. **AI extracts**:
   - Product details (title, description, category, condition, price)
   - Seller info (name, email, location, phone - if visible)
   - Transcription of spoken text
5. **Auto-fills form** with extracted data
6. **User reviews** and can edit any details

### Image Handling

Same process as video - first image is analyzed for seller info and product details if no video is provided.

## Environment Setup

### Required Environment Variables

```
AI_GATEWAY_API_KEY=your_api_key_here
GEMINI_API_KEY=optional_fallback_key   # For direct Gemini calls (optional)
```

**To get these:**
1. **AI Gateway Key**: Visit [Vercel AI Gateway](https://ai-gateway.vercel.sh) and create an API key
2. **Gemini API Key** (optional): Get from [Google AI Studio](https://makersuite.google.com/app/apikey)

### Add to Vercel Project

```bash
# Using Vercel CLI
vercel env add AI_GATEWAY_API_KEY
vercel env add GEMINI_API_KEY  # optional

# Or via Vercel Dashboard:
# Settings → Environment Variables
```

## Technical Details

### Files Modified/Created

- **`/app/api/analyze-video/route.ts`** - Main API endpoint for video/image analysis
  - Uses Vercel AI SDK with `@ai-sdk/openai` for AI Gateway support
  - Implements fallback model selection
  - Returns standardized JSON with seller info + product details

- **`/app/components/Lister.tsx`** - Updated video/image handlers
  - Replaced mock `mockRiriAI()` with real `analyzeVideoWithAI()` function
  - Auto-fills seller name/email from AI analysis
  - Shows "Auto-filled from video" badge when data is extracted

- **`/lib/video-analyzer.ts`** - Video frame extraction utilities
  - `extractVideoFrames()` - Extracts frames from video
  - `analyzeFrameWithGemini()` - Direct Gemini API calls (fallback)
  - `analyzeImagesForSellerInfo()` - Batch image analysis

- **`/lib/seller-extractor.ts`** - Seller data extraction helper
  - Structured prompts for seller info extraction
  - Maps API responses to form fields

### API Response Format

```json
{
  "success": true,
  "listing": {
    "title": "Product title",
    "description": "Product description",
    "category": "Product category",
    "condition": "Like New|Excellent|Good|Fair|Poor",
    "brand": "Brand name",
    "tags": ["tag1", "tag2"],
    "suggestedPrice": 99.99,
    "confidence": 85,
    "sellerName": "John Doe",
    "sellerEmail": "john@example.com",
    "sellerLocation": "New York",
    "sellerPhone": "+1-555-0123",
    "transcription": "Any spoken text from video"
  },
  "model": "Gemini|Claude|Qwen|fallback",
  "requestId": "abc123"
}
```

## Testing the Integration

### Manual Test

1. Start dev server: `npm run dev`
2. Navigate to http://localhost:3000
3. Click "Auto-Fill with RIRI AI"
4. Upload a video showing a product
5. Wait 5-10 seconds for analysis
6. Check if form auto-fills with:
   - Product title, description, price
   - Your seller name and email (if visible in video)

### Test with Sample Video

For testing without a real video:
```bash
# Create a minimal test video file
# Or use any mp4 file from your system
```

### Debugging

Check the browser console and server logs for:
- `[v0]` prefixed logs show frontend status
- API logs show which AI model succeeded
- Full response JSON shows extracted data

```bash
# View server logs
npm run dev 2>&1 | grep -E "\[v0\]|\[analyze\]"
```

## Features Enabled

✅ **Video Transcription** - Gemini extracts spoken content  
✅ **Auto-fill Product Details** - Title, description, category, condition, price  
✅ **Seller Auto-fill** - Name, email extracted from watermarks/text overlays  
✅ **Multi-Model Support** - Falls back through Gemini → Claude → Qwen  
✅ **Confidence Scoring** - AI reports confidence level (0-100)  
✅ **Graceful Degradation** - Manual entry if AI unavailable  

## Known Limitations

1. **Phone numbers**: Only extracted if clearly visible (for privacy/security)
2. **Email detection**: Accurate for business cards/watermarks
3. **Video length**: Process works best with videos under 100MB
4. **Language**: Optimized for English content

## Troubleshooting

### "AI service not properly configured"

**Solution**: Check `AI_GATEWAY_API_KEY` is set in environment variables
```bash
# Local testing
echo $AI_GATEWAY_API_KEY

# Production
vercel env list
```

### Video upload fails

**Check**:
- File size < 100MB
- Format is MP4, MOV, or WebM
- Browser console for error messages
- Server logs for API response

### No seller info extracted

**Possible causes**:
- Seller name/email not visible in video
- Poor video quality/lighting
- AI model confidence too low
- Text not clearly legible

**Solution**: Manually enter seller info - AI extracts what's visible in frame

### All AI models failing

This triggers fallback mode - user can still manually fill form. Check:
1. `AI_GATEWAY_API_KEY` is valid
2. API quota not exceeded
3. Network connectivity
4. Check `/api/analyze-video` endpoint directly

## Production Deployment

When deploying to Vercel:

1. Set environment variables in Vercel dashboard
2. Push code to connected branch
3. Vercel auto-deploys
4. Monitor logs for any API errors

```bash
# Deploy to staging
vercel deploy --prod

# View logs
vercel logs --follow
```

## Next Steps & Enhancements

- [ ] Add OCR for business card scanning
- [ ] Support multiple languages
- [ ] Add seller verification via email
- [ ] Implement image compression for faster uploads
- [ ] Add progress indicator for AI analysis
- [ ] Support drag-drop multiple videos
- [ ] Batch processing for multiple listings

## Support

For issues or questions:
1. Check browser console for client-side errors
2. View server logs for API errors
3. Test with `/api/analyze-video` endpoint directly
4. Enable debug logging in `Lister.tsx` with `[v0]` logs
