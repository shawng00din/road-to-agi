let NetlifyBlobStore;

try {
  console.log("Loading @netlify/blobs module");
  ({ NetlifyBlobStore } = require('@netlify/blobs'));
  console.log("Successfully loaded @netlify/blobs module");
} catch (error) {
  console.warn("@netlify/blobs module not available locally - using fallback mechanism", error);
}

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin'; // Fallback password for local development
const TIMELINE_KEY = 'timeline-data.json';

console.log("Module initialization complete");
console.log("ADMIN_PASSWORD available:", !!process.env.ADMIN_PASSWORD);
console.log("Using fallback password:", !process.env.ADMIN_PASSWORD);

// Sample initial timeline data structure
const INITIAL_TIMELINE = {
  timeline: [],
  metadata: {
    title: "The Road to AGI and Beyond",
    description: "An interactive timeline based on insights from the Artificial Intelligence Show podcast series and AI history.",
    lastUpdated: new Date().toISOString().split('T')[0]
  }
};

// Generate a slug from text
function generateSlug(text) {
  return text.toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// Generate an ID from year and title
function generateId(year, title) {
  const yearSlug = generateSlug(year);
  const titleSlug = generateSlug(title);
  return `${yearSlug}-${titleSlug}`;
}

exports.handler = async function(event, context) {
  console.log("=== CREATE MILESTONE FUNCTION INVOKED ===");
  console.log("HTTP Method:", event.httpMethod);
  console.log("Context details:", {
    clientContext: !!context.clientContext,
    identity: !!context.identity,
    siteID: context.site?.id || "Not available"
  });
  
  // Require POST method
  if (event.httpMethod !== 'POST') {
    console.log("Method not allowed:", event.httpMethod);
    return {
      statusCode: 405,
      body: JSON.stringify({ message: 'Method Not Allowed' })
    };
  }

  try {
    console.log("Create milestone function called");
    
    // Parse the request body
    console.log("Parsing request body");
    console.log("Raw body:", event.body.substring(0, 200) + "...");
    
    const requestData = JSON.parse(event.body);
    console.log("Request data parsed successfully");
    console.log("Password provided:", !!requestData.password);
    console.log("Milestone data provided:", !!requestData.milestone);
    
    const { milestone, password } = requestData;
    
    console.log("Creating milestone:", {
      title: milestone?.title,
      year: milestone?.year,
      id: milestone?.id || "Will be generated",
      hasDetails: !!milestone?.details,
      playersCount: milestone?.players_concepts?.length || 0,
      linksCount: milestone?.learn_more_links?.length || 0
    });
    
    // Validate password
    console.log("Validating password");
    console.log("Expected password:", ADMIN_PASSWORD.substring(0, 3) + "***");
    console.log("Password match:", password === ADMIN_PASSWORD);
    
    if (!password || password !== ADMIN_PASSWORD) {
      console.log("Unauthorized - invalid password");
      return {
        statusCode: 401,
        body: JSON.stringify({ message: 'Unauthorized' })
      };
    }

    // Validate milestone data
    console.log("Validating milestone data");
    const validationIssues = [];
    if (!milestone) validationIssues.push("No milestone data provided");
    if (milestone && !milestone.year) validationIssues.push("Missing year");
    if (milestone && !milestone.title) validationIssues.push("Missing title");
    if (milestone && !milestone.details) validationIssues.push("Missing details");
    
    console.log("Validation issues:", validationIssues.length ? validationIssues : "None");
    
    if (!milestone || !milestone.year || !milestone.title || !milestone.details) {
      console.log("Invalid milestone data:", milestone);
      return {
        statusCode: 400,
        body: JSON.stringify({ message: 'Invalid milestone data. Year, title, and details are required.' })
      };
    }

    // Generate ID if not provided
    if (!milestone.id) {
      console.log("Generating ID from year and title");
      milestone.id = generateId(milestone.year, milestone.title);
      console.log("Generated ID for milestone:", milestone.id);
    } else {
      console.log("Using provided ID:", milestone.id);
    }

    // Set default values if not provided
    console.log("Setting default values if not provided");
    const hadIcon = !!milestone.icon;
    const hadPlayers = !!milestone.players_concepts && milestone.players_concepts.length > 0;
    const hadLinks = !!milestone.learn_more_links && milestone.learn_more_links.length > 0;
    
    milestone.icon = milestone.icon || 'fas fa-lightbulb';
    milestone.players_concepts = milestone.players_concepts || [];
    milestone.learn_more_links = milestone.learn_more_links || [];
    
    console.log("Default values set:", {
      iconAdded: !hadIcon,
      playersArrayCreated: !hadPlayers,
      linksArrayCreated: !hadLinks
    });
    
    // If local development or missing token, return success with warning
    console.log("Checking for NetlifyBlobStore and token");
    console.log("NetlifyBlobStore available:", !!NetlifyBlobStore);
    console.log("NETLIFY_BLOBS_TOKEN present:", !!process.env.NETLIFY_BLOBS_TOKEN);
    
    if (!NetlifyBlobStore || !process.env.NETLIFY_BLOBS_TOKEN) {
      console.log("Local development mode or missing Netlify Blobs token");
      return {
        statusCode: 200,
        body: JSON.stringify({ 
          message: 'Milestone created in development mode (not saved to persistent storage)',
          milestone
        })
      };
    }

    // Initialize the blob store
    console.log("Initializing blob store");
    const siteID = context.site?.id || process.env.NETLIFY_SITE_ID || 'dda06506-bfc3-48fe-bc0a-eb39914fe31e';
    console.log("Site ID source:", context.site?.id ? "context" : (process.env.NETLIFY_SITE_ID ? "env variable" : "hardcoded"));
    console.log("Using site ID:", siteID);
    console.log("Token for blob store:", process.env.NETLIFY_BLOBS_TOKEN ? "Present (not shown)" : "Missing");
    
    const blobStore = new NetlifyBlobStore({
      siteID,
      namespace: 'roadToAGI',
      token: process.env.NETLIFY_BLOBS_TOKEN
    });
    console.log("Blob store initialized successfully");

    // Check if timeline data exists
    console.log("Checking if timeline data exists in blob store");
    let exists = false;
    try {
      exists = await blobStore.exists(TIMELINE_KEY);
      console.log("Timeline data exists check successful:", exists);
    } catch (error) {
      console.error("Error checking if timeline data exists:", error);
      throw new Error(`Failed to check if timeline exists: ${error.message}`);
    }
    
    // Get existing timeline data or create new
    let timelineData;
    
    if (exists) {
      console.log("Retrieving existing timeline data");
      try {
        timelineData = await blobStore.get(TIMELINE_KEY, { type: 'json' });
        console.log("Retrieved timeline with", timelineData.timeline.length, "milestones");
        console.log("Timeline metadata:", timelineData.metadata);
      } catch (error) {
        console.error("Error retrieving timeline data:", error);
        throw new Error(`Failed to retrieve timeline data: ${error.message}`);
      }
    } else {
      console.log("No existing timeline found, creating new timeline data structure");
      timelineData = INITIAL_TIMELINE;
      console.log("Created new timeline structure");
    }

    // Check if milestone with same ID already exists
    console.log("Checking for existing milestone with same ID");
    const existingIndex = timelineData.timeline.findIndex(m => m.id === milestone.id);
    console.log("Existing milestone found:", existingIndex !== -1);
    
    if (existingIndex !== -1) {
      console.log("A milestone with ID", milestone.id, "already exists");
      console.log("Existing milestone:", timelineData.timeline[existingIndex]);
      return {
        statusCode: 409,
        body: JSON.stringify({ 
          message: 'A milestone with this ID already exists. Use update-milestone to modify it.',
          existingMilestone: timelineData.timeline[existingIndex]
        })
      };
    }

    // Add the new milestone
    console.log("Adding new milestone to timeline");
    const previousLength = timelineData.timeline.length;
    timelineData.timeline.push(milestone);
    console.log("New timeline length:", timelineData.timeline.length, "(was", previousLength, ")");
    
    // Update the last updated date
    console.log("Updating lastUpdated date");
    const previousDate = timelineData.metadata.lastUpdated;
    timelineData.metadata.lastUpdated = new Date().toISOString().split('T')[0];
    console.log("Updated lastUpdated from", previousDate, "to", timelineData.metadata.lastUpdated);

    // Save the updated timeline data
    console.log("Saving updated timeline data to blob store");
    try {
      await blobStore.set(TIMELINE_KEY, JSON.stringify(timelineData));
      console.log("Timeline data saved successfully to blob store");
    } catch (error) {
      console.error("Error saving timeline data:", error);
      throw new Error(`Failed to save timeline data: ${error.message}`);
    }

    console.log("Create milestone operation completed successfully");
    return {
      statusCode: 201,
      body: JSON.stringify({ 
        message: 'Milestone created successfully',
        milestone
      })
    };
  } catch (error) {
    console.error('Error creating milestone:', error);
    console.error('Error stack:', error.stack);
    
    return {
      statusCode: 500,
      body: JSON.stringify({ 
        message: 'Internal Server Error', 
        error: error.message,
        stack: error.stack
      })
    };
  }
}; 