document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const startBtn = document.getElementById('startBtn');
    const stopBtn = document.getElementById('stopBtn');
    const interruptBtn = document.getElementById('interruptBtn');
    const resetBtn = document.getElementById('resetBtn');
    const statusElement = document.getElementById('status');
    const conversationElement = document.getElementById('conversation');
    const speechTranscript = document.getElementById('speechTranscript');
    
    // State variables
    let isRecording = false;
    let isBotSpeaking = false;
    let recognition = null;
    let speechSynthesis = window.speechSynthesis;
    let currentUtterance = null;
    
    // Check if browser supports speech recognition and synthesis
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
        updateStatus('Speech recognition not supported in this browser!', 'alert-danger');
        startBtn.disabled = true;
        stopBtn.disabled = true;
        return;
    }
    
    if (!speechSynthesis) {
        updateStatus('Speech synthesis not supported in this browser!', 'alert-danger');
        return;
    }
    
    // Initialize speech recognition
    function initSpeechRecognition() {
        recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = true;
        recognition.lang = 'en-US';
        
        recognition.onstart = () => {
            isRecording = true;
            updateStatus('Listening...', 'alert-success');
            startBtn.classList.add('d-none');
            stopBtn.classList.remove('d-none');
            speechTranscript.textContent = 'Listening...';
        };
        
        recognition.onresult = (event) => {
            const transcript = Array.from(event.results)
                .map(result => result[0])
                .map(result => result.transcript)
                .join('');
            
            speechTranscript.textContent = transcript;
            
            // If this is a final result, process it
            if (event.results[0].isFinal) {
                sendMessageToBot(transcript);
            }
        };
        
        recognition.onerror = (event) => {
            console.error('Speech recognition error:', event.error);
            updateStatus(`Error: ${event.error}`, 'alert-danger');
            resetRecording();
        };
        
        recognition.onend = () => {
            resetRecording();
        };
    }
    
    // Reset recording state
    function resetRecording() {
        isRecording = false;
        startBtn.classList.remove('d-none');
        stopBtn.classList.add('d-none');
        
        if (!isBotSpeaking) {
            updateStatus('Ready to listen. Click the microphone to start speaking.', 'alert-info');
        }
    }
    
    // Update status message
    function updateStatus(message, alertClass) {
        statusElement.textContent = message;
        statusElement.className = 'alert';
        statusElement.classList.add(alertClass);
    }
    
    // Send message to the bot
    async function sendMessageToBot(message) {
        try {
            // Add user message to the conversation
            addMessage(message, 'user');
            
            updateStatus('Processing...', 'alert-primary');
            
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ message })
            });
            
            const data = await response.json();
            
            if (!response.ok && !data.response) {
                throw new Error(data.error || 'Server error');
            }
            
            // Add bot message to the conversation
            addMessage(data.response, 'bot');
            
            // If there's an error but we still got a response, show error status
            if (data.error) {
                updateStatus(`Note: ${data.error.substring(0, 100)}...`, 'alert-warning');
            } else {
                // Speak the response if there's no error
                speakText(data.response);
            }
            
        } catch (error) {
            console.error('Error sending message:', error);
            updateStatus(`Error: ${error.message}`, 'alert-danger');
            
            // Add system message about the error
            addMessage("Sorry, there was an error processing your request. Please try again later.", 'system');
        }
    }
    
    // Add a message to the conversation
    function addMessage(text, sender) {
        const messageDiv = document.createElement('div');
        
        // Set the appropriate class based on sender
        if (sender === 'user') {
            messageDiv.className = 'user-message';
        } else if (sender === 'bot') {
            messageDiv.className = 'bot-message';
        } else if (sender === 'system') {
            messageDiv.className = 'system-message';
        }
        
        const paragraph = document.createElement('p');
        paragraph.textContent = text;
        messageDiv.appendChild(paragraph);
        
        conversationElement.appendChild(messageDiv);
        
        // Scroll to the bottom of the conversation
        conversationElement.scrollTop = conversationElement.scrollHeight;
    }
    
    // Speak text using speech synthesis
    function speakText(text) {
        // If currently speaking, stop it
        stopSpeaking();
        
        isBotSpeaking = true;
        interruptBtn.disabled = false;
        updateStatus('Speaking...', 'alert-primary');
        
        // Create a new utterance
        currentUtterance = new SpeechSynthesisUtterance(text);
        
        // Set language and other properties
        currentUtterance.lang = 'en-US';
        currentUtterance.rate = 1.0;
        currentUtterance.pitch = 1.0;
        
        // Add the speaking class to the latest bot message
        const botMessages = document.querySelectorAll('.bot-message');
        if (botMessages.length > 0) {
            const latestBotMessage = botMessages[botMessages.length - 1];
            latestBotMessage.classList.add('speaking');
        }
        
        // Handle events
        currentUtterance.onend = handleSpeechEnd;
        currentUtterance.onerror = (event) => {
            console.error('Speech synthesis error:', event);
            handleSpeechEnd();
        };
        
        // Start speaking
        speechSynthesis.speak(currentUtterance);
    }
    
    // Handle when speech ends
    function handleSpeechEnd() {
        isBotSpeaking = false;
        interruptBtn.disabled = true;
        
        // Remove speaking class from all messages
        document.querySelectorAll('.bot-message').forEach(el => {
            el.classList.remove('speaking');
        });
        
        updateStatus('Ready to listen. Click the microphone to start speaking.', 'alert-info');
    }
    
    // Stop speaking
    function stopSpeaking() {
        if (speechSynthesis && isBotSpeaking) {
            speechSynthesis.cancel();
            handleSpeechEnd();
        }
    }
    
    // Handle interruption
    async function handleInterrupt() {
        try {
            stopSpeaking();
            
            // Notify server of interruption
            const response = await fetch('/api/interrupt', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            
            if (!response.ok) {
                throw new Error('Failed to interrupt');
            }
            
            addMessage("Bot was interrupted.", 'system');
            updateStatus('Interrupted. Ready to listen again.', 'alert-warning');
            
        } catch (error) {
            console.error('Error interrupting:', error);
            updateStatus(`Error: ${error.message}`, 'alert-danger');
        }
    }
    
    // Reset conversation
    async function resetConversation() {
        try {
            // Stop speaking if active
            stopSpeaking();
            
            // Reset recognition if active
            if (isRecording && recognition) {
                recognition.abort();
                resetRecording();
            }
            
            // Clear conversation UI
            conversationElement.innerHTML = `
                <div class="system-message">
                    <p>Conversation has been reset. Start a new conversation!</p>
                </div>
            `;
            
            // Notify server to reset conversation
            const response = await fetch('/api/reset', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            
            if (!response.ok) {
                throw new Error('Failed to reset conversation');
            }
            
            updateStatus('Conversation reset. Ready to listen.', 'alert-info');
            
        } catch (error) {
            console.error('Error resetting conversation:', error);
            updateStatus(`Error: ${error.message}`, 'alert-danger');
        }
    }
    
    // Event listeners
    startBtn.addEventListener('click', () => {
        initSpeechRecognition();
        recognition.start();
    });
    
    stopBtn.addEventListener('click', () => {
        if (recognition) {
            recognition.stop();
        }
    });
    
    interruptBtn.addEventListener('click', handleInterrupt);
    
    resetBtn.addEventListener('click', resetConversation);
    
    // Ensure everything is cleaned up when navigating away
    window.addEventListener('beforeunload', () => {
        if (recognition) {
            recognition.abort();
        }
        stopSpeaking();
    });
});
