Build a complete AI-native Liquidity Intelligence web platform.

This is NOT a crypto trading app.
This is institutional financial infrastructure software.

Stack:
- React
- TypeScript
- Tailwind
- Clean routing structure
- Single unified layout
- No nested layout conflicts
- No duplicate navigation wrappers

Architecture must be stable and production-ready.

-----------------------------------------
CORE DESIGN PRINCIPLES
-----------------------------------------

• Institutional fintech design system
• Clean white background (#F8F9FA)
• Deep blue primary accent (#2563EB)
• No neon
• No crypto aesthetics
• No hype language
• 20px+ rounded cards
• Soft shadows
• Large numeric displays
• Generous whitespace
• Minimal animations

-----------------------------------------
ROUTING STRUCTURE
-----------------------------------------

App.tsx structure:

App
 ├── Layout (UnifiedNavigation)
 │      ├── TopBar
 │      ├── BottomNavigation (mobile)
 │      ├── SidebarNavigation (desktop)
 │      ├── <Outlet />
 ├── Routes
        /dashboard
        /intelligence
        /stress-lab
        /reports
        /data-sources
        /profile

Navigation wrapper must exist ONLY ONCE.

-----------------------------------------
GLOBAL LAYOUT
-----------------------------------------

TOP BAR
- Logo: Liquidity.ai
- Current Regime indicator (center)
- Verification badge (right)
- Horizontal macro ticker below:
    SRI | BTC Risk | Yield Curve | M2 Delta

MOBILE NAVIGATION
Bottom navigation (NO hamburger)
Tabs:
- Home
- Intelligence
- Stress
- Reports
- Profile

DESKTOP NAVIGATION
Left sidebar
Same items vertically stacked

-----------------------------------------
PAGE 1 — DASHBOARD (Layer 1)
-----------------------------------------

Purpose:
High-level liquidity overview.

Components:

1. Regime Intelligence Card
- Current Regime
- Confidence %
- Regime Momentum

2. Survival Probability Card
- Large %
- Portfolio selector
- Short explanation

3. Stress Signals Feed
- Timestamped events

4. Macro Snapshot
- Real Yield
- M2 Momentum
- Yield Curve Spread

5. Floating AI Assistant Button (bottom right)
Not chatbot.
Query-based intelligence.

-----------------------------------------
PAGE 2 — INTELLIGENCE TERMINAL (Layer 2)
-----------------------------------------

Purpose:
Deep analytics layer.

Sections:

Regime Transition Probabilities
Crash Similarity Engine
Volatility Expansion Probability
Cross-Asset Correlation
Liquidity Flow Breakdown
Model Confidence Diagnostics

Desktop:
3-column grid

Mobile:
Collapsible stacked layout

No Buy/Sell signals here.

-----------------------------------------
PAGE 3 — STRESS LAB
-----------------------------------------

Purpose:
Scenario simulation.

Components:

Scenario Selector:
- Liquidity Shock
- Volatility Spike
- Correlation Breakdown
- Custom Shock %

Output:
- Portfolio survival probability
- Drawdown estimate
- Recovery time estimate
- Confidence level

Large visual probability display.

-----------------------------------------
PAGE 4 — REPORTS
-----------------------------------------

Purpose:
Evidence-based PDF intelligence.

List view:
- Report title
- Date
- Risk level badge
- Download button
- Share button

Institutional styling.

-----------------------------------------
PAGE 5 — DATA SOURCES
-----------------------------------------

Purpose:
Transparency & trust.

Sections:
- Macro Data Sources
- Market Data Sources
- On-Chain Data
- Model Training Windows
- Performance Metrics
- Limitations Disclosure
- Security & Compliance

Research-paper style layout.

-----------------------------------------
PAGE 6 — PROFILE
-----------------------------------------

Purpose:
Access & Verification.

Show:
- Plan type
- Phone verification status
- Access logs
- Upgrade options

PRO:
$149/month

INSTITUTIONAL:
Custom pricing
API access
Webhooks
SLA

-----------------------------------------
PERFORMANCE REQUIREMENTS
-----------------------------------------

• No hydration errors
• No infinite loops
• No duplicate layout wrappers
• No 300s timeouts
• Clean React Router setup
• Type-safe components
• Modular folder structure

-----------------------------------------
FINAL PRODUCT POSITIONING
-----------------------------------------

This platform is:
Financial intelligence infrastructure.

It is NOT:
A trading signals app.
A hype crypto dashboard.
A retail trading toy.

It should look like:
Bloomberg Terminal meets modern fintech UI.