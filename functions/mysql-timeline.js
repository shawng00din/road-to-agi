const db = require('./db');

// Constants
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin';

// Function to get the timeline data
async function getTimeline(event, context) {
  try {
    console.log("Getting timeline data from MySQL");
    
    // Initialize database on first request
    await db.initializeDatabase();
    
    // Get timeline data
    const timelineData = await db.getTimelineData();
    
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(timelineData)
    };
  } catch (error) {
    console.error('Error getting timeline data:', error);
    
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
    console.log("Saving timeline data to MySQL");
    
    // Parse the request body
    const requestData = JSON.parse(event.body);
    const { timelineData, password } = requestData;

    // Validate password
    if (!password || password !== ADMIN_PASSWORD) {
      console.log("Unauthorized - invalid password");
      return {
        statusCode: 401,
        body: JSON.stringify({ message: 'Unauthorized' })
      };
    }

    // Validate timeline data
    if (!timelineData || !timelineData.timeline || !Array.isArray(timelineData.timeline)) {
      console.log("Invalid timeline data:", timelineData);
      return {
        statusCode: 400,
        body: JSON.stringify({ message: 'Invalid timeline data' })
      };
    }

    // Initialize database if needed
    await db.initializeDatabase();
    
    // Save the timeline data
    await db.saveTimelineData(timelineData);

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
    console.log("Create milestone function called (MySQL)");
    
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
    
    // Initialize database if needed
    await db.initializeDatabase();
    
    // Get existing timeline data to check for duplicates
    const timelineData = await db.getTimelineData();
    
    // Check if milestone with same ID already exists
    const existingMilestone = timelineData.timeline.find(m => m.id === milestone.id);
    
    if (existingMilestone) {
      console.log("A milestone with ID", milestone.id, "already exists");
      return {
        statusCode: 409,
        body: JSON.stringify({ 
          message: 'A milestone with this ID already exists. Use update-milestone to modify it.',
          existingMilestone
        })
      };
    }

    // Create the new milestone
    await db.createMilestone(milestone);

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

// Import data from existing JSON file
async function importData(event, context) {
  // Require POST method
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ message: 'Method Not Allowed' })
    };
  }

  try {
    console.log("Import timeline data function called");
    
    // Parse the request body
    const requestData = JSON.parse(event.body);
    const { password, filePath } = requestData;
    
    // Validate password
    if (!password || password !== ADMIN_PASSWORD) {
      console.log("Unauthorized - invalid password");
      return {
        statusCode: 401,
        body: JSON.stringify({ message: 'Unauthorized' })
      };
    }

    // Default to data/timeline.json if no path provided
    const dataPath = filePath || 'data/timeline.json';
    
    // Initialize database
    await db.initializeDatabase();
    
    // Import data from JSON file
    await db.importFromJSON(dataPath);

    return {
      statusCode: 200,
      body: JSON.stringify({ 
        message: 'Timeline data imported successfully',
        source: dataPath
      })
    };
  } catch (error) {
    console.error('Error importing timeline data:', error);
    
    return {
      statusCode: 500,
      body: JSON.stringify({ 
        message: 'Internal Server Error', 
        error: error.message
      })
    };
  }
}

// Function to test the database connection
async function testDatabase(event, context) {
  try {
    console.log("Testing database connection");
    
    // Test the connection
    const connected = await db.testConnection();
    
    if (connected) {
      // Initialize schema
      await db.initializeDatabase();
      
      // Get row counts
      const [timelineResult] = await db.pool.query('SELECT COUNT(*) as count FROM timeline');
      const [metadataResult] = await db.pool.query('SELECT COUNT(*) as count FROM timeline_metadata');
      
      return {
        statusCode: 200,
        body: JSON.stringify({ 
          message: 'Database connection successful',
          timelineCount: timelineResult[0].count,
          metadataCount: metadataResult[0].count,
          database: 'dbwkp0mff1z0kq',
          host: 'shawngoodin.com'
        })
      };
    } else {
      return {
        statusCode: 500,
        body: JSON.stringify({ message: 'Database connection failed' })
      };
    }
  } catch (error) {
    console.error('Error testing database connection:', error);
    
    return {
      statusCode: 500,
      body: JSON.stringify({ 
        message: 'Database connection error', 
        error: error.message
      })
    };
  }
}

// Export the handler functions
exports.handler = async function(event, context) {
  console.log("mysql-timeline.js handler called with path:", event.path);
  console.log("Event details:", {
    httpMethod: event.httpMethod,
    path: event.path
  });
  
  // Check if we're using path parameters (Netlify routing) or raw paths
  if (event.pathParameters && event.pathParameters.proxy) {
    // Using Netlify's proxy path parameters
    const route = event.pathParameters.proxy;
    console.log("Using proxy parameter routing with route:", route);
    
    if (route === 'get-timeline') {
      return await getTimeline(event, context);
    } else if (route === 'save-timeline') {
      return await saveTimeline(event, context);
    } else if (route === 'create-milestone') {
      return await createMilestone(event, context);
    } else if (route === 'import-data') {
      return await importData(event, context);
    } else if (route === 'test-database') {
      return await testDatabase(event, context);
    }
  } else {
    // Fall back to checking the raw path
    const path = event.path;
    console.log("Using raw path routing with path:", path);
    
    if (path.endsWith('/get-timeline')) {
      return await getTimeline(event, context);
    } else if (path.endsWith('/save-timeline')) {
      return await saveTimeline(event, context);
    } else if (path.endsWith('/create-milestone')) {
      return await createMilestone(event, context);
    } else if (path.endsWith('/import-data')) {
      return await importData(event, context);
    } else if (path.endsWith('/test-database')) {
      return await testDatabase(event, context);
    }
  }
  
  // Default response for unknown routes
  console.log("No matching route found, returning 404");
  return {
    statusCode: 404,
    body: JSON.stringify({ 
      message: 'Not Found',
      path: event.path
    })
  };
}; 