from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from datetime import datetime
import os
import logging
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow
from google.auth.transport.requests import Request
from googleapiclient.discovery import build
import pickle
from pydantic import BaseModel

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="Activity Logger API")

# Enable CORS - Allow all origins during development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins during development
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"]
)

# Google Sheets Configuration
SCOPES = ['https://www.googleapis.com/auth/spreadsheets']
SPREADSHEET_ID = '1fmcRrLH57ZDlGSWpEKTdazPYrzOSybcdKize61C8X8Q'
CREDENTIALS_FILE = os.path.join(os.path.dirname(__file__), 'credentials.json')

class Activity(BaseModel):
    activity: str

def check_credentials_file():
    if not os.path.exists(CREDENTIALS_FILE):
        logger.error(f"Credentials file '{CREDENTIALS_FILE}' not found!")
        raise HTTPException(
            status_code=500,
            detail="Google Sheets credentials not found. Please make sure credentials.json is present in the backend directory."
        )

def get_google_sheets_service():
    try:
        check_credentials_file()
        
        creds = None
        token_path = os.path.join(os.path.dirname(__file__), 'token.pickle')
        
        if os.path.exists(token_path):
            try:
                with open(token_path, 'rb') as token:
                    creds = pickle.load(token)
                logger.info("Loaded existing credentials from token.pickle")
            except Exception as e:
                logger.error(f"Error loading token.pickle: {str(e)}")
                if os.path.exists(token_path):
                    os.remove(token_path)
                    logger.info("Removed corrupted token.pickle")
    
        if not creds or not creds.valid:
            if creds and creds.expired and creds.refresh_token:
                try:
                    creds.refresh(Request())
                    logger.info("Refreshed expired credentials")
                except Exception as e:
                    logger.error(f"Error refreshing credentials: {str(e)}")
                    creds = None
            
            if not creds:
                try:
                    flow = InstalledAppFlow.from_client_secrets_file(
                        CREDENTIALS_FILE, SCOPES)
                    creds = flow.run_local_server(
                        port=8080,
                        success_message='Authentication successful! You can close this window.',
                        open_browser=True,
                        access_type='offline',  # This ensures we get a refresh token
                    )
                    logger.info("Created new credentials through OAuth flow")
                    
                    # Save the credentials for the next run
                    with open(token_path, 'wb') as token:
                        pickle.dump(creds, token)
                        logger.info("Saved new credentials to token.pickle")
                except Exception as e:
                    logger.error(f"Error in OAuth flow: {str(e)}")
                    raise HTTPException(
                        status_code=500,
                        detail=f"Authentication error: {str(e)}. Please check your Google Sheets credentials."
                    )

        return build('sheets', 'v4', credentials=creds)
    except Exception as e:
        logger.error(f"Error in get_google_sheets_service: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to initialize Google Sheets service: {str(e)}"
        )

@app.get("/")
async def read_root():
    return {"message": "Activity Logger API is running"}

@app.get("/health")
async def health_check():
    try:
        # Check if we can access Google Sheets
        check_credentials_file()
        service = get_google_sheets_service()
        return {"status": "healthy", "sheets_connected": True}
    except Exception as e:
        logger.error(f"Health check failed: {str(e)}")
        return {
            "status": "unhealthy",
            "sheets_connected": False,
            "error": str(e)
        }

@app.post("/api/log-activity")
async def log_activity(activity: Activity):
    try:
        service = get_google_sheets_service()
        
        # Get current timestamp components
        now = datetime.now()
        date = now.strftime("%Y-%m-%d")
        day = now.strftime("%A")
        time = now.strftime("%I:%M:%S %p")
        
        # Prepare the data
        values = [[day, date, time, activity.activity]]
        body = {'values': values}
        
        # Append to spreadsheet
        result = service.spreadsheets().values().append(
            spreadsheetId=SPREADSHEET_ID,
            range='Sheet1!A:D',
            valueInputOption='RAW',
            insertDataOption='INSERT_ROWS',
            body=body
        ).execute()
        
        logger.info(f"Successfully logged activity: {activity.activity}")
        return {"message": "Activity logged successfully", "result": result}
    
    except Exception as e:
        logger.error(f"Error logging activity: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to log activity: {str(e)}"
        )

@app.get("/api/activities")
async def get_activities(limit: int = 10):
    try:
        service = get_google_sheets_service()
        
        # Get the last {limit} activities
        result = service.spreadsheets().values().get(
            spreadsheetId=SPREADSHEET_ID,
            range=f'Sheet1!A2:D{limit+1}',
        ).execute()
        
        values = result.get('values', [])
        activities = []
        
        for row in values:
            if len(row) >= 4:
                activities.append({
                    "day": row[0],
                    "date": row[1],
                    "time": row[2],
                    "activity": row[3]
                })
        
        return activities
    
    except Exception as e:
        logger.error(f"Error fetching activities: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch activities: {str(e)}"
        )

if __name__ == "__main__":
    logger.info("Starting Activity Logger API...")
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True) 