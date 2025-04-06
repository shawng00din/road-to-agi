let NetlifyBlobStore;
let getTimelineModule;

try {
  ({ NetlifyBlobStore } = require('@netlify/blobs'));
} catch (error) {
  console.warn("@netlify/blobs module not available locally - using fallback mechanism");
}

try {
  // Try to import the get-timeline module for local development
  getTimelineModule = require('./get-timeline');
} catch (error) {
  console.warn("Could not import get-timeline module - local data sharing will not work");
}

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin'; // Fallback password for local development
const TIMELINE_KEY = 'timeline-data.json';

// In-memory storage for local development

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

    // If NetlifyBlobStore is not available (local dev), try to share with get-timeline
    if (!NetlifyBlobStore) {
      console.log("Using local storage for timeline data");
      
      // If we have access to the get-timeline module, share the data
      if (getTimelineModule && typeof getTimelineModule.saveLocalTimelineData === 'function') {
        getTimelineModule.saveLocalTimelineData(timelineData);
        console.log("Timeline data shared with get-timeline module");
      } else {
        console.warn("Cannot share data with get-timeline - changes won't be visible until server restart");
      }
      
      return {
        statusCode: 200,
        body: JSON.stringify({ 
          message: 'Timeline data saved to local storage (development mode)',
          note: 'For full functionality, please restart the Netlify dev server'
        })
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
    
    // If there's an error with blobs, attempt local storage
    if (error.message && error.message.includes('@netlify/blobs')) {
      console.log("Using local storage after blob error");
      try {
        const requestData = JSON.parse(event.body);
        
        // Share data with get-timeline if possible
        if (getTimelineModule && typeof getTimelineModule.saveLocalTimelineData === 'function') {
          getTimelineModule.saveLocalTimelineData(requestData.timelineData);
          console.log("Timeline data shared with get-timeline module after error");
        }
        
        return {
          statusCode: 200,
          body: JSON.stringify({ 
            message: 'Timeline data saved to local storage (fallback mode)',
            note: 'For full functionality, please restart the Netlify dev server'
          })
        };
      } catch (localError) {
        console.error('Local storage fallback also failed:', localError);
      }
    }
    
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Internal Server Error', error: error.message })
    };
  }
}; 