const { NetlifyBlobStore } = require('@netlify/blobs');

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
const TIMELINE_KEY = 'timeline-data.json';

exports.handler = async function(event, context) {
  // Require POST method
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ message: 'Method Not Allowed' })
    };
  }

  try {
    // Parse the request body
    const requestData = JSON.parse(event.body);
    const { timelineData, password } = requestData;

    // Validate password
    if (!password || password !== ADMIN_PASSWORD) {
      return {
        statusCode: 401,
        body: JSON.stringify({ message: 'Unauthorized' })
      };
    }

    // Validate timeline data
    if (!timelineData || !timelineData.timeline || !Array.isArray(timelineData.timeline)) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: 'Invalid timeline data' })
      };
    }

    // Initialize the blob store
    const blobStore = new NetlifyBlobStore({
      siteID: context.site.id,
      namespace: 'roadToAGI',
      token: process.env.NETLIFY_BLOBS_TOKEN
    });

    // Save the timeline data
    await blobStore.set(TIMELINE_KEY, JSON.stringify(timelineData));

    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'Timeline data saved successfully' })
    };
  } catch (error) {
    console.error('Error saving timeline data:', error);
    
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Internal Server Error', error: error.message })
    };
  }
}; 