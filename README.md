# The Road to AGI and Beyond

An interactive timeline visualization of AI progress, featuring key milestones from the past and projected developments toward Artificial General Intelligence (AGI) and beyond.

## Overview

This project was ideated by Paul Roetzer on the [Artificial Intelligence Show podcast](https://www.marketingaiinstitute.com/podcast-show-notes/episode-141-road-to-agi-beyond-part-1). It presents a visually engaging timeline chronicling the development of artificial intelligence from its foundational concepts to potential future milestones. The timeline is based on insights from [Episode 141 of the Artificial Intelligence Show podcast series](https://www.marketingaiinstitute.com/podcast-show-notes/episode-141-road-to-agi-beyond-part-1) and historical AI milestones, combining factual history with informed projections of what may come. Important note: This timeline represents interpretations and predictions; the future remains uncertain.

You can also watch the [YouTube version of the podcast here](https://www.youtube.com/watch?v=SUAuB5g_oCw&t=653s).

## Deploy Status
[![Netlify Status](https://api.netlify.com/api/v1/badges/dda06506-bfc3-48fe-bc0a-eb39914fe31e/deploy-status)](https://app.netlify.com/sites/roadtoagi/deploys)

## Features

- **Interactive Timeline**: Scroll through a chronological presentation of AI milestones from 1950 to projected future developments.
- **Expandable Details**: Each timeline item can be expanded to reveal additional information.
- **Text-to-Speech**: Listen to each milestone with the integrated text-to-speech feature.
- **Voice Selection**: Choose between different voice options for the text-to-speech functionality.
- **Play All**: Automatically progress through all timeline items with audio narration.
- **Responsive Design**: Access the timeline on desktop and mobile devices with a layout that adapts to your screen size.

## How to Use

1. **Browse the Timeline**: Scroll up and down to navigate through different milestones.
2. **View Details**: Click "Show Details" on any timeline item to read more information.
3. **Listen to Milestones**: 
   - Click the speaker icon on any milestone to hear it read aloud.
   - Click again to stop the audio.
4. **Voice Options**: Select your preferred voice from the dropdown menu in the header.
5. **Play Entire Timeline**: 
   - Click "Play All" to automatically progress through all timeline items with audio narration.
   - The currently playing item will be highlighted with a light gray background.
   - Click "Stop" to end the automatic playback.
   - You can change voices during playback, and it will continue from the current item with the new voice.

## Technical Details

This project uses:
- HTML5 for structure
- CSS3 for styling and responsive design
- JavaScript for interactivity
- Font Awesome for icons
- Netlify Functions for handling text-to-speech API requests
- IndexedDB for audio caching to improve performance
- Pre-generated audio files stored as static assets on Netlify

## Audio Generation System

To reduce API costs and improve performance, this project uses a pre-generation system for audio files:

1. **Static Audio Files**: All timeline audio is pre-generated during the Netlify build process and stored as static files.

2. **Content Change Detection**: 
   - The system tracks content hashes in a JSON file to detect when text changes
   - It only regenerates audio for items with changed content
   - This ensures audio files stay in sync with text while minimizing API costs

3. **Auto-Generation Process**:
   - Runs automatically during Netlify builds
   - Generates MP3 files for both male and female voices
   - Stores files in `/public/audio/[voice]/[item-id].mp3`

4. **Fallback Mechanism**:
   - First tries to load audio from static files
   - Only calls the API if a static file is missing
   - Caches API responses in IndexedDB for future use

For more details on the audio generation system, see [scripts/README.md](scripts/README.md).

## Development

To develop or modify this project:

1. Clone the repository
2. Open `index.html` in your browser for local testing
3. Edit `style.css` for appearance changes
4. Modify `script.js` for functionality updates
5. Update timeline content in `index.html`

### Managing Audio Generation

If you modify timeline content, you'll need to update the audio files:

1. **Prerequisites**:
   - Ensure you have Node.js installed
   - For local generation: Create a `.env` file with your OpenAI API key: `OPENAI_API_KEY=your_key_here`
   - For Netlify deployment: The API key is already set up in Netlify environment variables

2. **Generate Audio Locally** (optional):
   ```bash
   npm install             # Install dependencies
   npm run generate-audio  # Generate audio files
   ```

3. **Automatic Generation on Netlify**:
   - Audio is automatically generated during Netlify builds
   - Netlify uses your environment variables for the OpenAI API key
   - Files are stored in the `public/audio` directory
   - The system only regenerates audio for changed content

4. **Cost Considerations**:
   - The script is designed to minimize API calls
   - It tracks content hashes to avoid regenerating unchanged audio
   - Each API call uses OpenAI's text-to-speech service which has associated costs
   - Most users will load pre-generated static files, not calling the API

## Credits

- Project ideated by Paul Roetzer on the [Artificial Intelligence Show podcast](https://www.marketingaiinstitute.com/podcast-show-notes/episode-141-road-to-agi-beyond-part-1)
- Data primarily sourced from the [Artificial Intelligence Show Episode 141](https://www.marketingaiinstitute.com/podcast-show-notes/episode-141-road-to-agi-beyond-part-1), [YouTube video](https://www.youtube.com/watch?v=SUAuB5g_oCw&t=653s), associated materials, and historical AI milestones
- Historical AI milestone information from various academic and industry sources
- Text-to-speech functionality powered by OpenAI's TTS API via Netlify Functions

## License

This project is available as open source under the terms of the MIT License.
