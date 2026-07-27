# AI Integration Guide - UniMart Listing

## Overview

This application now includes a complete AI-powered video and image analysis system that automatically extracts product details and seller information for marketplace listings.

**Features:**
- 🎥 Video/Image Upload & Analysis
- 🤖 Multi-Model AI Support (Claude, Gemini, Qwen)
- 📝 Auto-fill Product Details (title, description, category, price, condition)
- 👤 Auto-extract Seller Information (name, email, phone, location)
- ⚡ Fallback Support (works offline with manual entry)

## AI Models Supported

The system uses **Vercel AI Gateway** to access multiple AI models:

1. **Google Gemini 2.0 Flash** - Fast, excellent for multimodal (primary)
2. **Anthropic Claude 3.5 Sonnet** - High quality, detailed analysis (fallback 1)
3. **Alibaba Qwen Turbo** - Cost-effective option (fallback 2)

Models are tried in order; if one fails, the next is attempted automatically.

## Setup & Configuration

### 1. Get AI Gateway Access

The app uses **Vercel AI Gateway**, which provides unified access to multiple AI models.

**Option A: Vercel Deployment (Recommended)**
- When deployed to Vercel, authentication happens automatically via OIDC
- No manual setup needed

**Option B: Local Development**
1. Get an AI Gateway API key from Vercel
2. Add to your `.env.local`:
   ```bash
   AI_GATEWAY_API_KEY=your_key_here
   ```

### 2. Environment Variables

Add to `.env.local` or project settings:

```bash
# Required for AI analysis
AI_GATEWAY_API_KEY=sk-...

# Optional (for specific providers if not using AI Gateway)
GEMINI_API_KEY=your_google_key    # For direct Gemini access
ANTHROPIC_API_KEY=your_claude_key # For direct Claude access
```

### 3. Install Dependencies

Already included:
```bash
npm install ai @google/generative-ai
```

## How It Works

### Frontend Flow

1. **User uploads video/image** via the "AI Mode" option
2. **Lister component** sends file to `/api/analyze-video`
3. **AI analysis returns**:
   - Product details (title, description, category, price, condition)
   - Seller information (name, email, phone, location)
4. **Form auto-fills** with extracted information
5. **User reviews & adjusts** details as needed
6. **Submit listing**

### Backend Flow

**File: `/app/api/analyze-video/route.ts`**

```
1. Receive video/image file
2. Convert to Base64
3. Try Gemini → Claude → Qwen (in order)
4. Send to AI Gateway with analysis prompt
5. Parse JSON response
6. Return structured data to frontend
7. Fallback to empty form if all models fail
```

## API Response Format

```json
{
  "success": true,
  "listing": {
    "productType": "Electronics",
    "brand": "Sony",
    "model": "WH-1000XM5",
    "condition": "Like New",
    "conditionDescription": "...",
    "title": "Sony WH-1000XM5 Headphones - Like New",
    "description": "High-quality noise-cancelling headphones...",
    "category": "Electronics",
    "suggestedPrice": 299,
    "originalPrice": 399,
    "tags": ["headphones", "wireless", "noise-cancelling"],
    "confidence": 0.92,
    "sellerName": "John Seller",
    "sellerEmail": "john@example.com",
    "sellerPhone": "+234 812 345 6789",
    "sellerLocation": "Lagos, Nigeria",
    "sellerCompany": "Tech Resellers Ltd"
  },
  "model": "Gemini",
  "requestId": "abc123"
}
```

## Seller Information Extraction

The AI analyzes videos/images looking for:

- **Name**: From nameplates, business cards, watermarks, or introduction
- **Email**: From business cards or watermarks visible in the video
- **Phone**: If clearly visible on signs or business cards
- **Location**: From background scenery, signs, or verbal mention
- **Company**: Business name from signage or watermarks

## Troubleshooting

### Issue: "AI service not properly configured"

**Solution**: 
- Check `AI_GATEWAY_API_KEY` is set in environment variables
- Verify the key is correct
- For Vercel deployment, ensure environment variable is added in project settings

### Issue: Analysis returns empty/fallback data

**Possible causes**:
1. `AI_GATEWAY_API_KEY` not set (falls back gracefully)
2. Video file too large (max 100MB recommended)
3. AI models experiencing issues (tries all 3 models)
4. Unsupported video format

**Solutions**:
- Compress video to <100MB
- Use MP4, MOV, or WebM format
- Try uploading again (one model might have been temporarily unavailable)
- Fall back to manual entry

### Issue: Seller information not extracted

**Likely reasons**:
- Seller details not clearly visible in video
- No nameplate, business card, or watermark visible
- Video quality too poor
- Seller not visible on camera

**Solution**: The user can manually enter seller details in the form

### Issue: Product details seem inaccurate

**Possible causes**:
1. Poor video quality
2. Product not clearly visible
3. Complex product with multiple variations

**Solution**: 
- User reviews and corrects auto-filled details
- Re-upload better quality video if needed

## Usage in Frontend

### Lister Component

The `app/components/Lister.tsx` component handles:

```typescript
// Analyzes video and returns extracted data
const aiData = await analyzeVideoWithAI(file);

// Auto-fills form with results
setFormData(prev => ({
  ...prev,
  ...aiData,
  sellerName: aiData.sellerName || prev.sellerName,
  sellerEmail: aiData.sellerEmail || prev.sellerEmail,
}));
```

## Advanced Configuration

### Adjust AI Behavior

Edit `/app/api/analyze-video/route.ts`:

```typescript
// Modify the analysis prompt
const ANALYSIS_PROMPT = `Your custom prompt here...`;

// Add/remove models
const MODELS = [
  { name: 'Gemini', id: 'google/gemini-2.0-flash' },
  { name: 'Claude', id: 'anthropic/claude-3-5-sonnet' },
  // Add more models as needed
];

// Adjust temperature (0-1, higher = more creative)
temperature: 0.5,

// Adjust max tokens (higher = longer response)
max_tokens: 1500,
```

### Using Alternative Providers

If you want to use specific AI providers directly instead of AI Gateway:

1. **Google Gemini** (direct):
   ```typescript
   import { GoogleGenerativeAI } from '@google/generative-ai';
   ```

2. **Claude** (direct):
   ```bash
   npm install @anthropic-ai/sdk
   ```

3. **Qwen** (direct):
   ```bash
   npm install dashscope
   ```

## Performance Notes

- **First request**: May take 2-5 seconds for AI analysis
- **Subsequent requests**: Similar timing (each request is independent)
- **Video processing**: Larger files may take longer
- **Model selection**: Gemini is usually fastest; Claude provides best accuracy

## Security & Privacy

- Videos/images are sent to AI Gateway servers for analysis
- Data is processed according to each provider's privacy policy
- No data is stored permanently after analysis
- Use HTTPS only in production
- Keep `AI_GATEWAY_API_KEY` secret

## Future Enhancements

Potential improvements:

1. **Caching** - Cache analyses for identical videos
2. **Batch Processing** - Analyze multiple videos at once
3. **Custom Models** - Fine-tune for specific product categories
4. **Audio Transcription** - Extract seller information from speech
5. **Quality Scoring** - Rate video/image quality and suggest improvements
6. **Price Comparison** - Cross-reference prices with market data

## Support & Issues

For issues:

1. Check that `AI_GATEWAY_API_KEY` is properly set
2. Verify video/image file is not corrupted
3. Try with a different video format
4. Check browser console for error messages
5. Review server logs at `/app/api/analyze-video/route.ts`

## References

- [Vercel AI Gateway Docs](https://sdk.vercel.ai/docs/concepts/ai-gateway)
- [Gemini API Docs](https://ai.google.dev/)
- [Claude API Docs](https://docs.anthropic.com/)
- [Qwen API Docs](https://dashscope.aliyun.com/)
