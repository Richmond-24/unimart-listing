
// app/api/listings/route.ts
import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

// ==================== TYPES ====================

interface ListingResponse {
  id?: string;
  sellerName: string;
  sellerEmail: string;
  title: string;
  description: string;
  price: number;
  discount: number | null;
  category: string;
  condition: string;
  brand?: string;
  imageUrls?: string[];
  tags?: string[];
  status: string;
  createdAt: string;
  updatedAt: string;
}

// ==================== WEBHOOK CONFIGURATION ====================

const ZAPIER_WEBHOOK_URL = 'https://hooks.zapier.com/hooks/catch/26725705/ux4gb6x/';

// ==================== ENCRYPTION ====================

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY;
const API_SECRET = process.env.API_SECRET;

function encryptSensitiveData(data: string): string | null {
  if (!data || !ENCRYPTION_KEY) return null;
  try {
    const iv = crypto.randomBytes(16);
    const key = Buffer.from(ENCRYPTION_KEY, 'hex');
    const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
    const encrypted = Buffer.concat([cipher.update(data, 'utf8'), cipher.final()]);
    const authTag = cipher.getAuthTag();
    return Buffer.concat([iv, authTag, encrypted]).toString('base64');
  } catch {
    return null;
  }
}

function maskSensitiveData(data: any): any {
  if (!data) return data;
  const masked = { ...data };
  if (masked.sellerPhone) {
    masked.sellerPhone = masked.sellerPhone.replace(/\d(?=\d{4})/g, '*');
  }
  if (masked.sellerEmail && masked.sellerEmail.includes('@')) {
    const [local, domain] = masked.sellerEmail.split('@');
    masked.sellerEmail = `${local.substring(0, 2)}***@${domain}`;
  }
  return masked;
}

function sanitizeInput(input: any): any {
  if (typeof input === 'string') {
    return input.replace(/[<>]/g, '').trim().slice(0, 5000);
  }
  return input;
}

// ==================== RATE LIMITING ====================

const rateLimit = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const limit = rateLimit.get(ip);
  
  if (!limit || now > limit.resetAt) {
    rateLimit.set(ip, { count: 1, resetAt: now + 60 * 1000 });
    return true;
  }
  
  if (limit.count >= 10) {
    return false;
  }
  
  limit.count++;
  rateLimit.set(ip, limit);
  return true;
}

// ==================== WEBHOOK FUNCTION ====================

async function sendWebhookNotification(listingData: any, sellerData: any): Promise<boolean> {
  try {
    console.log('📤 [WEBHOOK] Sending notification...');
    console.log('📤 [WEBHOOK] To:', sellerData.sellerEmail);
    console.log('📤 [WEBHOOK] Product:', listingData.title);
    
    const payload = {
      // Seller information
      seller_name: sellerData.sellerName,
      seller_email: sellerData.sellerEmail,
      seller_phone: sellerData.sellerPhone || '',
      user_type: sellerData.userType || 'student',
      location: sellerData.location || '',
      
      // Product information
      product_title: listingData.title,
      product_description: listingData.description,
      product_category: listingData.category,
      product_brand: listingData.brand || '',
      product_condition: listingData.condition,
      product_price: listingData.price,
      product_discount: listingData.discount,
      product_edition: listingData.edition || '',
      
      // Delivery & payment
      delivery_type: listingData.deliveryType || 'self',
      payment_method: listingData.paymentMethod || 'mtn',
      
      // Metadata
      tags: listingData.tags || [],
      image_count: listingData.imageUrls?.length || 0,
      confidence_score: listingData.confidence || 0,
      authenticity_score: listingData.authenticityScore || 0,
      is_fake: listingData.isFake || false,
      
      // Timestamp
      submitted_at: new Date().toISOString(),
      
      // Email content
      email_subject: `🎉 Your Uni-Mart listing "${listingData.title}" has been submitted!`,
      email_body: `Hi ${sellerData.sellerName} 👋,

Thank you for listing your item on Uni-Mart!

📦 Product: ${listingData.title}
💰 Price: GH₵${listingData.price}
🏷️ Condition: ${listingData.condition}

Your listing is now pending review. You'll receive another email when it's live.

Need help? Contact us at support@unimart.com

Happy selling! 🚀`
    };

    // Send webhook with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);
    
    const response = await fetch(ZAPIER_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(payload),
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    const responseText = await response.text();
    console.log('📥 [WEBHOOK] Status:', response.status);
    console.log('📥 [WEBHOOK] Response:', responseText);
    
    if (response.ok) {
      console.log('✅ [WEBHOOK] Sent successfully!');
      return true;
    } else {
      console.error('❌ [WEBHOOK] Failed with status:', response.status);
      return false;
    }
    
  } catch (error: any) {
    console.error('❌ [WEBHOOK] Error:', error.message);
    if (error.name === 'AbortError') {
      console.error('⏱️ [WEBHOOK] Timeout');
    }
    return false;
  }
}

// ==================== MAIN HANDLER ====================

export async function POST(req: NextRequest) {
  try {
    // Rate limiting
    const ip = req.headers.get('x-forwarded-for') || 'unknown';
    if (!checkRateLimit(ip)) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
    }
    
    const body = await req.json();
    const { action } = body;
    const authHeader = req.headers.get('authorization');
    
    // ==================== CREATE LISTING ====================
    if (action === 'create') {
      // Validate
      if (!body.sellerName || body.sellerName.length < 2) {
        return NextResponse.json({ error: 'Name must be at least 2 characters' }, { status: 400 });
      }
      if (!body.sellerEmail || !/^[^\s@]+@([^\s@]+\.)+[^\s@]+$/.test(body.sellerEmail)) {
        return NextResponse.json({ error: 'Invalid email' }, { status: 400 });
      }
      if (!body.title || body.title.length < 3) {
        return NextResponse.json({ error: 'Title must be at least 3 characters' }, { status: 400 });
      }
      if (!body.description || body.description.length < 10) {
        return NextResponse.json({ error: 'Description must be at least 10 characters' }, { status: 400 });
      }
      if (!body.price || body.price < 0 || body.price > 100000) {
        return NextResponse.json({ error: 'Invalid price' }, { status: 400 });
      }
      
      // Prepare data
      const listing: ListingResponse = {
        id: crypto.randomBytes(8).toString('hex'),
        sellerName: sanitizeInput(body.sellerName),
        sellerEmail: body.sellerEmail.toLowerCase().trim(),
        title: sanitizeInput(body.title),
        description: sanitizeInput(body.description),
        category: sanitizeInput(body.category) || 'Other',
        condition: sanitizeInput(body.condition) || 'Good',
        price: body.price,
        discount: body.discount || null,
        brand: body.brand ? sanitizeInput(body.brand) : undefined,
        imageUrls: body.imageUrls || [],
        tags: body.tags ? body.tags.slice(0, 12) : [],
        status: 'pending',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      // Prepare seller data for webhook
      const sellerData = {
        sellerName: listing.sellerName,
        sellerEmail: listing.sellerEmail,
        sellerPhone: body.sellerPhone,
        userType: body.userType || 'student',
        location: body.location
      };
      
      // In production, save to MongoDB Atlas here
      // await db.listings.insertOne(listing);
      
      // 🔔 SEND WEBHOOK NOTIFICATION (fire and forget - don't await)
      sendWebhookNotification(listing, sellerData).catch(err => {
        console.error('Webhook error (non-blocking):', err);
      });
      
      // Send masked response
      return NextResponse.json({
        success: true,
        data: maskSensitiveData(listing),
        message: 'Listing created, pending review',
        webhookTriggered: true
      });
    }
    
    // ==================== ADMIN GET LISTINGS ====================
    if (action === 'adminGetListings') {
      // Verify admin
      if (!authHeader || authHeader !== `Bearer ${API_SECRET}`) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      
      const { id } = body;
      
      if (id) {
        // Get single listing with decrypted data
        return NextResponse.json({
          success: true,
          data: { id, message: 'Fetch from database' }
        });
      }
      
      // Get all listings
      return NextResponse.json({
        success: true,
        data: []
      });
    }
    
    // ==================== PUBLIC GET LISTINGS ====================
    if (action === 'getListings') {
      const { page = 1, limit = 20, filters = {} } = body;
      
      return NextResponse.json({
        success: true,
        data: [],
        pagination: { page, limit, total: 0, pages: 0 }
      });
    }
    
    // ==================== TEST WEBHOOK ====================
    if (action === 'testWebhook') {
      const testResult = await sendWebhookNotification(
        { title: 'Test Product', price: 99.99, condition: 'Good', description: 'Test' },
        { sellerName: 'Test User', sellerEmail: body.email || 'test@example.com' }
      );
      
      return NextResponse.json({
        success: testResult,
        message: testResult ? 'Webhook test sent' : 'Webhook test failed'
      });
    }
    
    // ==================== UPDATE LISTING ====================
    if (action === 'update') {
      if (!authHeader || authHeader !== `Bearer ${API_SECRET}`) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      
      const { id, ...updates } = body;
      if (!id) {
        return NextResponse.json({ error: 'Listing ID required' }, { status: 400 });
      }
      
      return NextResponse.json({
        success: true,
        message: 'Listing updated'
      });
    }
    
    // ==================== DELETE LISTING ====================
    if (action === 'delete') {
      if (!authHeader || authHeader !== `Bearer ${API_SECRET}`) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      
      const { id } = body;
      if (!id) {
        return NextResponse.json({ error: 'Listing ID required' }, { status: 400 });
      }
      
      return NextResponse.json({
        success: true,
        message: 'Listing deleted'
      });
    }
    
    return NextResponse.json({ 
      error: 'Invalid action',
      validActions: ['create', 'getListings', 'adminGetListings', 'update', 'delete', 'testWebhook']
    }, { status: 400 });
    
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Disable GET
export async function GET() {
  return NextResponse.json({ 
    error: 'Method not allowed',
    validActions: ['create', 'getListings', 'adminGetListings', 'update', 'delete', 'testWebhook']
  }, { status: 405 });
}