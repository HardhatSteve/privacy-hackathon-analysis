import sys
from pathlib import Path

# Use backend modules from frontend root (copied from project root at build via package.json prebuild)
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from backend_api import app as fastapi_app

# Vercel routes /api/analyze-wallet to this function
# The FastAPI app defines the route as /analyze-wallet,
# so we strip the /api prefix here before dispatching
async def app(scope, receive, send):
    if scope.get("type") in ("http", "websocket"):
        path = scope.get("path") or ""
        # Remove /api prefix if present
        if path == "/api/analyze-wallet":
            path = "/analyze-wallet"
        elif path.startswith("/api/"):
            path = path[4:]  # remove leading "/api"

        if path != scope.get("path"):
            scope = dict(scope)
            scope["path"] = path

    await fastapi_app(scope, receive, send)
