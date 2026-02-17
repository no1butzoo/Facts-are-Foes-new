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
4. **Administrators**: Platform managers who moderate content

## Core Requirements (Static)
- [x] Browse/discover controversial facts with explanations
- [x] User submissions of controversial facts
- [x] Categories/tags (science, history, health, nature, space, food, technology, psychology)
- [x] Full user accounts with profiles
- [x] AI-generated explanations for facts (Gemini 3 Flash)
- [x] Voting/rating system

## Implementation Status (Jan 2026)

### Phase 1 - MVP (Completed)
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

### Phase 2 - Premium Features (Completed)
- ✅ **Social Sharing** - Twitter, Facebook, LinkedIn, Copy Link buttons
- ✅ **Engagement Tracking** - View counts, share counts, platform breakdown
- ✅ **Admin Panel** - Full moderation dashboard
  - Platform statistics (users, facts, votes, views, shares)
  - 7-day engagement timeline chart
  - User management (view, delete)
  - Fact moderation (feature/unfeature, delete)
  - Top performing facts leaderboard
  - Category distribution analytics
  - Recent activity metrics

### API Endpoints
**Auth:**
- POST /api/auth/register - User registration
- POST /api/auth/login - User login
- GET /api/auth/me - Get current user

**Facts:**
- GET /api/facts - List facts (with filters)
- GET /api/facts/{id} - Get single fact
- POST /api/facts - Create new fact
- PUT /api/facts/{id} - Update fact
- DELETE /api/facts/{id} - Delete fact
- POST /api/facts/{id}/vote - Vote on fact
- POST /api/facts/{id}/explain - Generate AI explanation
- GET /api/facts/{id}/engagement - Get fact engagement stats

**Engagement:**
- POST /api/engagement - Track engagement events

**Admin:**
- GET /api/admin/stats - Platform statistics
- GET /api/admin/users - List all users
- GET /api/admin/facts - List all facts (with pagination)
- PUT /api/admin/facts/{id}/feature - Toggle feature status
- DELETE /api/admin/facts/{id} - Delete fact
- DELETE /api/admin/users/{id} - Delete user
- GET /api/admin/engagement/timeline - 7-day engagement timeline

**Other:**
- GET /api/categories - List categories
- GET /api/users/{id}/facts - Get user's facts
- GET /api/users/{id}/stats - Get user stats
- POST /api/seed - Seed sample data

## Prioritized Backlog

### P0 (Critical) - DONE
- All core features + premium features implemented

### P1 (High Priority) - Future
- Email verification flow
- Password reset functionality
- Comment system on facts

### P2 (Medium Priority) - Future
- Badge/achievement system
- Fact bookmarking
- Advanced search filters
- User following system

### P3 (Nice to Have) - Future
- Notification system
- Related facts suggestions
- Mobile app (React Native)
- Dark/light theme toggle

## Value Proposition for Sale
- **Turnkey Solution**: Fully functional myth-busting platform
- **AI-Powered**: Gemini 3 Flash integration for automatic explanations
- **Analytics Ready**: Built-in engagement tracking and admin dashboard
- **Social Viral**: Share buttons for maximum distribution
- **Scalable**: MongoDB + FastAPI architecture
- **Modern UI**: Egyptian space theme, responsive design
