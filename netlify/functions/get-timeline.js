const { NetlifyBlobStore } = require('@netlify/blobs');

const TIMELINE_KEY = 'timeline-data.json';

exports.handler = async function(event, context) {
  try {
    // Initialize the blob store
    const blobStore = new NetlifyBlobStore({
      siteID: context.site.id,
      namespace: 'roadToAGI',
      token: process.env.NETLIFY_BLOBS_TOKEN
    });

    // Check if timeline data exists
    const exists = await blobStore.exists(TIMELINE_KEY);
    
    if (!exists) {
      // Return empty timeline structure if no data exists yet
      return {
        statusCode: 200,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          timeline: [],
          metadata: {
            title: 'The Road to AGI and Beyond',
            description: 'An interactive timeline based on insights from the Artificial Intelligence Show podcast series and AI history.',
            lastUpdated: new Date().toISOString().split('T')[0]
          }
        })
      };
    }

    // Get the timeline data
    const timelineData = await blobStore.get(TIMELINE_KEY, { type: 'json' });

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(timelineData)
    };
  } catch (error) {
    console.error('Error retrieving timeline data:', error);
    
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ 
        message: 'Error retrieving timeline data', 
        error: error.message 
      })
    };
  }
}; 