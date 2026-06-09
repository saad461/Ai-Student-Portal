# Typography and Color Audit: The Daurix Project

This report provides a comprehensive breakdown of the fonts, typography hierarchy, colors, and UI component styles used across the platform.

## 1. Global Brand Foundations

The platform follows a "High-Performance / Brutalist" design language, characterized by extreme font weights, tight letter spacing, and high-contrast color palettes.

### Fonts
- **Primary Sans**: `Geist Sans` (Variable)
  - Used for 90% of the interface.
  - Heavy reliance on `font-black` (900) for headings.
- **Primary Mono**: `Geist Mono` (Variable)
  - Used for code snippets, technical labels, terminal interfaces, and the "Pro Mode" theme.
- **Fallbacks**: `sans-serif` and `monospace`.

### Core Color System (OKLCH Based)
The system uses three primary modes defined in `src/app/globals.css`:

| Mode | Background | Foreground | Primary |
| :--- | :--- | :--- | :--- |
| **Light** | `oklch(1 0 0)` (White) | `oklch(0.145 0 0)` (Dark Gray) | `oklch(0.205 0 0)` (Slate) |
| **Dark** | `oklch(0.145 0 0)` (Slate-950) | `oklch(0.985 0 0)` (White) | `oklch(0.922 0 0)` (Light Gray) |
| **Pro (Hacker)** | `oklch(0.1 0 0)` (Pure Black) | `oklch(0.8 0.1 142)` (Emerald) | `oklch(0.7 0.2 142)` (Bright Green) |

---

## 2. Page-by-Page Breakdown

### A. Landing Page (`/`)
*Theme: Static Dark Slate (Slate-950)*

#### Typography
- **Hero Title**: `text-5xl md:text-7xl lg:text-8xl`, `font-black`, `tracking-tighter`, `leading-[0.9]`.
- **Hero Subtitle**: `text-lg md:text-xl`, `font-medium`, `text-slate-400`.
- **Section Headings**: `text-4xl md:text-5xl`, `font-black`, `tracking-tighter`, `uppercase`.
- **Card Titles**: `text-xl`, `font-black`, `uppercase`, `tracking-tighter`.
- **Small Labels**: `text-[10px]`, `font-black`, `uppercase`, `tracking-[0.2em]`.

#### Spacing & Layout
- **Paddings**: `px-6 lg:px-12`.
- **Section Spacing**: `py-32` to `py-40`.
- **Margins**: Hero section has `pt-20 pb-32 lg:pt-40 lg:pb-52`.

#### Colors
- **Background**: `bg-slate-950`.
- **Accents**: `blue-600` (Primary Action), `purple-600` (Roadmap secondary).
- **Gradients**: `from-blue-400 to-purple-400` (Text highlights).

---

### B. Student Dashboard (`/dashboard`)
*Theme: Dynamic (Light/Dark/Pro)*

#### Typography
- **Greeting**: `text-2xl md:text-3xl`, `font-black`, `uppercase`, `tracking-tighter`.
- **Section Headers**: `text-xl`, `font-bold`.
- **Metric Labels**: `text-[10px]`, `font-bold`, `uppercase`, `tracking-wider`, `text-muted-foreground`.
- **Metric Values**: `text-xl`, `font-black`.

#### Spacing & Layout
- **Page Padding**: `p-4 lg:p-8`.
- **Grid Gap**: `gap-4` for metrics, `gap-8` for major sections.

#### Colors
- **Cards**: Standard `bg-card` with occasional tints:
  - XP Card: `bg-primary/5 border-primary/10`.
  - Sparks Card: `bg-amber-500/5 border-amber-500/10`.
- **Badges**: `bg-green-600` (Success), `bg-orange-600` (Pending).

---

### C. Curriculum & Lectures (`/curriculum`, `/lecture/[id]`)
*Theme: Dynamic*

#### Typography (Lecture Page)
- **Title**: `text-4xl md:text-5xl`, `font-black`, `tracking-tight`.
- **Markdown H1**: `text-4xl`, `font-black`, `mt-12`, `mb-6`, `border-b-2`.
- **Markdown H2**: `text-3xl`, `font-extrabold`, `mt-10`, `mb-5`, `border-b`.
- **Markdown P**: `text-lg`, `leading-relaxed`, `mb-6`, `font-normal`.
- **Code**: `font-mono`, `text-[11px]` to `text-sm`.

#### Spacing & Layout
- **Page Padding**: `p-4 md:p-12 lg:p-16`.
- **Max Content Width**: `max-w-6xl`.
- **Sticky Tabs**: `h-12` height, `top-16`.

#### Colors
- **Callout Cards**:
  - Info: `blue` (`bg-blue-50`, `border-blue-500`).
  - Warning: `orange` (`bg-orange-50`, `border-orange-500`).
- **Code Block**: `bg-[#1e293b]` (Slate-800).

---

### D. Skill Shop (`/shop`)
*Theme: Dynamic*

#### Typography
- **Header**: `text-5xl font-black tracking-tighter`.
- **Price**: `text-3xl font-black` (Sparks).
- **Tabs**: `text-xs font-black uppercase tracking-widest`.

#### Spacing & Layout
- **Cards**: `rounded-[2.5rem]`.
- **Padding**: `p-6 md:p-12` for header, `p-4 lg:p-8` for content.

---

### E. Admin Dashboard (`/admin`)
*Theme: Dynamic (Light/Dark)*

#### Typography
- **Header**: `text-2xl md:text-3xl font-black uppercase tracking-tighter`.
- **Table Text**: `text-sm` (Data), `text-xs` (Labels).
- **Labels**: `text-[10px] font-black uppercase tracking-widest`.

#### Colors
- **Background**: `bg-slate-50` (Light) / `bg-slate-950` (Dark).
- **Accents**: Standard `blue-600`.

---

## 3. UI Component Standards

### Buttons
| Variant | Style |
| :--- | :--- |
| **Default** | `bg-primary`, `text-primary-foreground`. Often overridden with `rounded-xl` or `rounded-2xl`. |
| **Landing Hero** | `h-14`, `rounded-2xl`, `font-black`, `text-lg`. |
| **Outline** | Thin border, transparent/subtle background. |
| **Ghost** | Transparent, subtle hover background. |

### Inputs
- **Base**: `h-12`, `rounded-xl`, `bg-slate-950/50` (on dark pages), `border-white/5`.
- **Focus**: `focus:border-blue-500/50`.

### Cards
- **Base**: Standard Shadcn border-radius (`0.625rem`).
- **Enhanced**: `rounded-2xl` or `rounded-3xl` with `backdrop-blur-xl`.

---

## 4. Style Deviations & Inconsistencies

During the audit, the following inconsistencies were identified:

1.  **Theme Hardcoding**: The **Landing, Login, and Enrollment** pages are hardcoded to `bg-slate-950` (Dark Slate), completely ignoring the user's selected theme (Light/Pro). The rest of the portal follows the `ThemeProvider`.
2.  **Border Radii**:
    - The base component (`button.tsx`, `card.tsx`) uses a standard small radius (`0.625rem`).
    - Many pages (Landing, Shop, Dashboard) manually override this with `rounded-xl`, `rounded-2xl`, or even `rounded-[2.5rem]`.
3.  **Font Weight Consistency**: Headings alternate between `font-black` (900) and `font-bold` (700) across different modules. The Landing page is consistently 900, while parts of the Curriculum are 700.
4.  **Label Sizing**: Technical metadata labels fluctuate between `text-[10px]` and `text-xs` (12px) without a clear rule.
5.  **Section Spacing**:
    - Landing page: `py-32` (Massive).
    - Portal: Standard `p-4` to `p-8`.
    - Lecture: `p-16` (Deep work focus).
6.  **Pro Mode Font**: In "Pro Mode", the entire application switches to `Geist Mono`, which can impact readability in long-form theory content in the Lecture view compared to the standard `Geist Sans`.
7.  **Shop vs. Library**: The Shop uses extremely rounded cards (`rounded-[2.5rem]`), which is not mirrored in the My Library view or other portal sections.
