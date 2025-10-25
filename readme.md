# Voice AI ROI Demo

Quickstart
1. Clone repo or import to Replit.
2. In project root run:
   - npm run install:all
   - npm run dev
3. Open the Replit web preview or http://localhost:3000

Project structure
- src/server: Express API and server
- src/client: Vite + React app (calculator UI)
- profiles.json: prefilled shop profiles

Notes
- Add secrets (Assistable, GoHighLevel, Twilio) in Replit Secrets, not in source.
- For production, build client (npm run build) and serve static files from the server.
