// Use a fallback password for local development
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin';

exports.handler = async function(event, context) {
  // Only accept POST requests
  if (event.httpMethod !== 'POST') {
    console.log("Request method not allowed:", event.httpMethod);
    return {
      statusCode: 405,
      body: JSON.stringify({ message: 'Method Not Allowed' })
    };
  }

  try {
    console.log("Authentication attempt received");
    console.log("Expected password:", ADMIN_PASSWORD);
    console.log("Environment var present:", !!process.env.ADMIN_PASSWORD);
    
    // Parse the request body
    const requestData = JSON.parse(event.body);
    const { password } = requestData;
    
    console.log("Received password:", password);

    // Check if the provided password matches the admin password
    if (!password || password !== ADMIN_PASSWORD) {
      console.log("Authentication failed - password mismatch");
      console.log(`Password match check: '${password}' === '${ADMIN_PASSWORD}' is ${password === ADMIN_PASSWORD}`);
      return {
        statusCode: 401,
        body: JSON.stringify({ message: 'Invalid password' })
      };
    }

    console.log("Authentication successful");
    
    // Password is correct
    return {
      statusCode: 200,
      body: JSON.stringify({ 
        message: 'Authentication successful',
        note: process.env.ADMIN_PASSWORD ? '' : 'Using development password'
      })
    };
  } catch (error) {
    console.error('Admin authentication error:', error);
    
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Internal Server Error', error: error.message })
    };
  }
}; 