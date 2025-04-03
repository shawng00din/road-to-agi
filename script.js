document.addEventListener('DOMContentLoaded', () => {
    const detailToggles = document.querySelectorAll('.details-toggle');
    const toggleAllButton = document.getElementById('toggle-all-details');
    const voiceSelect = document.getElementById('voice-select');
    let allDetailsShown = false;
    let currentlyPlayingButton = null;

    // Function to update button text based on state
    const updateButtonText = (button, isShown) => {
        button.textContent = isShown ? 'Hide Details' : 'Show Details';
    };

    // Function to toggle a single detail section
    const toggleDetail = (content, show = null) => {
        const details = content.querySelector('.details');
        const button = content.querySelector('.details-toggle');
        
        if (details) {
            if (show === null) {
                details.classList.toggle('active');
            } else {
                details.classList[show ? 'add' : 'remove']('active');
            }
            updateButtonText(button, details.classList.contains('active'));
        }
    };

    // Handle individual detail toggles
    detailToggles.forEach(button => {
        if (button.id !== 'toggle-all-details') {
            button.addEventListener('click', () => {
                const content = button.closest('.timeline-content');
                toggleDetail(content);
            });
        }
    });

    // Handle toggle all button
    toggleAllButton.addEventListener('click', () => {
        allDetailsShown = !allDetailsShown;
        document.querySelectorAll('.timeline-content').forEach(content => {
            toggleDetail(content, allDetailsShown);
        });
        updateButtonText(toggleAllButton, allDetailsShown);
    });

    // Function to gather text content from a timeline item
    const gatherTextContent = (content) => {
        console.log('Gathering text content...');
        
        const year = content.querySelector('.year').textContent;
        console.log('Year:', year);
        
        const title = content.querySelector('h3').textContent;
        console.log('Title:', title);
        
        const details = content.querySelector('.details');
        let detailsText = '';
        
        // Always show details before gathering text
        if (details && !details.classList.contains('active')) {
            details.classList.add('active');
        }
        
        if (details) {
            const paragraphs = details.querySelectorAll('p');
            paragraphs.forEach((p, index) => {
                detailsText += ' ' + p.textContent;
                console.log(`Paragraph ${index + 1}:`, p.textContent);
            });
        }
        
        const fullText = `${year}: ${title}.${detailsText}`;
        console.log('Full text to speak:', fullText);
        return fullText;
    };

    // Function to play audio
    const playAudio = async (base64Audio, button) => {
        console.log('Creating audio from base64...');
        const audioData = atob(base64Audio);
        const arrayBuffer = new ArrayBuffer(audioData.length);
        const view = new Uint8Array(arrayBuffer);
        for (let i = 0; i < audioData.length; i++) {
            view[i] = audioData.charCodeAt(i);
        }
        
        const audioBlob = new Blob([arrayBuffer], { type: 'audio/mp3' });
        const audioUrl = URL.createObjectURL(audioBlob);
        const audio = new Audio(audioUrl);
        
        audio.addEventListener('ended', () => {
            console.log('Audio playback ended');
            button.classList.remove('speaking');
            currentlyPlayingButton = null;
            URL.revokeObjectURL(audioUrl);
        });

        console.log('Starting audio playback...');
        try {
            await audio.play();
            console.log('Audio playback started successfully');
        } catch (error) {
            console.error('Audio playback error:', error);
            button.classList.remove('speaking');
            currentlyPlayingButton = null;
            alert('Failed to play audio. Please try again.');
        }
    };

    // Text-to-Speech functionality
    const speakButtons = document.querySelectorAll('.speak-button');

    const stopCurrentlyPlaying = () => {
        console.log('Stopping current playback...');
        if (currentlyPlayingButton) {
            currentlyPlayingButton.classList.remove('speaking');
            currentlyPlayingButton = null;
        }
    };

    speakButtons.forEach(button => {
        button.addEventListener('click', async () => {
            console.log('Speak button clicked');
            
            // If this button is already speaking, stop it
            if (button.classList.contains('speaking')) {
                console.log('Stopping current speech');
                stopCurrentlyPlaying();
                return;
            }

            // Stop any currently playing audio
            stopCurrentlyPlaying();

            // Get the content to speak
            const content = button.closest('.timeline-content');
            const textToSpeak = gatherTextContent(content);
            
            try {
                console.log('Setting button to speaking state');
                button.classList.add('speaking');
                currentlyPlayingButton = button;

                console.log('Calling text-to-speech API...');
                const response = await fetch('/.netlify/functions/text-to-speech', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        text: textToSpeak,
                        voice: voiceSelect.value
                    })
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    console.error('API Error:', errorData);
                    throw new Error(errorData.details || 'Failed to generate speech');
                }

                console.log('Received API response');
                const data = await response.json();
                await playAudio(data.audio, button);
            } catch (error) {
                console.error('Error in speech generation:', error);
                button.classList.remove('speaking');
                currentlyPlayingButton = null;
                alert('Failed to generate speech: ' + error.message);
            }
        });
    });
});