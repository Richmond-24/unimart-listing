import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const ZAPIER_WEBHOOK_URL = process.env.ZAPIER_WEBHOOK_URL || 'https://hooks.zapier.com/hooks/catch/26725705/ux4gb6x/';

    const testPayload = {
      test: true,
      timestamp: new Date().toISOString(),
      message: 'Testing Zapier webhook connection from Uni-Mart',
      email_subject: '🧪 Zapier Connection Test - Uni-Mart',
      email_body: `Test email sent at ${new Date().toISOString()}`,
    };

    console.log('🔌 [ZAPIER-TEST] Sending test payload to:', ZAPIER_WEBHOOK_URL);
    console.log('📦 [ZAPIER-TEST] Payload:', testPayload);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    const response = await fetch(ZAPIER_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Uni-Mart-Zapier-Test/1.0',
      },
      body: JSON.stringify(testPayload),
      signal: controller.signal,
    }).catch((err) => {
      clearTimeout(timeoutId);
      console.error('❌ [ZAPIER-TEST] Fetch error:', err.message);
      return null;
    });

    clearTimeout(timeoutId);

    if (!response) {
      return NextResponse.json(
        {
          success: false,
          error: 'Webhook request timed out or failed',
          url: ZAPIER_WEBHOOK_URL,
          message: 'Check if Zapier webhook URL is correct and Zapier is online',
        },
        { status: 500 }
      );
    }

    const responseText = await response.text();

    console.log('✅ [ZAPIER-TEST] Response status:', response.status);
    console.log('✅ [ZAPIER-TEST] Response body:', responseText);

    return NextResponse.json(
      {
        success: true,
        status: response.status,
        message: 'Zapier webhook is connected and responding ✅',
        url: ZAPIER_WEBHOOK_URL,
        response: responseText.substring(0, 200),
        timestamp: new Date().toISOString(),
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('❌ [ZAPIER-TEST] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
