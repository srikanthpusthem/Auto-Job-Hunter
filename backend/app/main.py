from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.core.config import settings
from backend.app.routes import users, jobs, dashboard
from backend.db.mongo import db

app = FastAPI(title="Auto Job Hunter API", version="1.0.0")

# Database lifecycle events
@app.on_event("startup")
async def startup_event():
    db.connect()

@app.on_event("shutdown")
async def shutdown_event():
    db.close()

# CORS Configuration
# Allow localhost and local network IPs (192.168.x.x, 10.x.x.x, 172.16-31.x.x)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_origin_regex=r"http://(localhost|127\.0\.0\.1|192\.168\.\d+\.\d+|10\.\d+\.\d+\.\d+|172\.(1[6-9]|2[0-9]|3[0-1])\.\d+\.\d+):\d+",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(users.router)
app.include_router(jobs.router)
app.include_router(dashboard.router)

@app.get("/")
async def root():
    return {"message": "Auto Job Hunter API", "version": "1.0.0"}

@app.get("/health")
async def health_check():
    return {"status": "healthy"}
