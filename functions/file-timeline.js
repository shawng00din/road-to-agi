const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);

// Constants
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin';
const DATA_FILE_PATH = path.join(__dirname, '..', 'data', 'timeline.json');

// Helper function to read the timeline data
async function getTimelineData() {
  try {
    // Check if file exists
    if (!fs.existsSync(DATA_FILE_PATH)) {
      console.log("Timeline data file not found, creating default");
      
      // Create default data
      const defaultData = {
        timeline: [],
        metadata: {
          title: "The Road to AGI and Beyond",
          description: "An interactive timeline based on insights from the Artificial Intelligence Show podcast series and AI history.",
          lastUpdated: new Date().toISOString().split('T')[0]
        }
      };
      
      // Make sure directory exists
      const dirPath = path.dirname(DATA_FILE_PATH);
      if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
      }
      
      // Write default data
      fs.writeFileSync(DATA_FILE_PATH, JSON.stringify(defaultData, null, 2), 'utf8');
      return defaultData;
    }
    
    // Read and parse the timeline data
    const data = fs.readFileSync(DATA_FILE_PATH, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error("Error reading timeline data:", error);
    throw error;
  }
}

// Helper function to save the timeline data
async function saveTimelineData(data) {
  try {
    // Update lastUpdated timestamp
    data.metadata.lastUpdated = new Date().toISOString().split('T')[0];
    
    // Format JSON with indentation for better readability
    const jsonData = JSON.stringify(data, null, 2);
    
    // Write to file
    fs.writeFileSync(DATA_FILE_PATH, jsonData, 'utf8');
    
    // Commit changes if in production
    if (process.env.NODE_ENV === 'production') {
      try {
        await commitChanges();
      } catch (commitError) {
        console.error("Warning: Failed to commit changes:", commitError);
        // Continue anyway since the data is saved
      }
    }
    
    return true;
  } catch (error) {
    console.error("Error saving timeline data:", error);
    throw error;
  }
}

// Helper function to commit changes to git
async function commitChanges() {
  try {
    // Get current timestamp for commit message
    const timestamp = new Date().toISOString();
    
    // Run git commands
    await execPromise('git add data/timeline.json');
    await execPromise(`git commit -m "Update timeline data - ${timestamp}"`);
    await execPromise('git push origin staging');
    
    console.log("Changes committed and pushed to Git");
    return true;
  } catch (error) {
    console.error("Error committing changes:", error);
    throw error;
  }
}

// Function to get the timeline data
async function getTimeline(event, context) {
  try {
    const timelineData = await getTimelineData();
    
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(timelineData)
    };
  } catch (error) {
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
}

// Function to save the entire timeline
async function saveTimeline(event, context) {
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

    // Save the timeline data
    await saveTimelineData(timelineData);

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
}

// Function to create a new milestone
async function createMilestone(event, context) {
  // Require POST method
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ message: 'Method Not Allowed' })
    };
  }

  try {
    console.log("Create milestone function called");
    
    // Parse the request body
    const requestData = JSON.parse(event.body);
    const { milestone, password } = requestData;
    
    console.log("Creating milestone:", milestone?.title);
    
    // Validate password
    if (!password || password !== ADMIN_PASSWORD) {
      console.log("Unauthorized - invalid password");
      return {
        statusCode: 401,
        body: JSON.stringify({ message: 'Unauthorized' })
      };
    }

    // Validate milestone data
    if (!milestone || !milestone.year || !milestone.title || !milestone.details) {
      console.log("Invalid milestone data:", milestone);
      return {
        statusCode: 400,
        body: JSON.stringify({ message: 'Invalid milestone data. Year, title, and details are required.' })
      };
    }

    // Generate ID if not provided
    if (!milestone.id) {
      // Generate slug from year and title
      const yearSlug = milestone.year.toLowerCase()
          .replace(/[^\w\s-]/g, '')
          .replace(/\s+/g, '-')
          .replace(/-+/g, '-')
          .replace(/^-+|-+$/g, '');
          
      const titleSlug = milestone.title.toLowerCase()
          .replace(/[^\w\s-]/g, '')
          .replace(/\s+/g, '-')
          .replace(/-+/g, '-')
          .replace(/^-+|-+$/g, '');
          
      milestone.id = `${yearSlug}-${titleSlug}`;
      console.log("Generated ID for milestone:", milestone.id);
    }

    // Set default values if not provided
    milestone.icon = milestone.icon || 'fas fa-lightbulb';
    milestone.players_concepts = milestone.players_concepts || [];
    milestone.learn_more_links = milestone.learn_more_links || [];
    
    // Get existing timeline data
    const timelineData = await getTimelineData();
    
    // Check if milestone with same ID already exists
    const existingIndex = timelineData.timeline.findIndex(m => m.id === milestone.id);
    
    if (existingIndex !== -1) {
      console.log("A milestone with ID", milestone.id, "already exists");
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
    timelineData.timeline.push(milestone);
    
    // Save the updated timeline data
    await saveTimelineData(timelineData);

    return {
      statusCode: 201,
      body: JSON.stringify({ 
        message: 'Milestone created successfully',
        milestone
      })
    };
  } catch (error) {
    console.error('Error creating milestone:', error);
    
    return {
      statusCode: 500,
      body: JSON.stringify({ 
        message: 'Internal Server Error', 
        error: error.message
      })
    };
  }
}

// Export the handler functions
exports.handler = async function(event, context) {
  const path = event.path;
  
  // Route based on path
  if (path.endsWith('/get-timeline')) {
    return await getTimeline(event, context);
  } else if (path.endsWith('/save-timeline')) {
    return await saveTimeline(event, context);
  } else if (path.endsWith('/create-milestone')) {
    return await createMilestone(event, context);
  }
  
  // Default response
  return {
    statusCode: 404,
    body: JSON.stringify({ message: 'Not Found' })
  };
}; 