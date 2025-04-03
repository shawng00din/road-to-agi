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

    // Text-to-Speech functionality
    const speakButtons = document.querySelectorAll('.speak-button');

    const stopCurrentlyPlaying = () => {
        if (currentlyPlayingButton) {
            currentlyPlayingButton.classList.remove('speaking');
            currentlyPlayingButton = null;
        }
    };

    const playAudio = async (base64Audio, button) => {
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
            button.classList.remove('speaking');
            currentlyPlayingButton = null;
            URL.revokeObjectURL(audioUrl);
        });

        audio.play();
    };

    speakButtons.forEach(button => {
        button.addEventListener('click', async () => {
            // If this button is already speaking, stop it
            if (button.classList.contains('speaking')) {
                stopCurrentlyPlaying();
                return;
            }

            // Stop any currently playing audio
            stopCurrentlyPlaying();

            // Get the content to speak
            const content = button.closest('.timeline-content');
            const year = content.querySelector('.year').textContent;
            const title = content.querySelector('h3').textContent;
            const details = content.querySelector('.details');
            
            // Construct the text to speak
            let textToSpeak = `${year}: ${title}.`;
            if (details && details.classList.contains('active')) {
                const paragraphs = details.querySelectorAll('p');
                paragraphs.forEach(p => {
                    textToSpeak += ' ' + p.textContent;
                });
            }

            try {
                button.classList.add('speaking');
                currentlyPlayingButton = button;

                // Call our Netlify function
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
                    throw new Error('Failed to generate speech');
                }

                const data = await response.json();
                await playAudio(data.audio, button);
            } catch (error) {
                console.error('Error:', error);
                button.classList.remove('speaking');
                currentlyPlayingButton = null;
                alert('Failed to generate speech. Please try again.');
            }
        });
    });
});