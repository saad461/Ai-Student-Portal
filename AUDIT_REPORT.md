# AUDIT REPORT: THE DAURIX PROJECT

## 1. Public & Security Audit (Guest View)

### 1.1 Security Findings
- **CRITICAL: Dashboard Bypass**: Non-logged-in users can access the `/dashboard` route directly. Although the middleware is intended to redirect unauthenticated users to `/`, it appears to be failing or allowing the page to render before redirection.
    - *Observation*: Navigating to `/dashboard` while logged out displays the Dashboard UI (including the "Welcome to Daurix" tour modal) instead of redirecting.
- **Admin Access**: The `/admin` route correctly redirects to `/admin/login` for unauthorized users.

### 1.2 UI/UX Consistency (Public Pages)
- **Landing Page**:
    - The high-contrast dark theme is consistent and visually strong.
    - **Weakness**: "Features" and "Roadmap" links in the header are empty placeholders (`href="#"`).
- **Enroll Page**:
    - The multi-step form is visually appealing but has a slow "Initialization" feel.
    - **UX Issue**: The Captcha is required at the very end, which might frustrate users if they fail it after filling out 3 pages of data.
- **Login Page**:
    - Integrated `UnifiedLoginForm` is functional and matches the aesthetic.

### 1.3 Performance
- **Initial Load**: Public pages load relatively quickly (under 2s), but the dynamic background and mesh gradients cause some layout shift during hydration.

## 2. Student Portal Audit

### 2.1 Dashboard
- **Performance Issue**: The dashboard performs ~10 sequential `await` Supabase calls in `fetchData`. This creates a massive network waterfall, contributing significantly to the 6-second load time.
- **Security Vulnerability**: The "Skip Lecture" feature uses a hardcoded PIN `7323` in the client-side code (`src/app/(portal)/dashboard/page.tsx`). Any student can find this by inspecting the source.
- **UI/UX**:
    - Mastery Radar defaults to non-zero values even for new students, which is misleading.
    - Achievements logic is entirely client-side; achievements are "unlocked" and saved to the database by the client browser.

### 2.2 Library & Skill Shop
- **CRITICAL BUG: Free Library Items**: In `src/app/(portal)/library/page.tsx`, the `handlePurchase` function manually inserts into `user_resources` WITHOUT deducting any XP/Sparks. In contrast, the Skill Shop correctly uses a server action to deduct points. Students can currently "buy" everything in the Library for free.
- **UX**: Shop items have inconsistent pricing (some hardcoded at 2500, others from `SHOP_ITEMS` constant).

### 2.3 Lecture Page
- **Functional**: The reading timer, Knowledge Check (Rich Text), and AI Review trigger are working.
- **UX Improvement**: Navigation between tabs (Theory -> Assignment -> KC -> Quiz) is strictly sequential, which is good for learning flow but can be frustrating if a student wants to check the quiz questions first to know what to focus on.

### 2.4 Daily Bounty
- **Logic**: Works correctly using an AI verification endpoint.
- **Uniqueness**: Successfully enforces daily limits via `localStorage` and backend `reward_log` (keyed by date).
- **Reward**: Correctly awards XP based on the bounty difficulty.

### 2.5 Attendance System
- **Functionality**: Uses a 15-minute active threshold (`ATTENDANCE_THRESHOLD = 900s`).
- **Persistence**: Cleverly uses `localStorage` to track progress across tabs and syncs with `attendance_progress` table.
- **Reward**: Correctly awards 10 XP per day.

### 2.6 Feature Gaps (Placeholders)
- **Career Path**: "Github Mastery" status is hardcoded as "OFFLINE".
- **Interview Prep**: Functional AI chat, but "Voice" relies on browser `speechSynthesis` which is often unreliable/robotic.
- **Github Mastery**: Mostly static content; lacks deep integration with actual GitHub APIs beyond the submission link.
- **Roadmap**: Contains hardcoded branding ("Zohan Ali & Professional Roadmap") which might need to be dynamic or updated to "Daurix Project".

## 3. Admin Dashboard Audit

### 3.1 Overview & UI
- **Consistency**: The Admin UI follows the dark Daurix aesthetic.
- **Functional Tabs**: Students, Applications, Courses, Content, Structure, Library, and Challenges tabs are all functional.
- **Support System**: Real-time chat with students is implemented using Supabase Presence and Realtime. Video call integration with `VideoCallRoom` is present.

### 3.2 Submission Review Flow
- **Detailed Review**: Admins can see sectional scores (KC, Assignment, Quiz).
- **AI Integration**: "Quick AI Pre-fill" feature is present and calls `/api/review`.
- **UX Issue**: When reviewing a submission, the status "extra_task_assigned" maps to "Re-submit (No Points)", but there is no easy way to actually assign a specific "Extra Task" from the same interface; it's just a status change.

### 3.3 Security & Logic
- **Admin Password**: Default is 'admin123' if env var is missing.
- **Persistence**: Admin authentication relies on a cookie `admin_access` and local storage `admin_auth`.
- **Database Access**: Uses `supabaseAdmin` (Service Role) for several actions, which is powerful but needs careful handling to avoid accidental data exposure.

## 4. Performance & Technical Deep Dive

### 4.1 Portal Load Speed Analysis (The "6-Second" Delay)
The reported 6-second load time is primarily caused by a "Network Waterfall" in the frontend's initialization logic.
- **Sequential Data Fetching**: In `src/app/(portal)/dashboard/page.tsx`, the `fetchData` function executes ~10 independent Supabase queries using `await` sequentially.
    - *Impact*: If each query takes 300ms, the total time is 3+ seconds just for data fetching, plus middleware and component rendering time.
    - *Fix*: Wrap independent queries in `Promise.all()`.
- **Middleware Latency**: `middleware.ts` calls `supabase.auth.getUser()` on every request. While necessary for security, it adds a round-trip to Supabase before any page can even begin loading.
- **Heavy Client-Side Logic**: Components like `KnowledgeRadar` and `Achievements` process large datasets on the main thread during hydration.

### 4.2 Technical Security Audit
- **Supabase RLS Bypass Risk**: Several server actions in `src/app/admin/actions.ts` use the `SUPABASE_SERVICE_ROLE_KEY`. If a user can trigger these actions with arbitrary IDs (e.g., `rewardStudentAction` accepting a `studentId`), they could potentially reward themselves or others if the `authorizeAdmin()` check is bypassed or misconfigured.
- **Client-Side Validation**: The "Daily Bounty" verification happens via a POST request to `/api/verify-bounty`, but the reward itself is triggered by the client calling `rewardStudentAction`. A malicious user could call the reward action directly via the console.
- **Hardcoded Logic**:
    - **Skip PIN**: `7323` is hardcoded in the frontend.
    - **Course Pricing**: `price = 2500` is hardcoded in `shop/page.tsx` for premium courses.

### 4.3 Codebase Health (Placeholders & TODOs)
- **Library Leaks**: The Library page allows "purchasing" resources without deducting XP/Sparks, unlike the Skill Shop.
- **Hardcoded Branding**: Found hardcoded names in `Roadmap` and `Footer` areas.
- **Missing Backends**:
    - "Github Mastery" steps are mostly static UI.
    - "Career Center" readiness badges are calculated purely on client-side XP.
    - "Wellness Centre" mini-games do not persist high scores to a global leaderboard.

## 5. Improvement Roadmap

### 5.1 Immediate Fixes (Critical)
1. **Secure /dashboard**: Fix middleware or layout to strictly prevent rendering for unauthenticated users.
2. **Fix Library Spending**: Move Library purchases to a server action that validates and deducts points.
3. **Remove Hardcoded PIN**: Move "Skip Lecture" logic to a server action that verifies the PIN against an environment variable.

### 5.2 Performance Optimization
1. **Parallelize Fetching**: Refactor all `fetchData` functions to use `Promise.all()`.
2. **Server Components**: Move initial data fetching to Next.js Server Components to reduce client-side "jumpiness" and "Loading..." states.

### 5.3 UX Enhancements
1. **Live XP Feedback**: Show a small animation or toast whenever XP is earned or spent.
2. **Real Support**: Replace browser `alert()` and `confirm()` with themed Shadcn UI dialogs for a professional feel.
3. **Refine Captcha**: Move Captcha to the first step of enrollment or replace with a more user-friendly "Turnstile" style interaction to reduce friction.

---
*Audit Completed by Jules.*
