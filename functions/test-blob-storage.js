let NetlifyBlobStore;

try {
  ({ NetlifyBlobStore } = require('@netlify/blobs'));
} catch (error) {
  console.warn("@netlify/blobs module not available");
}

exports.handler = async function(event, context) {
  const results = {
    tests: [],
    overallSuccess: false
  };

  try {
    // Test 1: Check if NetlifyBlobStore module is available
    const moduleAvailable = !!NetlifyBlobStore;
    results.tests.push({
      name: "Module available",
      success: moduleAvailable,
      details: moduleAvailable ? "NetlifyBlobStore module loaded successfully" : "Failed to load NetlifyBlobStore module"
    });

    if (!moduleAvailable) {
      return {
        statusCode: 200,
        body: JSON.stringify({
          message: "Blob storage test failed - module not available",
          results
        })
      };
    }

    // Test 2: Check if we have a token
    const tokenAvailable = !!process.env.NETLIFY_BLOBS_TOKEN;
    results.tests.push({
      name: "Token available",
      success: tokenAvailable,
      details: tokenAvailable ? "NETLIFY_BLOBS_TOKEN is set" : "NETLIFY_BLOBS_TOKEN is not set"
    });

    if (!tokenAvailable) {
      return {
        statusCode: 200,
        body: JSON.stringify({
          message: "Blob storage test failed - no token available",
          results
        })
      };
    }

    // Test 3: Check if site ID is available
    const siteID = context.site?.id || process.env.NETLIFY_SITE_ID;
    const siteIdAvailable = !!siteID;
    
    results.tests.push({
      name: "Site ID available",
      success: siteIdAvailable,
      details: siteIdAvailable ? `Site ID: ${siteID}` : "No site ID available"
    });

    if (!siteIdAvailable) {
      return {
        statusCode: 200,
        body: JSON.stringify({
          message: "Blob storage test failed - no site ID available",
          results
        })
      };
    }

    // Test 4: Initialize blob store
    let blobStore;
    try {
      blobStore = new NetlifyBlobStore({
        siteID,
        namespace: 'roadToAGI_test',
        token: process.env.NETLIFY_BLOBS_TOKEN
      });
      
      results.tests.push({
        name: "Initialize blob store",
        success: true,
        details: "Blob store initialized successfully"
      });
    } catch (error) {
      results.tests.push({
        name: "Initialize blob store",
        success: false,
        details: `Error initializing blob store: ${error.message}`
      });
      
      return {
        statusCode: 200,
        body: JSON.stringify({
          message: "Blob storage test failed - could not initialize blob store",
          results,
          error: error.message
        })
      };
    }

    // Test 5: Write to blob store
    const testKey = 'test-key';
    const testData = {
      test: true,
      timestamp: new Date().toISOString(),
      random: Math.random()
    };
    
    try {
      await blobStore.set(testKey, JSON.stringify(testData));
      
      results.tests.push({
        name: "Write to blob store",
        success: true,
        details: "Successfully wrote test data to blob store"
      });
    } catch (error) {
      results.tests.push({
        name: "Write to blob store",
        success: false,
        details: `Error writing to blob store: ${error.message}`
      });
      
      return {
        statusCode: 200,
        body: JSON.stringify({
          message: "Blob storage test failed - could not write to blob store",
          results,
          error: error.message
        })
      };
    }

    // Test 6: Read from blob store
    try {
      const exists = await blobStore.exists(testKey);
      
      results.tests.push({
        name: "Check blob exists",
        success: exists,
        details: exists ? "Test blob exists" : "Test blob does not exist"
      });
      
      if (!exists) {
        return {
          statusCode: 200,
          body: JSON.stringify({
            message: "Blob storage test failed - could not find written blob",
            results
          })
        };
      }
      
      const readData = await blobStore.get(testKey, { type: 'json' });
      
      results.tests.push({
        name: "Read from blob store",
        success: true,
        details: "Successfully read test data from blob store",
        data: readData
      });
      
      // Verify data integrity
      const dataIntegrity = readData.test === testData.test && 
                            readData.timestamp === testData.timestamp && 
                            readData.random === testData.random;
                            
      results.tests.push({
        name: "Data integrity",
        success: dataIntegrity,
        details: dataIntegrity ? "Data integrity verified" : "Data integrity check failed"
      });
      
    } catch (error) {
      results.tests.push({
        name: "Read from blob store",
        success: false,
        details: `Error reading from blob store: ${error.message}`
      });
      
      return {
        statusCode: 200,
        body: JSON.stringify({
          message: "Blob storage test failed - could not read from blob store",
          results,
          error: error.message
        })
      };
    }

    // All tests passed
    results.overallSuccess = true;
    
    return {
      statusCode: 200,
      body: JSON.stringify({
        message: "Blob storage test completed successfully",
        results
      })
    };
    
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: "Error running blob storage tests",
        error: error.message,
        results
      })
    };
  }
}; 