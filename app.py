import os
import logging
import json
import queue
from flask import Flask, render_template, request, jsonify
import google.generativeai as genai

# Configure logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

# Initialize Flask app
app = Flask(__name__)
app.secret_key = os.environ.get("SESSION_SECRET", "default_secret_key")

# Google Gemini API setup
GOOGLE_API_KEY = os.environ.get("GOOGLE_API_KEY")
genai.configure(api_key='Enter Your Google API Key')

# Get Gemini model
generation_config = {
    "temperature": 0.7,
    "top_p": 0.95,
    "top_k": 64,
    "max_output_tokens": 2048,
}

# Initialize the Gemini model
gemini_model = genai.GenerativeModel(
    model_name="gemini-1.5-pro",
    generation_config=generation_config,
)

# Initialize global variables
# Use a global variable for conversation history with proper scope
conversation_history = []
# Queue for handling interruptions
interruption_queue = queue.Queue()
current_response = None

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/chat', methods=['POST'])
def chat():
    # Declare global variable
    global conversation_history
    
    try:
        data = request.json
        user_input = data.get('message', '')
        
        if not user_input:
            return jsonify({'error': 'Empty message'}), 400
        
        # Add user message to conversation history
        conversation_history.append({"role": "user", "parts": [user_input]})
        
        try:
            # Create a properly formatted conversation history for Gemini
            gemini_history = []
            
            # Include initial system message
            system_message = {"role": "model", "parts": ["You are a helpful conversational assistant. Keep your responses concise but informative."]}
            gemini_history.append(system_message)
            
            # Add the rest of the conversation
            for msg in conversation_history:
                # Convert our internal format to Gemini's expected format
                role = "user" if msg.get("role") == "user" else "model"
                content = msg.get("parts", [msg.get("content", "")])[0]
                gemini_history.append({"role": role, "parts": [content]})
            
            # Generate response using Gemini API
            chat = gemini_model.start_chat(history=gemini_history)
            response = chat.send_message(user_input)
            
            bot_response = response.text
            
            # Add bot response to conversation history
            conversation_history.append({"role": "assistant", "parts": [bot_response]})
            
            # If the conversation history gets too long, trim it to save tokens
            if len(conversation_history) > 10:
                # Keep the last 10 messages
                conversation_history = conversation_history[-10:]
            
            return jsonify({
                'response': bot_response
            })
        
        except Exception as api_error:
            error_msg = str(api_error)
            logger.error(f"Gemini API Error: {error_msg}")
            
            if "quota" in error_msg.lower() or "rate limit" in error_msg.lower():
                error_response = "I'm sorry, I'm currently unable to respond due to API quota limitations. Please try again later or check the API key settings."
            else:
                error_response = "I encountered an error while generating a response. Please try again."
            
            # Add error response to conversation history
            conversation_history.append({"role": "assistant", "parts": [error_response]})
            
            return jsonify({
                'response': error_response,
                'error': error_msg
            })
    
    except Exception as e:
        logger.error(f"Error in chat endpoint: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/interrupt', methods=['POST'])
def interrupt():
    try:
        # Signal to stop current response
        interruption_queue.put(True)
        return jsonify({'status': 'Interrupted successfully'})
    except Exception as e:
        logger.error(f"Error in interrupt endpoint: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/reset', methods=['POST'])
def reset_conversation():
    # Declare global variable
    global conversation_history
    
    try:
        # Clear the conversation history
        conversation_history.clear()
        return jsonify({'status': 'Conversation reset successfully'})
    except Exception as e:
        logger.error(f"Error in reset endpoint: {str(e)}")
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
