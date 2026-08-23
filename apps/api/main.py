from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from routers import resume, interview, feedback, gratitude, resume_builder, placement_analysis, billing, admin
import os
import sentry_sdk

if os.environ.get("SENTRY_DSN"):
    sentry_sdk.init(
        dsn=os.environ.get("SENTRY_DSN"),
        traces_sample_rate=1.0,
        profiles_sample_rate=1.0,
    )

app = FastAPI(title="AI Interview Coach API", version="1.0.0")
class CORSStaticFiles(StaticFiles):
    async def get_response(self, path: str, scope):
        response = await super().get_response(path, scope)
        response.headers["Access-Control-Allow-Origin"] = "*"
        response.headers["Access-Control-Allow-Methods"] = "GET, OPTIONS"
        response.headers["Access-Control-Allow-Headers"] = "*"
        response.headers["Content-Disposition"] = "inline"
        return response

casebooks_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "data/casebooks"))
os.makedirs(casebooks_dir, exist_ok=True)
app.mount("/casebooks", CORSStaticFiles(directory=casebooks_dir), name="casebooks")

# Configure CORS for Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(resume.router)
app.include_router(resume_builder.router)
app.include_router(interview.router)
app.include_router(feedback.router)
app.include_router(gratitude.router)
app.include_router(placement_analysis.router)
app.include_router(billing.router)
app.include_router(admin.router)

from dependencies import limiter
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

@app.get("/")
def read_root():
    return {"status": "ok", "message": "AI Interview Coach API is running"}

@app.get("/debug-sentry")
async def sentry_debug():
    # Intentionally raise an error to verify Sentry setup
    raise Exception("Test error to verify Sentry integration from backend!")

    
if __name__ == "__main__":
    import uvicorn
    import os
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port, proxy_headers=True, forwarded_allow_ips="*")
