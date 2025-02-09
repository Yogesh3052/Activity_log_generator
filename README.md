# Activity Log Generator

A simple Python application that logs activities to Google Sheets with timestamps.

## Setup Instructions

1. Install the required dependencies:
   ```
   pip install -r requirements.txt
   ```

2. Set up Google Sheets API:
   - Go to the [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project or select an existing one
   - Enable the Google Sheets API
   - Go to Credentials
   - Create credentials (OAuth 2.0 Client ID)
   - Download the client configuration file
   - Rename it to `credentials.json` and place it in the same directory as the script

The Google Sheet will be automatically accessed with the following columns:
- Column A: Date (YYYY-MM-DD)
- Column B: Day (e.g., Monday, Tuesday)
- Column C: Time (HH:MM:SS)
- Column D: Activity

## Usage

1. Run the script:
   ```
   python activity_logger.py
   ```

2. Start logging activities:
   - Type your activity and press Enter
   - The activity will be logged with the current date, day, and time
   - Press Ctrl+C to exit

## Notes

- The first time you run the application, it will open a browser window for Google OAuth authentication
- Your credentials will be saved in `token.pickle` for future use
- Make sure you have access to the configured Google Sheet