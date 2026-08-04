
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

// Handle listing submission with file uploads to Blob
export async function POST(req: NextRequest) {
  try {
    const contentType = req.headers.get('content-type') || '';
    
    // Handle FormData with file uploads (new single-form submission)
    if (contentType.includes('multipart/form-data')) {
      console.log('📁 Processing form submission with file uploads...');
      
      const formData = await req.formData();
      
      // Get form fields
      const title = formData.get('title') as string;
      const description = formData.get('description') as string;
      const price = formData.get('price') as string;
      const category = formData.get('category') as string;
      const condition = formData.get('condition') as string;
      const sellerName = formData.get('sellerName') as string;
      const sellerEmail = formData.get('sellerEmail') as string;
      const deliveryMethod = formData.get('deliveryMethod') as string;
      const paymentMethod = formData.get('paymentMethod') as string;
      
      // Validate required fields
      if (!title || !description || !price || !category || !sellerName || !sellerEmail) {
        return NextResponse.json(
          { success: false, error: 'Missing required fields' },
          { status: 400 }
        );
      }

      // Get all image files
      const imageFiles = formData.getAll('images') as File[];
      const videoFile = formData.get('video') as File | null;
      
      if (!imageFiles || imageFiles.length === 0) {
        return NextResponse.json(
          { success: false, error: 'At least one image is required' },
          { status: 400 }
        );
      }

      // Validate image files
      const uploadedImageUrls: string[] = [];
      
      for (const imageFile of imageFiles) {
        // Validate file type
        if (!imageFile.type.startsWith('image/')) {
          return NextResponse.json(
            { success: false, error: 'All files must be valid images' },
            { status: 400 }
          );
        }

        // Validate file size (max 10MB per file)
        if (imageFile.size > 10 * 1024 * 1024) {
          return NextResponse.json(
            { success: false, error: 'Image size must be less than 10MB' },
            { status: 400 }
          );
        }
      }

      // Upload images to Blob (if Blob token is available)
      const blobToken = process.env.BLOB_READ_WRITE_TOKEN;
      if (blobToken) {
        try {
          for (const imageFile of imageFiles) {
            const bytes = await imageFile.arrayBuffer();
            const response = await fetch('https://blob.vercel-storage.com/upload', {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${blobToken}`,
              },
              body: bytes,
            });
            
            if (response.ok) {
              const data = await response.json();
              uploadedImageUrls.push(data.url);
              console.log('✅ Image uploaded to Blob:', data.url);
            }
          }
        } catch (blobError) {
          console.error('❌ Blob upload error:', blobError);
          // Continue anyway, we'll still process the listing
        }
      }

      // Upload video to Blob if present
      let uploadedVideoUrl = '';
      if (videoFile && blobToken) {
        try {
          if (videoFile.type.startsWith('video/') && videoFile.size <= 100 * 1024 * 1024) {
            const videoBytes = await videoFile.arrayBuffer();
            const videoResponse = await fetch('https://blob.vercel-storage.com/upload', {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${blobToken}`,
              },
              body: videoBytes,
            });
            
            if (videoResponse.ok) {
              const videoData = await videoResponse.json();
              uploadedVideoUrl = videoData.url;
              console.log('✅ Video uploaded to Blob:', videoData.url);
            }
          }
        } catch (videoError) {
          console.error('❌ Video upload error:', videoError);
        }
      }

      // Send webhook notification
      const listingData = {
        title,
        description,
        price: parseFloat(price),
        category,
        condition,
        deliveryMethod,
        paymentMethod,
        imageUrls: uploadedImageUrls,
        videoUrl: uploadedVideoUrl || undefined,
      };

      const sellerData = {
        sellerName,
        sellerEmail,
      };

      // Send notification via webhook
      const webhookResult = await sendWebhookNotification(listingData, sellerData);
      
      if (!webhookResult.success) {
        console.warn('⚠️ Webhook notification failed:', webhookResult.error);
        // Don't fail the listing just because webhook failed
      }

      // Return success response with listing data
      return NextResponse.json({
        success: true,
        message: 'Listing created successfully',
        listing: {
          title,
          price,
          category,
          imageUrls: uploadedImageUrls,
        },
      }, { status: 201 });
      
    } else {
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
