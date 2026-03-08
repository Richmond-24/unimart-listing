
// main-site/app/api/listings/route.ts
import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:5000';
const ZAPIER_WEBHOOK_URL = 'https://hooks.zapier.com/hooks/catch/26725705/ux4gb6x/';

const JUMIA_CATEGORIES = {
  electronics: {
    name: "Electronics",
    subcategories: ["Mobile Phones", "Computers", "TV & Audio", "Cameras", "Gaming"],
    fields: [
      { name: "brand", type: "text", placeholder: "e.g. Apple, Samsung, Dell" },
      { name: "model", type: "text", placeholder: "e.g. iPhone 13, Galaxy S22" },
      { name: "storage", type: "select", options: ["16GB", "32GB", "64GB", "128GB", "256GB", "512GB", "1TB"] },
      { name: "ram", type: "select", options: ["2GB", "4GB", "8GB", "16GB", "32GB"] },
      { name: "color", type: "text", placeholder: "e.g. Space Gray, Silver" },
      { name: "condition", type: "select", options: ["New", "Like New", "Good", "Fair"] }
    ]
  },
  fashion: {
    name: "Fashion",
    subcategories: ["Men's Clothing", "Women's Clothing", "Shoes", "Accessories"],
    fields: [
      { name: "brand", type: "text", placeholder: "e.g. Nike, Adidas, Zara" },
      { name: "size", type: "text", placeholder: "e.g. S, M, L, XL, 42" },
      { name: "color", type: "text", placeholder: "e.g. Black, Red, Blue" },
      { name: "material", type: "text", placeholder: "e.g. Cotton, Leather" },
      { name: "gender", type: "select", options: ["Men", "Women", "Unisex", "Kids"] },
      { name: "condition", type: "select", options: ["New with tags", "New without tags", "Like New", "Good"] }
    ]
  },
  books: {
    name: "Books",
    subcategories: ["Fiction", "Non-Fiction", "Textbooks", "Children's Books"],
    fields: [
      { name: "title", type: "text", placeholder: "Book title" },
      { name: "author", type: "text", placeholder: "Author name" },
      { name: "isbn", type: "text", placeholder: "ISBN number" },
      { name: "publisher", type: "text", placeholder: "Publisher" },
      { name: "edition", type: "text", placeholder: "e.g. 2nd Edition" },
      { name: "format", type: "select", options: ["Hardcover", "Paperback", "E-book"] },
      { name: "condition", type: "select", options: ["New", "Like New", "Good", "Fair"] }
    ]
  },
  home: {
    name: "Home & Furniture",
    subcategories: ["Furniture", "Kitchen", "Decor", "Bedding"],
    fields: [
      { name: "brand", type: "text", placeholder: "Brand name" },
      { name: "material", type: "text", placeholder: "e.g. Wood, Metal, Plastic" },
      { name: "color", type: "text", placeholder: "Color/finish" },
      { name: "dimensions", type: "text", placeholder: "e.g. 120x60x75 cm" },
      { name: "weight", type: "text", placeholder: "e.g. 15 kg" },
      { name: "condition", type: "select", options: ["New", "Like New", "Good", "Fair"] }
    ]
  },
  other: {
    name: "Other",
    subcategories: ["General"],
    fields: [
      { name: "title", type: "text", placeholder: "Product title" },
      { name: "brand", type: "text", placeholder: "Brand name" },
      { name: "description", type: "textarea", placeholder: "Product description" },
      { name: "condition", type: "select", options: ["New", "Like New", "Good", "Fair"] }
    ]
  }
};

// Helper function to clean and parse JSON from AI response
function parseAIResponse(content: string): any {
  try {
    const jsonMatch = content.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[1]);
    }
    
    // Try to find JSON object in the text
    const objectMatch = content.match(/\{[\s\S]*\}/);
    if (objectMatch) {
      let jsonStr = objectMatch[0];
      
      // Fix trailing commas (common in AI responses)
      jsonStr = jsonStr.replace(/,(\s*[}\]])/g, '$1');
      
      // Fix missing quotes around property names
      jsonStr = jsonStr.replace(/(\{|,)\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*:/g, '$1"$2":');
      
      return JSON.parse(jsonStr);
    }
  } catch (e) {
    console.log('Failed to parse JSON:', e);
  }
  
  throw new Error('No valid JSON found in response');
}

// Retry function for API calls
async function callWithRetry<T>(
  fn: () => Promise<T>,
  retries = 3,
  delay = 1000,
  backoff = 2
): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    if (retries === 0) throw error;
    
    console.log(`⏱️ Retrying... ${retries} attempts left. Waiting ${delay}ms`);
    await new Promise(resolve => setTimeout(resolve, delay));
    
    return callWithRetry(fn, retries - 1, delay * backoff, backoff);
  }
}

// Helper function to send webhook notification to Zapier
async function sendWebhookNotification(listingData: any, sellerData: any) {
  try {
    const payload = {
      seller_name: sellerData.sellerName,
      seller_email: sellerData.sellerEmail,
      seller_phone: sellerData.sellerPhone,
      user_type: sellerData.userType,
      location: sellerData.location,
      product_title: listingData.title,
      product_description: listingData.description,
      product_category: listingData.category,
      product_brand: listingData.brand,
      product_condition: listingData.condition,
      product_price: listingData.price,
      product_discount: listingData.discount,
      product_edition: listingData.edition,
      delivery_type: listingData.deliveryType,
      payment_method: listingData.paymentMethod,
      tags: listingData.tags,
      image_count: listingData.imageUrls?.length || 0,
      confidence_score: listingData.confidence,
      submitted_at: new Date().toISOString(),
      email_subject: `🎉 Your Uni-Mart listing "${listingData.title}" has been submitted!`,
      email_preview: `Thank you for listing with Uni-Mart! Your item is now live.`
    };

    console.log('📤 Sending webhook to Zapier...');

    // Fire and forget - don't await to avoid blocking
    fetch(ZAPIER_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    .then(response => response.text())
    .then(data => console.log('✅ Webhook sent successfully:', data))
    .catch(error => console.error('❌ Webhook error:', error));

    return { success: true };
  } catch (error) {
    console.error('❌ Webhook setup error:', error);
    return { success: false, error };
  }
}

// Handle AI analysis (POST with image) and listing submission (POST with JSON)
export async function POST(req: NextRequest) {
  try {
    const contentType = req.headers.get('content-type') || '';
    
    // Case 1: AI Analysis - FormData with image
    if (contentType.includes('multipart/form-data')) {
      console.log('📸 Processing image for AI analysis...');
      
      const formData = await req.formData();
      const imageFile = formData.get('image') as File | null;
      
      if (!imageFile) {
        return NextResponse.json(
          { success: false, error: 'No image file provided' },
          { status: 400 }
        );
      }

      // Validate file
      if (!imageFile.type.startsWith('image/')) {
        return NextResponse.json(
          { success: false, error: 'File must be an image' },
          { status: 400 }
        );
      }

      if (imageFile.size > 15 * 1024 * 1024) {
        return NextResponse.json(
          { success: false, error: 'Image size must be less than 15MB' },
          { status: 400 }
        );
      }

      // Check API key for AI analysis
      const apiKey = process.env.OPENROUTER_API_KEY;
      if (!apiKey) {
        return NextResponse.json({
          success: false,
          error: 'OPENROUTER_API_KEY not configured',
          message: 'Please add your OpenRouter API key to .env.local file'
        }, { status: 503 });
      }

      console.log('🔑 API Key present (first 4 chars):', apiKey.substring(0, 4) + '...');

      // Initialize OpenAI client for AI analysis with timeout
      const client = new OpenAI({
        baseURL: "https://openrouter.ai/api/v1",
        apiKey: apiKey,
        timeout: 30000, // 30 second timeout
        maxRetries: 3,
        defaultHeaders: {
          "HTTP-Referer": process.env.APP_URL || "http://localhost:3000",
          "X-Title": "Uni-Mart Lister",
        },
      });

      // Convert image to base64
      const bytes = await imageFile.arrayBuffer();
      const buffer = Buffer.from(bytes);
      const base64Image = buffer.toString('base64');
      const mimeType = imageFile.type;
      
      console.log('🖼️ Image converted, size:', buffer.length, 'bytes');

      // AI analysis prompt
      const prompt = `You are a Jumia product listing assistant. Analyze this product image and extract REAL visible information.

Look ONLY at the image itself. DO NOT use any external knowledge.

Extract these details if VISIBLE in the image and return them as a clean JSON object:

{
  "detectedCategory": "electronics/fashion/books/home/other",
  "extractedFields": {
    "title": "Product name exactly as shown",
    "brand": "Brand name if visible",
    "description": "Any visible text or features",
    "price": 0,
    "condition": "New/Like New/Good/Fair",
    "model": "Model number if visible",
    "storage": "Storage capacity if visible",
    "ram": "RAM size if visible",
    "color": "Color if visible",
    "size": "Size if visible",
    "material": "Material if visible",
    "author": "Author if book",
    "isbn": "ISBN if visible"
  },
  "confidence": 0.95
}

IMPORTANT: Return ONLY the JSON object, no markdown formatting.`;

      console.log('🤖 Calling OpenRouter API with model: qwen/qwen-vl-plus');

      // Use retry logic for the API call
      const completion = await callWithRetry(async () => {
        const result = await client.chat.completions.create({
          model: "qwen/qwen-vl-plus",
          messages: [
            {
              role: "user",
              content: [
                {
                  type: "image_url",
                  image_url: {
                    url: `data:${mimeType};base64,${base64Image}`,
                  },
                },
                {
                  type: "text",
                  text: prompt,
                },
              ],
            },
          ],
          temperature: 0.1,
          max_tokens: 1500,
        });
        return result;
      });

      console.log('✅ OpenRouter API call successful');

      const content = completion.choices[0]?.message?.content || '{}';
      console.log('📄 Raw response preview:', content.substring(0, 200) + '...');
      
      // Parse the extracted data
      let extractedData;
      try {
        extractedData = parseAIResponse(content);
        console.log('📊 Parsed data:', JSON.stringify(extractedData, null, 2).substring(0, 200) + '...');
      } catch (parseError) {
        console.error('❌ Failed to parse AI response:', parseError);
        return NextResponse.json({
          success: false,
          error: 'AI returned invalid data format',
          debug: content.substring(0, 200)
        }, { status: 500 });
      }

      // Get category template
      const category = extractedData.detectedCategory || 'other';
      const categoryTemplate = JUMIA_CATEGORIES[category as keyof typeof JUMIA_CATEGORIES] || JUMIA_CATEGORIES.other;

      // Prepare response for Lister component
      const response = {
        success: true,
        type: 'ai-analysis',
        listing: {
          ...extractedData.extractedFields,
          category: categoryTemplate.name,
          confidence: extractedData.confidence || 0.7,
          productType: category,
        },
        formTemplate: {
          category: category,
          fields: categoryTemplate.fields,
          subcategories: categoryTemplate.subcategories
        }
      };

      return NextResponse.json(response);
    }
    
    // Case 2: Listing Submission - JSON data
    else if (contentType.includes('application/json')) {
      console.log('📝 Submitting listing to backend...');
      
      const body = await req.json();
      
      // Validate required fields
      const required = ['sellerName', 'sellerEmail', 'title', 'description', 'category', 'condition', 'price'];
      const missing = required.filter(field => !body[field]);
      
      if (missing.length > 0) {
        return NextResponse.json({
          success: false,
          error: `Missing required fields: ${missing.join(', ')}`
        }, { status: 400 });
      }

      console.log('📤 Sending to backend:', BACKEND_URL);

      // Send to Express backend
      const backendResponse = await fetch(`${BACKEND_URL}/api/listings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      const data = await backendResponse.json();

      if (!backendResponse.ok) {
        throw new Error(data.error || 'Failed to save listing');
      }

      console.log('✅ Listing saved to backend');

      // 🔔 Send webhook notification (fire and forget)
      const sellerData = {
        sellerName: body.sellerName,
        sellerEmail: body.sellerEmail,
        sellerPhone: body.sellerPhone,
        userType: body.userType || 'student',
        location: body.location
      };
      
      // Don't await - let it run in background
      sendWebhookNotification(body, sellerData);

      return NextResponse.json({
        success: true,
        type: 'submission',
        data: data.data || data,
        message: 'Listing saved successfully. A confirmation email will be sent shortly.'
      });
    }
    
    else {
      return NextResponse.json(
        { success: false, error: 'Unsupported content type' },
        { status: 400 }
      );
    }

  } catch (error: any) {
    console.error('❌ Detailed Error:', {
      name: error.name,
      message: error.message,
      code: error.code,
      cause: error.cause,
      stack: error.stack
    });
    
    // Check if it's a network error
    if (error.code === 'ETIMEDOUT' || error.cause?.code === 'ETIMEDOUT') {
      return NextResponse.json({
        success: false,
        error: 'Connection to OpenRouter timed out. Please check your network and try again.',
        details: 'The request took too long to complete. This might be due to network issues or OpenRouter service being slow.'
      }, { status: 503 });
    }
    
    // Check if it's a DNS error
    if (error.code === 'ENOTFOUND' || error.cause?.code === 'ENOTFOUND') {
      return NextResponse.json({
        success: false,
        error: 'Could not resolve OpenRouter API domain. Please check your DNS settings.',
        details: 'Unable to connect to openrouter.ai. This might be a DNS issue.'
      }, { status: 503 });
    }
    
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error',
        details: error.cause?.message || 'No additional details'
      },
      { status: 500 }
    );
  }
}

// Get listings (for testing or admin)
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');
    const category = searchParams.get('category');
    
    let url = `${BACKEND_URL}/api/listings`;
    const params = new URLSearchParams();
    
    if (status) params.append('status', status);
    if (category) params.append('category', category);
    
    if (params.toString()) {
      url += `?${params.toString()}`;
    }

    console.log('📥 Fetching listings from:', url);

    const response = await fetch(url);
    const data = await response.json();

    return NextResponse.json({
      success: true,
      data: data.data || data,
      type: 'listings'
    });
  } catch (error) {
    console.error('❌ Error fetching listings:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch listings' },
      { status: 500 }
    );
  }
}