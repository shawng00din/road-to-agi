const OpenAI = require('openai');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

exports.handler = async function(event, context) {
  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    console.log('Function invoked with event:', JSON.stringify(event.body));
    
    const { text, voice = 'alloy' } = JSON.parse(event.body);

    if (!text) {
      console.log('Error: No text provided');
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Text is required' })
      };
    }

    console.log('Making OpenAI API request with:', { text: text.substring(0, 50) + '...', voice });

    // Verify API key is present
    if (!process.env.OPENAI_API_KEY) {
      console.log('Error: OpenAI API key is not configured');
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'OpenAI API key is not configured' })
      };
    }

    // Create speech using OpenAI API
    const mp3 = await openai.audio.speech.create({
      model: 'tts-1',
      voice: voice,
      input: text,
    });

    // Convert the response to base64
    const buffer = Buffer.from(await mp3.arrayBuffer());
    const base64Audio = buffer.toString('base64');

    console.log('Successfully generated speech');

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
    console.error('Detailed error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ 
        error: 'Failed to generate speech',
        details: error.message,
        stack: error.stack
      })
    };
  }
}; 