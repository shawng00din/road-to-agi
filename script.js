document.addEventListener('DOMContentLoaded', () => {
    const detailToggles = document.querySelectorAll('.details-toggle');
    const toggleAllButton = document.getElementById('toggle-all-details');
    const voiceSelect = document.getElementById('voice-select');
    let allDetailsShown = false;
    let currentlyPlayingButton = null;
    let db = null;

    // Initialize IndexedDB
    const initDB = () => {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open('audioCache', 1);

            request.onerror = () => {
                console.error('Failed to open IndexedDB');
                reject(request.error);
            };

            request.onsuccess = (event) => {
                console.log('Successfully opened IndexedDB');
                db = event.target.result;
                resolve(db);
            };

            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                if (!db.objectStoreNames.contains('audio')) {
                    const store = db.createObjectStore('audio', { keyPath: 'id' });
                    store.createIndex('timestamp', 'timestamp', { unique: false });
                }
            };
        });
    };

    // Function to generate cache key
    const getCacheKey = (text, voice) => {
        return `${voice}_${text}`;
    };

    // Function to save audio to cache
    const saveToCache = async (text, voice, audioData) => {
        if (!db) return;

        try {
            const transaction = db.transaction(['audio'], 'readwrite');
            const store = transaction.objectStore('audio');
            
            await store.put({
                id: getCacheKey(text, voice),
                audioData: audioData,
                timestamp: Date.now()
            });
            
            console.log('Audio saved to cache');
        } catch (error) {
            console.error('Failed to save to cache:', error);
        }
    };

    // Function to get audio from cache
    const getFromCache = async (text, voice) => {
        if (!db) return null;

        try {
            const transaction = db.transaction(['audio'], 'readonly');
            const store = transaction.objectStore('audio');
            const result = await store.get(getCacheKey(text, voice));
            
            if (result) {
                console.log('Audio found in cache');
                return result.audioData;
            }
            console.log('Audio not found in cache');
            return null;
        } catch (error) {
            console.error('Failed to read from cache:', error);
            return null;
        }
    };

    // Initialize IndexedDB when the page loads
    initDB().catch(console.error);

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
        console.log('Base64 audio length:', base64Audio.length);
        
        try {
            const audioData = atob(base64Audio);
            console.log('Audio data decoded, length:', audioData.length);
            
            const arrayBuffer = new ArrayBuffer(audioData.length);
            const view = new Uint8Array(arrayBuffer);
            for (let i = 0; i < audioData.length; i++) {
                view[i] = audioData.charCodeAt(i);
            }
            console.log('Array buffer created, size:', arrayBuffer.byteLength);
            
            const audioBlob = new Blob([arrayBuffer], { type: 'audio/mp3' });
            console.log('Audio blob created, size:', audioBlob.size);
            
            const audioUrl = URL.createObjectURL(audioBlob);
            console.log('Audio URL created:', audioUrl);
            
            const audio = new Audio(audioUrl);
            
            // Add event listeners for debugging
            audio.addEventListener('loadeddata', () => {
                console.log('Audio loaded');
                console.log('Audio duration:', audio.duration);
            });
            
            audio.addEventListener('playing', () => {
                console.log('Audio started playing');
            });
            
            audio.addEventListener('pause', () => {
                console.log('Audio paused');
            });
            
            audio.addEventListener('error', (e) => {
                console.error('Audio error:', e);
                console.error('Audio error details:', audio.error);
            });
            
            audio.addEventListener('ended', () => {
                console.log('Audio playback ended');
                button.classList.remove('speaking');
                currentlyPlayingButton = null;
                URL.revokeObjectURL(audioUrl);
            });

            audio.volume = 1.0;
            
            console.log('Attempting to play audio...');
            const playPromise = audio.play();
            
            if (playPromise !== undefined) {
                playPromise
                    .then(() => {
                        console.log('Audio playback started successfully');
                    })
                    .catch(error => {
                        console.error('Audio playback failed:', error);
                        button.classList.remove('speaking');
                        currentlyPlayingButton = null;
                        URL.revokeObjectURL(audioUrl);
                        alert('Failed to play audio. Please check if your browser allows audio playback.');
                    });
            }
        } catch (error) {
            console.error('Error in audio creation/playback:', error);
            button.classList.remove('speaking');
            currentlyPlayingButton = null;
            alert('Failed to create audio. Please try again.');
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
            
            if (button.classList.contains('speaking')) {
                console.log('Stopping current speech');
                stopCurrentlyPlaying();
                return;
            }

            stopCurrentlyPlaying();

            const content = button.closest('.timeline-content');
            const textToSpeak = gatherTextContent(content);
            const selectedVoice = voiceSelect.value;
            
            try {
                console.log('Setting button to speaking state');
                button.classList.add('speaking');
                currentlyPlayingButton = button;

                // Try to get audio from cache first
                let audioData = await getFromCache(textToSpeak, selectedVoice);
                
                if (!audioData) {
                    console.log('Calling text-to-speech API...');
                    const response = await fetch('/.netlify/functions/text-to-speech', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            text: textToSpeak,
                            voice: selectedVoice
                        })
                    });

                    if (!response.ok) {
                        const errorData = await response.json();
                        console.error('API Error:', errorData);
                        throw new Error(errorData.details || 'Failed to generate speech');
                    }

                    console.log('Received API response');
                    const data = await response.json();
                    audioData = data.audio;
                    
                    // Save to cache for future use
                    await saveToCache(textToSpeak, selectedVoice, audioData);
                }

                await playAudio(audioData, button);
            } catch (error) {
                console.error('Error in speech generation:', error);
                button.classList.remove('speaking');
                currentlyPlayingButton = null;
                alert('Failed to generate speech: ' + error.message);
            }
        });
    });

    // Add voice change handler to clear cache when voice changes
    voiceSelect.addEventListener('change', () => {
        if (currentlyPlayingButton) {
            stopCurrentlyPlaying();
        }
    });
});