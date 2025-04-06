/**
 * JSON-based Audio Generator
 * 
 * This script reads the timeline data from the JSON file and generates
 * audio files for each timeline item using the OpenAI API.
 */

const fs = require('fs');
const path = require('path');
const axios = require('axios');
const crypto = require('crypto');

// Load environment variables from .env file if it exists (for local development)
try {
    require('dotenv').config();
} catch (err) {
    console.log('dotenv module not found, using system environment variables');
}

// Get the API key from environment variables
// On Netlify, this will be automatically available from the Netlify environment variables
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

// Check if API key is available
if (!OPENAI_API_KEY) {
    console.error('⚠️ ERROR: OPENAI_API_KEY environment variable is not set.');
    console.error('Please set up your OpenAI API key in Netlify environment variables or in a local .env file');
    process.exit(1);
}

const VOICES = ['fable', 'nova']; // male and female voices
const CONTENT_HASH_FILE = path.join(__dirname, '../audio/content-hashes.json');
const TIMELINE_DATA_FILE = path.join(__dirname, '../data/timeline.json');

// Format text content for a timeline item from the JSON data
function formatTextContent(item) {
    let text = `${item.year}: ${item.title}.`;
    
    if (item.details) {
        text += ` ${item.details}`;
    }
    
    if (item.quote) {
        text += ` Quote: ${item.quote}`;
    }
    
    return text;
}

// Generate a hash of the text content to detect changes
function generateContentHash(text) {
    return crypto.createHash('md5').update(text).digest('hex');
}

// Call OpenAI API to generate speech
async function generateSpeech(text, voice) {
    try {
        console.log(`Generating speech for voice ${voice}...`);
        const response = await axios.post(
            'https://api.openai.com/v1/audio/speech',
            {
                model: 'tts-1',
                voice: voice,
                input: text
            },
            {
                headers: {
                    'Authorization': `Bearer ${OPENAI_API_KEY}`,
                    'Content-Type': 'application/json'
                },
                responseType: 'arraybuffer'
            }
        );
        
        return response.data;
    } catch (error) {
        console.error('Error generating speech:', error.response?.data ? JSON.parse(Buffer.from(error.response.data).toString()) : error.message);
        throw error;
    }
}

// Load existing content hashes
function loadContentHashes() {
    try {
        if (fs.existsSync(CONTENT_HASH_FILE)) {
            return JSON.parse(fs.readFileSync(CONTENT_HASH_FILE, 'utf8'));
        }
    } catch (error) {
        console.error('Error loading content hashes:', error.message);
    }
    return {};
}

// Save content hashes
function saveContentHashes(hashes) {
    try {
        const dir = path.dirname(CONTENT_HASH_FILE);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        fs.writeFileSync(CONTENT_HASH_FILE, JSON.stringify(hashes, null, 2));
    } catch (error) {
        console.error('Error saving content hashes:', error.message);
    }
}

// Main function to generate all audio files
async function generateAllAudioFiles() {
    try {
        // Check if the timeline data file exists
        if (!fs.existsSync(TIMELINE_DATA_FILE)) {
            console.error(`Timeline data file not found: ${TIMELINE_DATA_FILE}`);
            process.exit(1);
        }
        
        // Load the timeline data
        const timelineData = JSON.parse(fs.readFileSync(TIMELINE_DATA_FILE, 'utf8'));
        if (!timelineData.timeline || !Array.isArray(timelineData.timeline)) {
            console.error('Invalid timeline data format: expected an object with a timeline array');
            process.exit(1);
        }
        
        // Load existing content hashes
        const contentHashes = loadContentHashes();
        const newContentHashes = {};
        
        console.log(`Found ${timelineData.timeline.length} timeline items in JSON`);
        
        let successCount = 0;
        let errorCount = 0;
        let unchangedCount = 0;
        
        // Process each timeline item
        for (let i = 0; i < timelineData.timeline.length; i++) {
            const item = timelineData.timeline[i];
            const itemId = item.id;
            
            if (!itemId) {
                console.error(`Item at index ${i} is missing an ID`);
                continue;
            }
            
            const textToSpeak = formatTextContent(item);
            
            // Generate a hash of the content
            const contentHash = generateContentHash(textToSpeak);
            newContentHashes[itemId] = contentHash;
            
            // Check if content has changed
            const hasChanged = !contentHashes[itemId] || contentHashes[itemId] !== contentHash;
            
            console.log(`\nProcessing item ${i+1}/${timelineData.timeline.length}: ${itemId}`);
            console.log(`Text length: ${textToSpeak.length} characters`);
            console.log(`Content changed: ${hasChanged ? 'YES' : 'NO'}`);
            
            if (!hasChanged) {
                console.log('Content unchanged, checking if files exist...');
                let filesExist = true;
                
                // Check if audio files exist for all voices
                for (const voice of VOICES) {
                    const outputFile = path.join(__dirname, `../audio/${voice}/${itemId}.mp3`);
                    if (!fs.existsSync(outputFile)) {
                        console.log(`Audio file missing for voice ${voice}, will regenerate`);
                        filesExist = false;
                        break;
                    }
                }
                
                if (filesExist) {
                    console.log('All audio files exist and content unchanged, skipping');
                    unchangedCount++;
                    continue;
                }
            }
            
            // Generate audio for each voice
            for (const voice of VOICES) {
                const outputDir = path.join(__dirname, `../audio/${voice}`);
                const outputFile = path.join(outputDir, `${itemId}.mp3`);
                
                // Regenerate if content has changed or file doesn't exist
                try {
                    // Ensure directory exists
                    if (!fs.existsSync(outputDir)) {
                        fs.mkdirSync(outputDir, { recursive: true });
                    }
                    
                    // Generate audio
                    const audioData = await generateSpeech(textToSpeak, voice);
                    
                    // Save to file
                    fs.writeFileSync(outputFile, audioData);
                    console.log(`Saved to ${outputFile}`);
                    successCount++;
                    
                    // Add a small delay between API requests to avoid rate limits
                    await new Promise(resolve => setTimeout(resolve, 1000));
                } catch (error) {
                    console.error(`Error processing ${itemId} with voice ${voice}:`, error.message);
                    errorCount++;
                }
            }
        }
        
        // Save the new content hashes
        saveContentHashes(newContentHashes);
        
        console.log(`\nGeneration complete!`);
        console.log(`Successfully generated: ${successCount} files`);
        console.log(`Unchanged/skipped: ${unchangedCount} items`);
        console.log(`Errors: ${errorCount}`);
    } catch (error) {
        console.error('Error in generateAllAudioFiles:', error);
    }
}

// Run the script
generateAllAudioFiles().then(() => {
    console.log('Script finished!');
}); 