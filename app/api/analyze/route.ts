// main-site/app/api/listings/route.ts
import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:5000';
const AI_API_URL = process.env.AI_API_URL || 'http://localhost:3000/api/analyze';
const ZAPIER_WEBHOOK_URL = 'https://hooks.zapier.com/hooks/catch/26725705/ux4gb6x/';

// Helper function to send webhook notification
async function sendWebhookNotification(listingData: any, sellerData: any) {
  try {
    const payload = {
      // Seller information
      seller_name: sellerData.sellerName,
      seller_email: sellerData.sellerEmail,
      seller_phone: sellerData.sellerPhone,
      user_type: sellerData.userType,
      location: sellerData.location,
      
      // Product information
      product_title: listingData.title,
      product_description: listingData.description,
      product_category: listingData.category,
      product_brand: listingData.brand,
      product_condition: listingData.condition,
      product_price: listingData.price,
      product_discount: listingData.discount,
      product_edition: listingData.edition,
      
      // Delivery & payment
      delivery_type: listingData.deliveryType,
      payment_method: listingData.paymentMethod,
      
      // Metadata
      tags: listingData.tags,
      image_count: listingData.imageUrls?.length || 0,
      confidence_score: listingData.confidence,
      
      // Timestamp
      submitted_at: new Date().toISOString(),
      
      // Email content
      email_subject: `🎉 Your Uni-Mart listing "${listingData.title}" has been submitted!`,
      email_preview: `Thank you for listing with Uni-Mart! Your item is now live.`
    };

    console.log('📤 Sending webhook notification to Zapier...');

    // Don't await - fire and forget to not block the response
    fetch(ZAPIER_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }).catch(error => {
      console.error('❌ Webhook error (non-blocking):', error);
    });

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
      
      const aiResponse = await fetch(AI_API_URL, {
        method: 'POST',
        body: formData,
      });

      const aiData = await aiResponse.json();
      
      if (!aiResponse.ok) {
        throw new Error(aiData.error || 'AI analysis failed');
      }

      return NextResponse.json({
        success: true,
        type: 'ai-analysis',
        listing: aiData.listing,
        formTemplate: aiData.formTemplate
      });
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

      // After successful save, trigger webhook notification (non-blocking)
      const sellerData = {
        sellerName: body.sellerName,
        sellerEmail: body.sellerEmail,
        sellerPhone: body.sellerPhone,
        userType: body.userType || 'student',
        location: body.location
      };
      
      // Fire and forget - don't await
      sendWebhookNotification(body, sellerData);

      return NextResponse.json({
        success: true,
        type: 'submission',
        data: data.data,
        message: 'Listing saved successfully'
      });
    }
    
    else {
      return NextResponse.json(
        { error: 'Unsupported content type' },
        { status: 400 }
      );
    }

  } catch (error) {
    console.error('❌ Error:', error);
    return NextResponse.json(
      { 
        success: false, 




        error: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}

// Get listings (with optional filters)
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');
    const category = searchParams.get('category');
    const search = searchParams.get('search');
    
    let url = `${BACKEND_URL}/api/listings`;
    const params = new URLSearchParams();
    
    if (status) params.append('status', status);
    if (category) params.append('category', category);
    if (search) params.append('search', search);
    
    if (params.toString()) {
      url += `?${params.toString()}`;
    }

    const response = await fetch(url);
    const data = await response.json();

    return NextResponse.json(data);
  } catch (error) {
    console.error('❌ Error fetching listings:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch listings' },
      { status: 500 }
    );
  }
}

// Update listing status
export async function PATCH(req: NextRequest) {
  try {
    const { id, status } = await req.json();
    
    const response = await fetch(`${BACKEND_URL}/api/listings/${id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ status }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to update listing');
    }

    return NextResponse.json({ success: true, data: data.data });
  } catch (error) {
    console.error('❌ Error updating listing:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}