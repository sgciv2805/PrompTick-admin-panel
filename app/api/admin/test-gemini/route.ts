import { NextRequest, NextResponse } from 'next/server';

// Note: This is an admin-only interface running server-side
// In production, you should add proper authentication middleware

export async function POST(request: NextRequest) {

  try {
    const { geminiApiKey } = await request.json();

    if (!geminiApiKey) {
      return NextResponse.json({ error: 'Gemini API key required' }, { status: 400 });
    }

    console.log('Testing Gemini API with key:', geminiApiKey.substring(0, 10) + '...');

    // Test with a very simple request
    const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': geminiApiKey,
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: 'Say hello'
          }]
        }]
      }),
    });

    console.log('Gemini response status:', response.status);

    if (!response.ok) {
      const errorBody = await response.text();
      console.error('Gemini error:', errorBody);
      return NextResponse.json({
        success: false,
        error: `Gemini API error: ${response.status}`,
        details: errorBody
      }, { status: 400 });
    }

    const result = await response.json();
    console.log('Gemini success:', result);

    return NextResponse.json({
      success: true,
      response: result.candidates?.[0]?.content?.parts?.[0]?.text
    });

  } catch (error: any) {
    console.error('Test error:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}