# The Road to AGI and Beyond

An interactive timeline visualization of AI progress, featuring key milestones from the past and projected developments toward Artificial General Intelligence (AGI) and beyond.

## Overview

This project was ideated by Paul Roetzer on the [Artificial Intelligence Show podcast](https://www.marketingaiinstitute.com/podcast-show-notes/episode-141-road-to-agi-beyond-part-1). It presents a visually engaging timeline chronicling the development of artificial intelligence from its foundational concepts to potential future milestones. The timeline is based on insights from [Episode 141 of the Artificial Intelligence Show podcast series](https://www.marketingaiinstitute.com/podcast-show-notes/episode-141-road-to-agi-beyond-part-1) and historical AI milestones, combining factual history with informed projections of what may come. Important note: This timeline represents interpretations and predictions; the future remains uncertain.

You can also watch the [YouTube version of the podcast here](https://www.youtube.com/watch?v=SUAuB5g_oCw&t=653s).

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

## Development

To develop or modify this project:

1. Clone the repository
2. Open `index.html` in your browser for local testing
3. Edit `style.css` for appearance changes
4. Modify `script.js` for functionality updates
5. Update timeline content in `index.html`

## Credits

- Project ideated by Paul Roetzer on the [Artificial Intelligence Show podcast](https://www.marketingaiinstitute.com/podcast-show-notes/episode-141-road-to-agi-beyond-part-1)
- Data primarily sourced from the [Artificial Intelligence Show Episode 141](https://www.marketingaiinstitute.com/podcast-show-notes/episode-141-road-to-agi-beyond-part-1), [YouTube video](https://www.youtube.com/watch?v=SUAuB5g_oCw&t=653s), associated materials, and historical AI milestones
- Historical AI milestone information from various academic and industry sources
- Text-to-speech functionality powered by Elevenlabs API via Netlify Functions

## License

This project is available as open source under the terms of the MIT License.
