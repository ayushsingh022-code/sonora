Sonora 🎵
Discover music. Collaborate asynchronously. Build something together.
Sonora is a music creator platform prototype built around a simple idea: any performance can become the starting point for a collaboration. Creators can discover musicians, share performances, add their own musical parts, and explore how a collaborative version grows from an original through Song DNA.
Why Sonora?
Music collaboration often starts with a spark: a voice, a guitar riff, a beat, or a short performance. Sonora explores how that spark can travel between creators—without requiring everyone to be online at the same time.
Core experience
Circle — A creator feed for discovering performances and sharing posts.
Explore — Discover artists, performances, instruments, and genres.
Add Part — Contribute a video performance to an existing post by selecting a musical role and uploading a take.
Song DNA — Explore the relationship between an original performance and its collaborative versions.
Link — A space for conversations and collaboration-related interactions.
Stage — A musician profile for showcasing tracks, collaborations, and creative identity.
AI-powered features
Sonora includes prototype integrations for three Gemini-powered experiences:
AI Music Copilot — Creative guidance and ideas for a contribution.
AI Song DNA Guide — Help understanding a song’s collaboration lineage.
AI Collaboration Matchmaker — Suggestions intended to help creators find potential collaborators.
AI requests require a valid Gemini API key and available API quota. Availability and output quality depend on the configured API and should be tested in the target environment.
Technology stack
React 19, TypeScript, Vite
Tailwind CSS 4 and Motion
Node.js and Express
Google Gemini API through `@google/genai`
Browser video APIs and HTML5 video playback
Run locally
Requirements
Node.js and npm
A Gemini API key for live AI features
Setup
Clone the repository:
```bash
   git clone https://github.com/ayushsingh022-code/sonora.git
   cd sonora
   ```
Install dependencies:
```bash
   npm install
   ```
Create a `.env` file in the project root and add your key:
```env
   GEMINI_API_KEY=your_gemini_api_key_here
   ```
Never commit your real `.env` file or API key. Keep secrets in environment variables.
Start the development server using the script defined in `package.json`:
```bash
   npm run dev
   ```
If the project scripts have changed, check `package.json` for the current commands.
Prototype notes and limitations
Sonora is an evolving prototype. Some capabilities are demonstrations rather than production-ready services.
Data such as posts and collaboration state may be stored in browser `localStorage`; it is not yet a reliable shared database across users and devices.
Uploaded media may use temporary browser object URLs and may not remain available after a refresh or browser session.
Real user authentication and production-grade access controls need to be implemented and validated before a public production launch.
Record Take is marked as coming soon.
Synchronized, real-time jamming is a future direction; the current collaboration concept is asynchronous.
AI Matchmaker results and all AI flows should be validated with a configured Gemini API key and live API access.
Do not use this prototype to store sensitive personal information or assume production-level availability, persistence, security, or moderation.
Roadmap
Add persistent shared data storage.
Add permanent cloud video storage and reliable media delivery.
Implement authentication, authorization, and content moderation.
Improve AI reliability and validate collaborator matching.
Explore in-app recording and synchronized live jamming.
Strengthen contribution attribution, consent, and copyright workflows.
Copyright and attribution
Sonora is designed to support creator collaboration. Users should upload only content they own or have permission to use, respect the rights of other artists, and agree on attribution and consent before publishing collaborative work. Any example media included with a demo should be used in accordance with its applicable rights and permissions.
Project links
GitHub repository: https://github.com/ayushsingh022-code/sonora
Live prototype: https://sonora-9998.ai.studio
Demo video: https://drive.google.com/file/d/1-5nWuJqCBRY1qsqwHhuuTFycVxDyQgpf/view?usp=sharing 
Acknowledgements
Built as an exploration of music, creativity, and AI. With gratitude to Google and Hack2skill for the opportunity to turn an idea into a working prototype.
---
Sonora is a prototype project. Features, architecture, and availability may change as development continues.
