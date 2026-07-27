# Quick Start Guide - AI-Powered Seller Data Extraction

## 🚀 Get Started in 2 Minutes

### Step 1: Set Environment Variable

Add your AI Gateway API key:

```bash
# .env.local
AI_GATEWAY_API_KEY=sk_your_key_here
```

Get key from: [Vercel Dashboard](https://vercel.com/account/settings)

### Step 2: Start the App

```bash
npm install
npm run dev
```

Visit: `http://localhost:3000`

### Step 3: Try AI Mode

1. Click "Use AI to Auto-fill" button
2. Upload a video or image showing your product
3. Watch as AI extracts:
   - ✅ Product details (title, description, price, category)
   - ✅ Seller info (name, email, phone, location)
4. Review and adjust if needed
5. Submit!

---

## 📹 What the AI Extracts

### Product Details
- Product type/category
- Brand and model
- Condition (New, Like New, Good, Fair, Poor)
- Marketplace title
- Description
- Suggested price
- Relevant tags

### Seller Information (NEW)
- **Seller Name** - From nameplate, business card, or watermark
- **Seller Email** - From business card or watermark visible in video
- **Seller Phone** - If clearly visible
- **Seller Location** - From background, signs, or verbal mention

---

## 💡 Pro Tips

### For Best Results:
✅ Show product clearly from multiple angles  
✅ Have good lighting  
✅ If extracting seller info, show nameplate or business card  
✅ Keep video under 2 minutes for faster analysis  
✅ Use common products for higher accuracy  

### If Seller Info Not Extracted:
- Seller not visible on camera
- Poor video quality
- No nameplate/business card shown
- You can fill these fields manually - that's fine!

---

## 🎯 API Endpoint (for Developers)

```bash
POST /api/analyze-video
Content-Type: multipart/form-data

# Request:
video: <File object>

# Response:
{
  "success": true,
  "listing": {
    "title": "Sony Headphones - Like New",
    "description": "High-quality...",
    "category": "Electronics",
    "condition": "Like New",
    "suggestedPrice": 299,
    "sellerName": "John Smith",
    "sellerEmail": "john@example.com",
    "sellerPhone": "+234 812 345 6789",
    "sellerLocation": "Lagos",
    "tags": ["electronics", "headphones", "like-new"]
  },
  "model": "Gemini"
}
```

---

## 🔧 Troubleshooting

### "AI service not configured"
→ Add `AI_GATEWAY_API_KEY` to `.env.local`

### "Failed to analyze video"
→ Try a different video or check file size (<100MB)

### Seller info not auto-filled
→ Show nameplate/business card in video, or fill manually

### Slow analysis (>10 seconds)
→ Could be network or large file - try again

---

## 📚 Learn More

- [AI Integration Guide](./AI_INTEGRATION.md) - Complete setup & configuration
- [Implementation Summary](./IMPLEMENTATION_SUMMARY.md) - Technical details
- [Vercel AI Gateway](https://sdk.vercel.ai/docs/concepts/ai-gateway) - Provider docs

---

## ✨ Features

- 🎥 **Video Analysis** - Analyzes videos up to 100MB+
- 🖼️ **Image Support** - Works with photos too
- 🤖 **3 AI Models** - Gemini, Claude, Qwen (auto-fallback)
- 📝 **Auto-fill** - Fills title, description, price, category
- 👤 **Seller Extraction** - NEW: Auto-fills seller name, email, phone, location
- ⚡ **Fast** - Usually 2-5 seconds per analysis
- 💾 **Fallback** - Works without AI (manual entry)
- 🛡️ **Secure** - No data stored permanently

---

## 🆘 Need Help?

1. Check console logs (look for `[v0]` messages)
2. Review [AI_INTEGRATION.md](./AI_INTEGRATION.md)
3. Verify `AI_GATEWAY_API_KEY` is set
4. Try with different video/image
5. Check browser network tab for API errors

---

**Happy Listing! 🎉**
