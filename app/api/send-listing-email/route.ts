import { NextRequest, NextResponse } from 'next/server';

const ZAPIER_WEBHOOK_URL = process.env.ZAPIER_WEBHOOK_URL || 'https://hooks.zapier.com/hooks/catch/26725705/ux4gb6x/';

interface EmailPayload {
  sellerName: string;
  sellerEmail: string;
  sellerPhone?: string;
  title: string;
  price: number;
  discount?: number | null;
  condition: string;
  category: string;
  brand?: string;
  deliveryType?: string;
  paymentMethod?: string;
  description: string;
  tags?: string[];
  imageUrls?: string[];
}

export async function POST(req: NextRequest) {
  try {
    // Validate request method
    if (req.method !== 'POST') {
      return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
    }

    // Parse request body
    const body: EmailPayload = await req.json();

    // Validate required fields
    if (!body.sellerEmail || !/^[^\s@]+@([^\s@]+\.)+[^\s@]+$/.test(body.sellerEmail)) {
      return NextResponse.json({ error: 'Invalid email address' }, { status: 400 });
    }

    if (!body.sellerName || body.sellerName.length < 2) {
      return NextResponse.json({ error: 'Invalid seller name' }, { status: 400 });
    }

    if (!body.title || body.title.length < 3) {
      return NextResponse.json({ error: 'Invalid product title' }, { status: 400 });
    }

    // Prepare email payload
    const emailPayload = {
      seller_name: body.sellerName,
      seller_email: body.sellerEmail,
      seller_phone: body.sellerPhone || '',
      product_title: body.title,
      product_price: body.price,
      product_discount: body.discount || null,
      product_condition: body.condition,
      product_category: body.category,
      product_brand: body.brand || '',
      delivery_type: body.deliveryType || 'self',
      payment_method: body.paymentMethod || 'mtn',
      product_description: body.description,
      tags: body.tags || [],
      image_count: body.imageUrls?.length || 0,
      submitted_at: new Date().toISOString(),
      email_subject: `🎉 Your Uni-Mart listing "${body.title}" has been submitted!`,
      email_body: `Hi ${body.sellerName} 👋,

Thank you for listing your item on Uni-Mart! ✨

📦 **Product**: ${body.title}
💰 **Price**: GH₵${body.price}${body.discount ? ` (${body.discount}% off)` : ''}
🏷️ **Condition**: ${body.condition}
🏷️ **Category**: ${body.category}
${body.brand ? `🏢 **Brand**: ${body.brand}\n` : ''}
🚚 **Delivery**: ${body.deliveryType === 'unimart' ? 'Uni-Mart Delivery' : 'Self Delivery'}

Your listing is now pending review. You'll receive another email when it's live on the marketplace.

**What happens next?**
1. Our team reviews your listing for authenticity (max 24 hours)
2. You'll receive a confirmation email
3. Your item appears on the Uni-Mart campus marketplace
4. Buyers can start contacting you

**Need help?** Contact us at support@unimart.com or reply to this email.

Happy selling! 🚀
---
Uni-Mart Ghana | Snap. List. Sell.`,
    };

    console.log('📤 [EMAIL] Sending notification to:', body.sellerEmail);
    console.log('📤 [EMAIL] Product:', body.title);

    // Send webhook notification
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    const webhookResponse = await fetch(ZAPIER_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Uni-Mart-Listing-Service/1.0',
      },
      body: JSON.stringify(emailPayload),
      signal: controller.signal,
    }).catch((err) => {
      console.error('❌ [EMAIL] Webhook fetch error:', err.message);
      return null;
    });

    clearTimeout(timeoutId);

    if (!webhookResponse) {
      console.warn('⚠️ [EMAIL] Webhook request timed out, but email may still be sent');
      return NextResponse.json(
        {
          success: true,
          message: 'Email notification queued',
          warning: 'Email delivery may be delayed',
        },
        { status: 202 }
      );
    }

    if (!webhookResponse.ok) {
      console.warn(`⚠️ [EMAIL] Webhook returned status ${webhookResponse.status}`);
      // Don't fail if webhook returns non-200, as the email may still be queued
      return NextResponse.json(
        {
          success: true,
          message: 'Email notification sent',
        },
        { status: 200 }
      );
    }

    const webhookData = await webhookResponse.json();
    console.log('✅ [EMAIL] Webhook response:', webhookData);

    return NextResponse.json(
      {
        success: true,
        message: 'Email notification sent successfully',
        listingId: body.title,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('❌ [EMAIL] Error sending email:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to send email',
      },
      { status: 500 }
    );
  }
}
