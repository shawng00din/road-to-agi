const mysql = require('mysql2/promise');

// Database configuration
const dbConfig = {
  host: 'shawngoodin.com',
  user: 'utjd24pkgdgfq',
  password: process.env.MYSQL_PASSWORD, // Should be set in environment variables for security
  database: 'dbwkp0mff1z0kq',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

// Create a connection pool
const pool = mysql.createPool(dbConfig);

// Test the connection
async function testConnection() {
  try {
    const connection = await pool.getConnection();
    console.log('Database connection successful');
    connection.release();
    return true;
  } catch (error) {
    console.error('Database connection failed:', error);
    return false;
  }
}

// Initialize database schema if needed
async function initializeDatabase() {
  try {
    const connection = await pool.getConnection();
    
    // Create timeline table if it doesn't exist
    await connection.query(`
      CREATE TABLE IF NOT EXISTS timeline (
        id VARCHAR(255) PRIMARY KEY,
        year VARCHAR(50) NOT NULL,
        title VARCHAR(255) NOT NULL,
        icon VARCHAR(50),
        players_concepts JSON,
        details TEXT NOT NULL,
        quote TEXT,
        learn_more_links JSON,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);
    
    // Create metadata table if it doesn't exist
    await connection.query(`
      CREATE TABLE IF NOT EXISTS timeline_metadata (
        id INT PRIMARY KEY AUTO_INCREMENT,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        last_updated DATE NOT NULL
      )
    `);
    
    // Check if metadata exists, insert default if not
    const [metadata] = await connection.query('SELECT * FROM timeline_metadata LIMIT 1');
    if (metadata.length === 0) {
      await connection.query(`
        INSERT INTO timeline_metadata (title, description, last_updated)
        VALUES (?, ?, ?)
      `, [
        'The Road to AGI and Beyond',
        'An interactive timeline based on insights from the Artificial Intelligence Show podcast series and AI history.',
        new Date().toISOString().split('T')[0]
      ]);
    }
    
    connection.release();
    console.log('Database schema initialized successfully');
    return true;
  } catch (error) {
    console.error('Error initializing database schema:', error);
    return false;
  }
}

// Get timeline data
async function getTimelineData() {
  try {
    // Get timeline entries
    const [timelineRows] = await pool.query('SELECT * FROM timeline ORDER BY year');
    
    // Get metadata
    const [metadataRows] = await pool.query('SELECT * FROM timeline_metadata LIMIT 1');
    
    // Format the timeline data to match the existing structure
    const formattedTimeline = timelineRows.map(row => ({
      id: row.id,
      year: row.year,
      title: row.title,
      icon: row.icon,
      players_concepts: JSON.parse(row.players_concepts || '[]'),
      details: row.details,
      quote: row.quote,
      learn_more_links: JSON.parse(row.learn_more_links || '[]')
    }));
    
    // Combine timeline and metadata
    const result = {
      timeline: formattedTimeline,
      metadata: metadataRows.length > 0 ? {
        title: metadataRows[0].title,
        description: metadataRows[0].description,
        lastUpdated: metadataRows[0].last_updated.toISOString().split('T')[0]
      } : {
        title: 'The Road to AGI and Beyond',
        description: 'An interactive timeline based on insights from the Artificial Intelligence Show podcast series and AI history.',
        lastUpdated: new Date().toISOString().split('T')[0]
      }
    };
    
    return result;
  } catch (error) {
    console.error('Error getting timeline data:', error);
    throw error;
  }
}

// Save timeline data
async function saveTimelineData(data) {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    
    // Update metadata
    await connection.query(`
      UPDATE timeline_metadata 
      SET title = ?, description = ?, last_updated = ?
      WHERE id = 1
    `, [
      data.metadata.title,
      data.metadata.description,
      new Date().toISOString().split('T')[0]
    ]);
    
    // Clear the timeline table
    await connection.query('DELETE FROM timeline');
    
    // Insert all milestones
    for (const milestone of data.timeline) {
      await connection.query(`
        INSERT INTO timeline (
          id, year, title, icon, players_concepts, details, quote, learn_more_links
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        milestone.id,
        milestone.year,
        milestone.title,
        milestone.icon || 'fas fa-lightbulb',
        JSON.stringify(milestone.players_concepts || []),
        milestone.details,
        milestone.quote,
        JSON.stringify(milestone.learn_more_links || [])
      ]);
    }
    
    await connection.commit();
    return true;
  } catch (error) {
    await connection.rollback();
    console.error('Error saving timeline data:', error);
    throw error;
  } finally {
    connection.release();
  }
}

// Create a new milestone
async function createMilestone(milestone) {
  try {
    await pool.query(`
      INSERT INTO timeline (
        id, year, title, icon, players_concepts, details, quote, learn_more_links
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      milestone.id,
      milestone.year,
      milestone.title,
      milestone.icon || 'fas fa-lightbulb',
      JSON.stringify(milestone.players_concepts || []),
      milestone.details,
      milestone.quote,
      JSON.stringify(milestone.learn_more_links || [])
    ]);
    
    // Update the last_updated timestamp in metadata
    await pool.query(`
      UPDATE timeline_metadata 
      SET last_updated = ?
      WHERE id = 1
    `, [new Date().toISOString().split('T')[0]]);
    
    return true;
  } catch (error) {
    console.error('Error creating milestone:', error);
    throw error;
  }
}

// Import data from JSON file
async function importFromJSON(filePath) {
  const fs = require('fs');
  const path = require('path');
  
  try {
    const fullPath = path.resolve(__dirname, '..', filePath);
    const data = JSON.parse(fs.readFileSync(fullPath, 'utf8'));
    
    if (!data.timeline || !Array.isArray(data.timeline)) {
      throw new Error('Invalid timeline data in file');
    }
    
    await saveTimelineData(data);
    return true;
  } catch (error) {
    console.error('Error importing from JSON:', error);
    throw error;
  }
}

module.exports = {
  pool,
  testConnection,
  initializeDatabase,
  getTimelineData,
  saveTimelineData,
  createMilestone,
  importFromJSON
}; 