const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

exports.handler = async function(event, context) {
  // Only accept POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ message: 'Method Not Allowed' })
    };
  }

  try {
    // Parse the request body
    const requestData = JSON.parse(event.body);
    const { password } = requestData;

    // Check if the provided password matches the admin password
    if (!password || password !== ADMIN_PASSWORD) {
      return {
        statusCode: 401,
        body: JSON.stringify({ message: 'Invalid password' })
      };
    }

    // Password is correct
    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'Authentication successful' })
    };
  } catch (error) {
    console.error('Admin authentication error:', error);
    
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Internal Server Error', error: error.message })
    };
  }
}; 