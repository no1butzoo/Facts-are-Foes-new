# Facts Are Foes - PRD

## Original Problem Statement
Build a controversy app called "Facts are Foes" based on facts that turned out to be foes.

## User Choices
- Categories/tags for different types of controversies (science, history, health, etc.)
- Both pre-populated + user submissions
- AI-powered explanations using Gemini 3 Flash
- Full user accounts with profiles
- Dark mode with Egyptian theme in space

## Architecture
- **Frontend**: React 19 + Tailwind CSS + Shadcn/UI
- **Backend**: FastAPI (Python)
- **Database**: MongoDB
- **AI Integration**: Gemini 3 Flash via emergentintegrations
- **Auth**: JWT-based authentication

## User Personas
1. **Myth Hunters**: Users who browse and discover debunked facts
2. **Truth Seekers**: Users who submit new controversial facts
3. **Knowledge Sharers**: Users who engage by voting and sharing

## Core Requirements (Static)
- [x] Browse/discover controversial facts with explanations
- [x] User submissions of controversial facts
- [x] Categories/tags (science, history, health, nature, space, food, technology, psychology)
- [x] Full user accounts with profiles
- [x] AI-generated explanations for facts (Gemini 3 Flash)
- [x] Voting/rating system

## Implementation Status (Jan 2026)

### Completed Features
- ✅ Egyptian Space Theme (Osiris-9 Design System)
- ✅ Landing page with animated hero section
- ✅ Category browsing with 8 categories
- ✅ Facts exploration with search & filters
- ✅ Fact detail pages with myth/truth sections
- ✅ AI explanation generation via Gemini 3 Flash
- ✅ User authentication (register/login)
- ✅ User profiles with stats
- ✅ Fact submission system
- ✅ Voting system (upvote/downvote)
- ✅ Pre-populated sample facts (8 seed myths)
- ✅ Responsive design
- ✅ Glass-morphism navigation
- ✅ Cinzel + Space Grotesk typography

### API Endpoints
- POST /api/auth/register - User registration
- POST /api/auth/login - User login
- GET /api/auth/me - Get current user
- GET /api/facts - List facts (with filters)
- GET /api/facts/{id} - Get single fact
- POST /api/facts - Create new fact
- PUT /api/facts/{id} - Update fact
- DELETE /api/facts/{id} - Delete fact
- POST /api/facts/{id}/vote - Vote on fact
- POST /api/facts/{id}/explain - Generate AI explanation
- GET /api/categories - List categories
- GET /api/users/{id}/facts - Get user's facts
- GET /api/users/{id}/stats - Get user stats

## Prioritized Backlog

### P0 (Critical) - DONE
- All core features implemented

### P1 (High Priority) - Future
- Social sharing buttons
- Fact comments/discussions
- Admin moderation panel
- Email verification

### P2 (Medium Priority) - Future
- Leaderboard for top contributors
- Badge/achievement system
- Fact bookmarking
- Advanced search filters

### P3 (Nice to Have) - Future
- Dark/light theme toggle
- Notification system
- Related facts suggestions
- Mobile app

## Next Tasks
1. Add social sharing functionality
2. Implement comments section on facts
3. Create admin dashboard for moderation
4. Add email verification flow
