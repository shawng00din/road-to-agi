let NetlifyBlobStore;

try {
  ({ NetlifyBlobStore } = require('@netlify/blobs'));
} catch (error) {
  console.warn("@netlify/blobs module not available locally - using fallback data");
}

const TIMELINE_KEY = 'timeline-data.json';

// Shared storage for local development
let localTimelineData = null;

// Sample data for local development if blobs module is not available
const LOCAL_FALLBACK_DATA = {
  timeline: [
    {
      id: "1950-turing-test-foundations",
      year: "1950",
      title: "Turing Test & Foundations",
      icon: "fas fa-calculator",
      players_concepts: ["Alan Turing"],
      details: "Alan Turing publishes \"Computing Machinery and Intelligence,\" proposing the Turing Test as a benchmark for machine intelligence and laying philosophical groundwork for AI.",
      quote: null,
      learn_more_links: [
        {
          text: "Turing Test",
          url: "https://en.wikipedia.org/wiki/Turing_test"
        }
      ]
    }
  ],
  metadata: {
    title: "The Road to AGI and Beyond",
    description: "An interactive timeline based on insights from the Artificial Intelligence Show podcast series and AI history.",
    lastUpdated: new Date().toISOString().split('T')[0]
  }
};

// Function to save local timeline data (for local development)
exports.saveLocalTimelineData = function(data) {
  localTimelineData = data;
  console.log("Local timeline data saved");
};

exports.handler = async function(event, context) {
  try {
    // If the module isn't available (local dev), try to use local data if available
    if (!NetlifyBlobStore) {
      // Use localTimelineData if it exists, otherwise use fallback
      if (localTimelineData) {
        console.log("Using locally saved timeline data");
        return {
          statusCode: 200,
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(localTimelineData)
        };
      }
      
      console.log("Using local fallback data for timeline (no saved data found)");
      return {
        statusCode: 200,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(LOCAL_FALLBACK_DATA)
      };
    }

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
    
    // If there's an error with blobs, return fallback data for local dev
    if (error.message && error.message.includes('@netlify/blobs')) {
      console.log("Using local fallback data after blob error");
      return {
        statusCode: 200,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(LOCAL_FALLBACK_DATA)
      };
    }
    
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