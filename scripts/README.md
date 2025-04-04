# Audio Generation for Road to AGI Timeline

This directory contains scripts to pre-generate audio files for the Road to AGI interactive timeline.

## How it works

1. The `generate-audio.js` script extracts all timeline items from the HTML
2. For each item, it generates audio files in both male and female voices
3. The audio files are stored in the `public/audio/` directory, organized by voice
4. These files are included in the Netlify deployment

## Content Change Detection

The script automatically detects when the HTML content changes:

1. It maintains a hash of each timeline item's text content in `public/audio/content-hashes.json`
2. When run, it compares the current content with the stored hashes
3. It only regenerates audio files for items that have changed content
4. This ensures that audio stays in sync with text content while minimizing API costs

## Running manually

To generate the audio files manually:

```bash
# Make sure your OpenAI API key is set in .env file
# OPENAI_API_KEY=your_api_key_here

# Install dependencies
npm install

# Run the script
npm run generate-audio
```

## Benefits

- Reduces API costs by pre-generating all audio files
- Improves performance as audio files are served as static assets
- Users don't need to wait for API calls when playing audio
- Falls back to API only if a file is missing
- Automatically detects and updates audio when content changes 