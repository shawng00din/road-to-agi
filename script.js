document.addEventListener('DOMContentLoaded', () => {
    const detailToggles = document.querySelectorAll('.details-toggle');
    const toggleAllButton = document.getElementById('toggle-all-details');
    const voiceSelect = document.getElementById('voice-select');
    let allDetailsShown = false;
    let currentlyPlayingButton = null;
    let db = null;
    let currentAudio = null;
    let playAllActive = false;
    const playAllButton = document.getElementById('play-all');
    let currentPlayingIndex = -1;
    const timelineItems = document.querySelectorAll('.timeline-item');

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
        let quoteText = '';
        
        // Always show details before gathering text
        if (details && !details.classList.contains('active')) {
            details.classList.add('active');
        }
        
        if (details) {
            // Get regular paragraphs
            const paragraphs = details.querySelectorAll('p:not(.quote)');
            paragraphs.forEach((p, index) => {
                detailsText += ' ' + p.textContent;
                console.log(`Paragraph ${index + 1}:`, p.textContent);
            });

            // Get quote if it exists
            const quote = details.querySelector('.quote');
            if (quote) {
                quoteText = ' Quote: ' + quote.textContent;
                console.log('Quote:', quote.textContent);
            }
        }
        
        const fullText = `${year}: ${title}.${detailsText}${quoteText}`;
        console.log('Full text to speak:', fullText);
        return fullText;
    };

    const stopSpeaking = () => {
        console.log('Stopping current playback...');
        if (currentlyPlayingButton) {
            currentlyPlayingButton.classList.remove('speaking');
            currentlyPlayingButton = null;
        }
        if (currentAudio) {
            currentAudio.pause();
            currentAudio.currentTime = 0;
            currentAudio = null;
        }
    };

    // Function to play audio
    const playAudio = async (base64Audio, button) => {
        console.log('Creating audio from base64...');
        
        return new Promise((resolve, reject) => {
            try {
                const audioData = atob(base64Audio);
                const arrayBuffer = new ArrayBuffer(audioData.length);
                const view = new Uint8Array(arrayBuffer);
                for (let i = 0; i < audioData.length; i++) {
                    view[i] = audioData.charCodeAt(i);
                }
                
                const audioBlob = new Blob([arrayBuffer], { type: 'audio/mp3' });
                const audioUrl = URL.createObjectURL(audioBlob);
                
                const audio = new Audio(audioUrl);
                currentAudio = audio;
                
                audio.addEventListener('ended', () => {
                    console.log('Audio playback ended');
                    button.classList.remove('speaking');
                    currentlyPlayingButton = null;
                    currentAudio = null;
                    URL.revokeObjectURL(audioUrl);

                    // If we're in "play all" mode, move to the next item
                    if (playAllActive) {
                        const nextIndex = currentPlayingIndex + 1;
                        if (nextIndex < timelineItems.length) {
                            // Remove active class from current item
                            const currentItem = timelineItems[currentPlayingIndex];
                            const currentContent = currentItem.querySelector('.timeline-content');
                            if (currentContent) {
                                currentContent.classList.remove('active');
                            }
                            
                            // Small delay before playing next
                            setTimeout(() => {
                                playNextItem(nextIndex);
                            }, 1000);
                        } else {
                            // We're done, reset play all state
                            playAllActive = false;
                            playAllButton.classList.remove('playing');
                            playAllButton.innerHTML = '<i class="fas fa-play"></i> Play All';
                            currentPlayingIndex = -1;
                            
                            // Remove active class from last item
                            const lastItem = timelineItems[timelineItems.length - 1];
                            const lastContent = lastItem.querySelector('.timeline-content');
                            if (lastContent) {
                                lastContent.classList.remove('active');
                            }
                        }
                    }
                    
                    resolve();
                });

                audio.addEventListener('error', (e) => {
                    console.error('Audio error:', e);
                    reject(e);
                });

                audio.volume = 1.0;
                audio.play().catch(error => {
                    console.error('Audio playback failed:', error);
                    reject(error);
                });
            } catch (error) {
                console.error('Error in audio creation/playback:', error);
                reject(error);
            }
        });
    };

    // Text-to-Speech functionality
    const speakButtons = document.querySelectorAll('.speak-button');

    speakButtons.forEach(button => {
        button.addEventListener('click', async () => {
            // If this is part of a Play All, don't interrupt the sequence
            if (playAllActive && currentlyPlayingButton !== button) {
                return;
            }
            
            console.log('Speak button clicked');
            
            if (button.classList.contains('speaking')) {
                console.log('Stopping current speech');
                stopSpeaking();
                return;
            }

            stopSpeaking();

            // If this was part of a Play All sequence, cancel the sequence
            if (playAllActive) {
                playAllActive = false;
                playAllButton.classList.remove('playing');
                playAllButton.innerHTML = '<i class="fas fa-play"></i> Play All';
                currentPlayingIndex = -1;
            }

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
                currentAudio = null;
                alert('Failed to generate speech: ' + error.message);
            }
        });
    });

    // Add voice change handler to clear cache when voice changes
    voiceSelect.addEventListener('change', () => {
        if (currentlyPlayingButton) {
            // Save the current playback state before stopping
            const wasPlayingAll = playAllActive;
            const currentIndex = currentPlayingIndex;
            
            // Stop current audio
            stopSpeaking();
            
            // If we were in "Play All" mode, restart with the new voice
            if (wasPlayingAll && currentIndex >= 0) {
                // Brief delay to allow audio to stop cleanly
                setTimeout(() => {
                    // Make sure we're still in play all mode
                    if (playAllActive) {
                        // Start playing the current item again with new voice
                        playNextItem(currentIndex);
                    }
                }, 200);
            }
        }
    });

    // Simplified function to play a specific item
    async function playNextItem(index) {
        if (!playAllActive || index >= timelineItems.length) {
            return;
        }

        // Update the current index
        currentPlayingIndex = index;
        
        const item = timelineItems[index];
        
        // Hide details from previous item if it exists and is showing
        if (index > 0) {
            const prevItem = timelineItems[index - 1];
            const prevDetails = prevItem.querySelector('.details');
            const prevContent = prevItem.querySelector('.timeline-content');
            if (prevDetails && prevDetails.classList.contains('active')) {
                toggleDetail(prevContent, false);
            }
            if (prevContent) {
                prevContent.classList.remove('active');
            }
        }
        
        // Show details for current item
        const content = item.querySelector('.timeline-content');
        toggleDetail(content, true);
        
        // Add active class to highlight current item
        content.classList.add('active');
        
        // Scroll item into view
        item.scrollIntoView({ behavior: 'smooth', block: 'center' });
        
        // Wait for scroll
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Get speak button and trigger click to play audio
        const speakButton = item.querySelector('.speak-button');
        if (speakButton) {
            speakButton.classList.add('speaking');
            currentlyPlayingButton = speakButton;
            
            const textToSpeak = gatherTextContent(content);
            const selectedVoice = voiceSelect.value;
            
            try {
                // Try to get audio from cache first
                let audioData = await getFromCache(textToSpeak, selectedVoice);
                
                if (!audioData) {
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
                        throw new Error('Failed to generate speech');
                    }

                    const data = await response.json();
                    audioData = data.audio;
                    await saveToCache(textToSpeak, selectedVoice, audioData);
                }

                // Play audio
                await playAudio(audioData, speakButton);
            } catch (error) {
                console.error('Error playing item:', error);
                speakButton.classList.remove('speaking');
                currentlyPlayingButton = null;
                
                // Continue to next item if there's an error
                if (playAllActive) {
                    setTimeout(() => {
                        playNextItem(index + 1);
                    }, 1000);
                }
            }
        }
    }

    // Add click event listener for the Play All button
    playAllButton.addEventListener('click', () => {
        if (playAllActive) {
            // Turn off play all
            playAllActive = false;
            playAllButton.classList.remove('playing');
            playAllButton.innerHTML = '<i class="fas fa-play"></i> Play All';
            
            // Stop current audio if playing
            stopSpeaking();
            
            // Remove active class from any active timeline content
            document.querySelectorAll('.timeline-content.active').forEach(content => {
                content.classList.remove('active');
            });
            
            currentPlayingIndex = -1;
        } else {
            // Start play all
            playAllActive = true;
            playAllButton.classList.add('playing');
            // Add the stop icon properly with innerHTML
            playAllButton.innerHTML = '<i class="fas fa-stop"></i> Stop';
            
            // Stop any current audio
            stopSpeaking();
            
            // Reset any showing details
            document.querySelectorAll('.timeline-content').forEach(content => {
                const details = content.querySelector('.details');
                content.classList.remove('active');
                if (details && details.classList.contains('active')) {
                    toggleDetail(content, false);
                }
            });
            
            // Start playing from the first item
            playNextItem(0);
        }
    });
});