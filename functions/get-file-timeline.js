const fs = require('fs');
const path = require('path');

// Define the path to the timeline data file
const DATA_FILE_PATH = path.join(__dirname, '..', 'data', 'timeline.json');

exports.handler = async function(event, context) {
  console.log("get-file-timeline.js handler called");
  
  try {
    // Check if the file exists
    if (!fs.existsSync(DATA_FILE_PATH)) {
      console.log("Timeline data file not found");
      return {
        statusCode: 404,
        body: JSON.stringify({ message: 'Timeline data file not found' })
      };
    }

    // Read the file
    console.log("Reading timeline data from:", DATA_FILE_PATH);
    const fileData = fs.readFileSync(DATA_FILE_PATH, 'utf8');
    console.log("File data length:", fileData.length);

    // Parse the JSON data
    const timelineData = JSON.parse(fileData);
    console.log("Timeline entries:", timelineData.timeline.length);

    // Return the data
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(timelineData)
    };
  } catch (error) {
    console.error("Error reading timeline data:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ 
        message: 'Error reading timeline data', 
        error: error.message,
        stack: error.stack
      })
    };
  }
}; 