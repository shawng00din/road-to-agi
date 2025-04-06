# JSON Data Structure for the Road to AGI Timeline

## Overview

This directory contains the JSON data files that power the Road to AGI timeline visualization. Using a JSON-based data structure provides several advantages:

1. **Content Separation**: Separates content from presentation, making it easier to update and maintain
2. **Version Control**: Easier to track changes to timeline content
3. **Editing Workflow**: Non-technical contributors can edit content without touching HTML/CSS/JS through the Netlify CMS
4. **API Integration**: Makes it simpler to integrate with other systems or build future API endpoints
5. **Localization**: Easily add support for multiple languages by creating parallel JSON files

## File Structure

- `timeline.json`: The main data file containing all timeline items

## Data Format

The timeline data follows this structure:

```json
{
  "timeline": [
    {
      "id": "unique-identifier",
      "year": "1950",
      "title": "Item Title",
      "icon": "fas fa-icon-name",
      "players_concepts": ["Person", "Concept"],
      "details": "Detailed description of the timeline item.",
      "quote": "Optional quote text",
      "learn_more_links": [
        {
          "text": "Link Text",
          "url": "https://example.com"
        }
      ]
    }
  ],
  "metadata": {
    "title": "Main Timeline Title",
    "description": "Timeline description",
    "lastUpdated": "YYYY-MM-DD"
  }
}
```

## Using the Admin Interface

The timeline data can be edited through the Netlify CMS admin interface:

1. Go to `/admin/` on your site
2. Log in using Netlify Identity
3. Select "Timeline Data" from the collections menu
4. Edit timeline items in a user-friendly interface

## Working with the Data

The data is loaded dynamically by the `js/load-timeline.js` script, which:
1. Fetches the JSON data
2. Generates the HTML for each timeline item
3. Adds the HTML to the page
4. Sets up event listeners for interactivity

## Audio Generation

Audio files are generated based on the JSON data using the `scripts/json-audio-generator.js` script, which:
1. Reads the timeline data from JSON
2. For each item, formats the text to be spoken
3. Generates audio files using the OpenAI API
4. Saves the files with names matching the item IDs

The audio generation system automatically detects changes to timeline content and only regenerates audio when needed.

## Adding New Timeline Items

To add a new timeline item:

1. Edit the `timeline.json` file
2. Add a new object to the `timeline` array following the format above
3. Make sure to create a unique `id` that follows the pattern: `[year]-[title-slug]`
4. Run the audio generation script to create audio files for the new item
5. Deploy the changes to see them live

## Modifying Existing Items

When you modify an existing item, the audio generation system will automatically detect the changes and regenerate the audio files as needed during the next build. 