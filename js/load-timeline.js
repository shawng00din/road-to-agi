/**
 * Load Timeline Data from Netlify Blobs
 * 
 * This script handles loading timeline data from the Netlify Functions API
 * and dynamically rendering it on the page.
 */

document.addEventListener('DOMContentLoaded', async () => {
    // Get the timeline container
    const timelineContainer = document.querySelector('.timeline-container');
    if (!timelineContainer) {
        console.error('Timeline container not found!');
        return;
    }

    try {
        // Show loading indicator
        timelineContainer.innerHTML = `
            <div class="loading-indicator">
                <i class="fas fa-spinner fa-spin"></i>
                <p>Loading timeline data...</p>
            </div>
        `;

        // Fetch the timeline data from Netlify Function
        const response = await fetch('/.netlify/functions/get-timeline');
        if (!response.ok) {
            throw new Error(`Error fetching timeline data: ${response.status}`);
        }

        const data = await response.json();
        if (!data || !data.timeline || !Array.isArray(data.timeline)) {
            throw new Error('Invalid timeline data format');
        }

        // Sort the timeline items by year
        const sortedTimeline = [...data.timeline].sort((a, b) => {
            // Extract numeric year if possible
            const yearA = parseInt(a.year.replace(/\D/g, ''));
            const yearB = parseInt(b.year.replace(/\D/g, ''));
            
            if (!isNaN(yearA) && !isNaN(yearB)) {
                return yearA - yearB;
            }
            
            // Fall back to string comparison
            return a.year.localeCompare(b.year);
        });

        // Clear the loading indicator
        timelineContainer.innerHTML = '';

        // Render each timeline item
        sortedTimeline.forEach(item => {
            // Create timeline HTML
            const itemHTML = createTimelineItemHTML(item);
            timelineContainer.innerHTML += itemHTML;
        });

        // Re-initialize event listeners after rendering
        initializeTimelineInteractivity();

        // Update metadata
        if (data.metadata) {
            updatePageMetadata(data.metadata);
        }

    } catch (error) {
        console.error('Failed to load timeline data:', error);
        timelineContainer.innerHTML = `
            <div class="error-message">
                <i class="fas fa-exclamation-triangle"></i>
                <p>Failed to load timeline data. Please refresh the page to try again.</p>
                <p class="error-details">${error.message}</p>
            </div>
        `;
    }
});

/**
 * Create HTML for a timeline item
 */
function createTimelineItemHTML(item) {
    // Convert links array to HTML
    let linksHTML = '';
    if (item.learn_more_links && item.learn_more_links.length > 0) {
        const links = item.learn_more_links.map(link => 
            `<a href="${link.url}" target="_blank" rel="noopener noreferrer">${link.text}</a>`
        );
        linksHTML = `<p><strong>Learn More:</strong> ${links.join(', ')}</p>`;
    }

    // Convert players/concepts array to text
    let playersHTML = '';
    if (item.players_concepts && item.players_concepts.length > 0) {
        playersHTML = `<p><strong>Players/Concepts:</strong> ${item.players_concepts.join(', ')}</p>`;
    }

    // Create quote HTML if it exists
    let quoteHTML = '';
    if (item.quote) {
        quoteHTML = `<p class="quote">${item.quote}</p>`;
    }

    return `
        <div class="timeline-item" data-id="${item.id}">
            <div class="timeline-icon">
                <i class="${item.icon || 'fas fa-lightbulb'}"></i>
            </div>
            <div class="timeline-content">
                <div class="content-header">
                    <span class="year">${item.year}</span>
                    <button class="speak-button" aria-label="Read aloud (click again to stop)">
                        <i class="fas fa-volume-up"></i>
                    </button>
                </div>
                <h3>${item.title}</h3>
                <div class="details">
                    ${playersHTML}
                    <p>${item.details}</p>
                    ${quoteHTML}
                    ${linksHTML}
                </div>
                <button class="details-toggle">Show Details</button>
            </div>
        </div>
    `;
}

/**
 * Update page metadata from the timeline data
 */
function updatePageMetadata(metadata) {
    // Update title and description
    if (metadata.title) {
        const titleElement = document.querySelector('header h1');
        if (titleElement) {
            titleElement.textContent = metadata.title;
        }
        
        // Also update document title
        document.title = metadata.title + ' - An Interactive Timeline';
    }

    if (metadata.description) {
        const descElement = document.querySelector('header p');
        if (descElement) {
            descElement.textContent = metadata.description;
        }
    }

    // Add last updated date if it exists
    if (metadata.lastUpdated) {
        const footerElement = document.querySelector('footer');
        if (footerElement) {
            const lastUpdatedElement = document.createElement('p');
            lastUpdatedElement.className = 'last-updated';
            lastUpdatedElement.textContent = `Last updated: ${metadata.lastUpdated}`;
            footerElement.appendChild(lastUpdatedElement);
        }
    }
}

/**
 * Initialize event listeners after dynamic content load
 */
function initializeTimelineInteractivity() {
    // Re-initialize detail toggles
    const detailToggles = document.querySelectorAll('.details-toggle');
    detailToggles.forEach(button => {
        button.addEventListener('click', () => {
            const content = button.closest('.timeline-content');
            const details = content.querySelector('.details');
            
            if (details) {
                details.classList.toggle('active');
                button.textContent = details.classList.contains('active') ? 'Hide Details' : 'Show Details';
            }
        });
    });

    // Re-initialize speak buttons (basic initialization)
    const speakButtons = document.querySelectorAll('.speak-button');
    speakButtons.forEach(button => {
        button.addEventListener('click', () => {
            // This is just a placeholder - the main script.js handles the actual audio playback
            console.log('Speak button clicked, waiting for script.js to handle it');
        });
    });
} 