const OpenAI = require('openai');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

exports.handler = async function(event, context) {
  console.log('Function started - Received request');
  
  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    console.log('Error: Invalid HTTP method:', event.httpMethod);
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    console.log('Request body:', event.body);
    const { text, voice = 'alloy' } = JSON.parse(event.body);

    if (!text) {
      console.log('Error: No text provided in request');
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Text is required' })
      };
    }

    console.log('Processing request with:', {
      textLength: text.length,
      textPreview: text.substring(0, 100) + '...',
      voice: voice
    });

    // Verify API key
    if (!process.env.OPENAI_API_KEY) {
      console.log('Error: Missing OpenAI API key in environment');
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'OpenAI API key is not configured' })
      };
    }
    console.log('OpenAI API key verified (exists)');

    // Create speech using OpenAI API
    console.log('Calling OpenAI API...');
    const mp3 = await openai.audio.speech.create({
      model: 'tts-1',
      voice: voice,
      input: text,
    });
    console.log('OpenAI API call successful');

    // Convert the response to base64
    console.log('Converting audio to base64...');
    const buffer = Buffer.from(await mp3.arrayBuffer());
    const base64Audio = buffer.toString('base64');
    console.log('Audio conversion successful, base64 length:', base64Audio.length);

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        audio: base64Audio
      })
    };
  } catch (error) {
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    
    return {
      statusCode: 500,
      body: JSON.stringify({ 
        error: 'Failed to generate speech',
        details: error.message,
        type: error.name
      })
    };
  }
}; 