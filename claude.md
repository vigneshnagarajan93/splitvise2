# Project: SplitNotion (Splitwise Clone)
# Tech Stack
- Frontend: React 18, Vite, Tailwind CSS, Lucide React (for icons).
- Backend: Netlify Serverless Functions (Node.js).
- Database: Notion API (`@notionhq/client`).
- Deployment: Netlify.

# Architecture Rules
1. NEVER call the Notion API from the React frontend. All Notion calls must go through `/netlify/functions/`.
2. Use modern React functional components and hooks.
3. Keep the UI mobile-first and clean.
4. Environment variables (`VITE_NOTION_API_KEY`, `VITE_NOTION_DB_ID`) must be handled securely via Netlify's context.

# Swarm Guidelines
- When generating code, ensure complete error handling (especially for Notion API rate limits).
- Build the backend proxy functions first, then the frontend services, then the UI.