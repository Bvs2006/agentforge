from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import api_gateway, auth, agent_service, knowledge_agents
import uvicorn

app = FastAPI(
    title="AgentForge API",
    description="No-Code AI Automation Platform using IBM Technologies",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_gateway.router, prefix="/api/v1", tags=["API Gateway"])
app.include_router(auth.router, prefix="/auth", tags=["Auth"])
app.include_router(agent_service.router, prefix="/agent", tags=["Agent Service"])
app.include_router(knowledge_agents.router, prefix="/knowledge", tags=["Knowledge Agents"])

@app.get("/")
async def root():
    return {"message": "AgentForge API is running", "version": "1.0.0"}

@app.get("/health")
async def health():
    return {"status": "healthy"}

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
