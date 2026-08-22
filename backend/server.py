import os
import sys
import gc
from pathlib import Path
import uvicorn

# Load .env file
env_path = Path(__file__).resolve().parent.parent / ".env"
if env_path.exists():
    with open(env_path, "r", encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if line and not line.startswith("#") and "=" in line:
                k, v = line.split("=", 1)
                os.environ[k.strip()] = v.strip().strip('"').strip("'")

from backend.main import app

def start_server(port: int = 8000, enable_ngrok: bool = True):
    # Dynamic port binding for Render/Heroku/Cloud ($PORT)
    env_port = os.environ.get("PORT")
    if env_port:
        try:
            port = int(env_port)
        except ValueError:
            pass

    # Check if running in cloud (Render, Heroku, Container)
    is_cloud = bool(os.environ.get("RENDER") or os.environ.get("PORT") or os.environ.get("DYNO"))

    ngrok_token = os.environ.get("NGROK_AUTHTOKEN", "")
    public_url = None

    # Only run Ngrok locally — never on Render/Cloud (saves ~150MB RAM to stay under 512MB limit)
    if enable_ngrok and ngrok_token and not is_cloud:
        try:
            from pyngrok import ngrok
            ngrok.set_auth_token(ngrok_token)
            tunnels = ngrok.get_tunnels()
            if tunnels:
                public_url = tunnels[0].public_url
            else:
                tunnel = ngrok.connect(port, proto="http")
                public_url = tunnel.public_url

            print("\n" + "=" * 70)
            print(f"🚀 NGROK PUBLIC TUNNEL LIVE: {public_url}")
            print(f"📱 FLUTTER CLI RUN COMMAND:")
            print(f"   flutter run -d windows --dart-define=API_BASE_URL={public_url}")
            print("=" * 70 + "\n")
        except Exception as e:
            print(f"⚠️ Ngrok tunnel: {e}")
    elif is_cloud:
        print(f"[server] Running in cloud environment on port {port}. Ngrok tunnel disabled to optimize memory.")

    gc.collect()
    uvicorn.run(app, host="0.0.0.0", port=port, log_level="info")

if __name__ == "__main__":
    start_server()

