from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from routers import resume, interview, feedback, gratitude
import os

app = FastAPI(title="AI Interview Coach API", version="1.0.0")

# Mount static files to serve the PDFs directly to the frontend
casebooks_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../data/casebooks"))
try:
    os.makedirs(casebooks_dir, exist_ok=True)
except OSError:
    # Fallback for containerized environments (like Railway) where ../../ escapes the /app boundary
    casebooks_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "data/casebooks"))
    os.makedirs(casebooks_dir, exist_ok=True)
app.mount("/casebooks", StaticFiles(directory=casebooks_dir), name="casebooks")

# Configure CORS for Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(resume.router)
app.include_router(interview.router)
app.include_router(feedback.router)
app.include_router(gratitude.router)

@app.get("/")
def read_root():
    return {"status": "ok", "message": "AI Interview Coach API is running"}
    
