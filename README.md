# SPEAKAI-LLM-Bot

This is an interactive conversational bot that listens to spoken input, processes it using Google's Gemini AI model, and responds with spoken output. The bot includes interruption capabilities during conversations.

## Features

- Speech input using the browser's microphone
- Text processing with Google's Gemini AI model
- Text-to-speech output
- Interruption capability during conversations
- Conversation history tracking
- Easy-to-use web interface

## Setup Instructions (Step by Step)

### Prerequisites

- Python 3.8 or higher
- A code editor (like VS Code, Sublime Text, etc.)
- An internet connection
- A Google Gemini API key (free to obtain)

### Step 1: Download the Project

1. **Option 1:** Download the project as a zip file
   - Click on the "Download ZIP" button on the GitHub repository
   - Extract the ZIP file to a folder on your computer

2. **Option 2:** Clone the repository using Git
   - Open a terminal or command prompt
   - Run `git clone [repository-url]` (replace with the actual URL)
   - Navigate to the project folder with `cd speech-to-speech-bot`

### Step 2: Set Up a Virtual Environment (Optional but Recommended)

1. Open a terminal or command prompt
2. Navigate to the project folder
3. Create a virtual environment:
   - **Windows:** `python -m venv venv`
   - **Mac/Linux:** `python3 -m venv venv`
4. Activate the virtual environment:
   - **Windows:** `venv\Scripts\activate`
   - **Mac/Linux:** `source venv/bin/activate`

### Step 3: Install Dependencies

1. With your virtual environment activated, run:
   ```
   pip install flask flask-sqlalchemy google-generativeai gunicorn
   ```

### Step 4: Get a Google Gemini API Key

1. Go to https://aistudio.google.com/app/apikey
2. Sign in with your Google account
3. Click "Create API Key"
4. Copy the API key that is generated

### Step 5: Set Up Environment Variables

1. Create a file named `.env` in the project root folder
2. Add the following line to the file:
   ```
   GOOGLE_API_KEY=your_api_key_here
   ```
   (Replace "your_api_key_here" with the actual API key you copied)

### Step 6: Run the Application

1. In your terminal or command prompt (with virtual environment activated), run:
   - **Windows:** `python app.py`
   - **Mac/Linux:** `python3 app.py`
2. You should see a message saying the server is running on http://0.0.0.0:5000
3. Open your web browser and go to `http://localhost:5000`

## How to Use the Bot

1. **Start a Conversation**
   - Click the microphone button
   - Speak your question or message
   - The bot will process your speech and respond verbally

2. **Interrupt the Bot**
   - If you want to stop the bot while it's speaking, click the "Interrupt" button
   - This allows you to ask a new question without waiting for the current response to finish

3. **Reset the Conversation**
   - To start a fresh conversation, click the "Reset" button
   - This clears the conversation history

## Troubleshooting

- **Microphone Not Working**
  - Make sure your browser has permission to access your microphone
  - Try using Chrome or Edge, which have better speech recognition support

- **API Key Issues**
  - Verify that your Google API key is correct in the `.env` file
  - Make sure you have credits available on your Google Cloud account

- **Server Won't Start**
  - Check if you have another application using port 5000
  - Try changing the port in `app.py` (look for `app.run` and change the port number)

- **"Module Not Found" Errors**
  - Make sure you've installed all dependencies with `pip install`
  - Verify your virtual environment is activated

## File Structure Explanation

- `app.py`: The main Flask application with API routes and Gemini integration
- `main.py`: Entry point for the application (calls app.py)
- `templates/index.html`: The web interface HTML
- `static/css/custom.css`: Custom styling for the web interface
- `static/js/app.js`: JavaScript for speech recognition and the interface

## Need Help?

If you encounter any issues, please:
1. Check the troubleshooting section above
2. Look for error messages in the terminal where the server is running
3. Make sure your API key is valid and has available quota

## License

This project is licensed under the MIT License - see the LICENSE file for details.
