// app/api/test-openrouter/route.ts
import { NextResponse } from 'next/server';

export async function GET() {
  const apiKey = process.env.OPENROUTER_API_KEY;
  
  if (!apiKey) {
    return NextResponse.json({ error: 'No API key found' }, { status: 400 });
  }

  const results: any = {
    apiKeyPresent: true,
    apiKeyPrefix: apiKey.substring(0, 10) + '...',
    tests: []
  };

  // Test 1: Simple text-only request
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'http://localhost:3000',
      },
      body: JSON.stringify({
        model: 'openrouter/free', // Use free model for testing
        messages: [
          {
            role: 'user',
            content: 'Say "OpenRouter is working!" if you receive this message.'
          }
        ],
        max_tokens: 50,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    results.tests.push({
      name: 'Simple text request',
      success: response.ok,
      status: response.status,
      statusText: response.statusText
    });

    if (response.ok) {
      const data = await response.json();
      results.textResponse = data.choices[0].message.content;
    } else {
      const error = await response.text();
      results.textError = error;
    }

  } catch (error: any) {
    results.tests.push({
      name: 'Simple text request',
      success: false,
      error: error.message,
      code: error.code
    });
  }

  // Test 2: Check available models
  try {
    const response = await fetch('https://openrouter.ai/api/v1/models', {
      headers: {
        'Authorization': `Bearer ${apiKey}`
      }
    });

    if (response.ok) {
      const data = await response.json();
      results.modelsAvailable = data.data?.length || 0;
      results.freeModels = data.data
        ?.filter((m: any) => m.id.includes('free') || m.id.includes('llama'))
        .map((m: any) => m.id)
        .slice(0, 5);
    }
  } catch (error: any) {
    results.modelsError = error.message;
  }

  return NextResponse.json(results);
}