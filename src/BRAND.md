# What's On Youth — Brand Guidelines

## About this file
Place this file at `src/BRAND.md` in your Lovable project.
Reference it in every prompt: "Follow the brand guidelines in src/BRAND.md"

---

## Platform overview

**What's On Youth** is a Victoria-wide platform helping young people aged 15–25
discover events, jobs, grants, programs, and wellbeing support. Organisations
and community groups can submit listings for free.

**Brand personality:** Youthful but not childish. Modern and digital.
Trustworthy. Community-focused. Energetic and optimistic.

**Tagline:** Your opportunities, all in one place.

---

## Colour palette

### Primary colours
| Name            | Hex       | Usage                                           |
|-----------------|-----------|-------------------------------------------------|
| Vibrant Teal    | `#1D9E75` | Primary brand, icon bg, links, active states    |
| Deep Forest     | `#04342C` | Nav background, body text, headings             |
| Coral           | `#D85A30` | Primary CTA buttons ONLY — Submit, Explore, Publish |

### Surface colours
| Name            | Hex       | Usage                                           |
|-----------------|-----------|-------------------------------------------------|
| Crisp Mint      | `#F0FAF5` | Page background                                 |
| Mint            | `#E1F5EE` | Hero section, card hover bg, info banners       |
| White           | `#FFFFFF` | Card backgrounds                                |

### Text colours
| Name            | Hex       | Usage                                           |
|-----------------|-----------|-------------------------------------------------|
| Deep Forest     | `#04342C` | Primary headings and body text on light bg      |
| Mid Teal        | `#0F6E56` | Secondary / muted text, subtitles               |
| Soft Teal       | `#5DCAA5` | Placeholder text, footer text on dark           |
| Seafoam         | `#9FE1CB` | Borders, dividers, input outlines               |

### Extended palette
| Name            | Hex       | Usage                                           |
|-----------------|-----------|-------------------------------------------------|
| Coral Light     | `#F0997B` | Coral button hover state                        |
| Dark Forest     | `#085041` | Logo icon on teal bg, step circles on teal      |
| Forest Divider  | `#063D2E` | Footer divider lines                            |

### Colour rules
- Coral `#D85A30` is ONLY for primary action buttons. Never use it for
  backgrounds, text, or decoration.
- Never use pure black `#000000` for text — always Deep Forest `#04342C`.
- Page background is always Crisp Mint `#F0FAF5`, never plain white.
- Dark sections (nav, regional banner, footer) always use Deep Forest `#04342C`.
- Never place the logo on a coral background.

---

## Typography

### Typefaces
| Role              | Font               | Weight    | Notes                          |
|-------------------|--------------------|-----------|--------------------------------|
| Display / headings | Plus Jakarta Sans | 700       | All h1–h3, card titles, CTAs   |
| Body / UI          | Inter             | 400       | All body copy, labels, inputs  |
| Category labels    | Inter             | 500       | Nav links, pills, tags         |

Import in CSS or Tailwind config:
```
https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;700&family=Inter:wght@400;500&display=swap
```

### Type scale
| Element       | Font               | Mobile | Desktop | Weight | Colour    |
|---------------|--------------------|--------|---------|--------|-----------|
| h1            | Plus Jakarta Sans  | 40px   | 64px    | 700    | `#04342C` |
| h2            | Plus Jakarta Sans  | 26px   | 32px    | 700    | `#04342C` |
| h3            | Plus Jakarta Sans  | 20px   | 24px    | 700    | `#04342C` |
| Body large    | Inter              | 18px   | 18px    | 400    | `#0F6E56` |
| Body          | Inter              | 16px   | 16px    | 400    | `#04342C` |
| Small / label | Inter              | 14px   | 14px    | 400–500| `#0F6E56` |
| Eyebrow label | Inter              | 12px   | 13px    | 500    | `#1D9E75` |
| Tiny / meta   | Inter              | 11px   | 12px    | 400    | `#0F6E56` |

### Typography rules
- Eyebrow labels always uppercase, Inter 500, `#1D9E75`, letter-spacing 0.06–0.08em
- Font weights used: 400, 500, 700 only — never 600, 800, or 900
- Line height: headings 1.15, body 1.6–1.7, UI elements 1.4
- Letter spacing: h1 = -0.02em, h2/h3 = -0.01em, eyebrow = 0.06em

---

## Spacing

| Token | Value | Usage                              |
|-------|-------|------------------------------------|
| xs    | 4px   | Internal pill/badge padding        |
| sm    | 8px   | Gap between inline elements        |
| md    | 12px  | Card grid gap                      |
| lg    | 16px  | Internal card padding (small)      |
| xl    | 20px  | Internal card padding (standard)   |
| 2xl   | 24px  | Section padding (mobile horizontal)|
| 3xl   | 32px  | Between cards and sub-sections     |
| 4xl   | 48px  | Section vertical padding (mobile)  |
| 5xl   | 64px  | Section vertical padding (desktop) |
| 6xl   | 80px  | Hero vertical padding (desktop)    |

---

## Border radius

| Token | Value  | Usage                                       |
|-------|--------|---------------------------------------------|
| sm    | 6px    | Small inputs, tiny badges                   |
| md    | 8px    | Buttons, inputs, small cards                |
| lg    | 12px   | Standard cards, form cards                  |
| xl    | 16px   | Hero placeholder, large panels              |
| full  | 999px  | Pills, tags, badges, nav CTA button         |

---

## Components

### Buttons

**Primary CTA (Coral) — main actions only**
```
background:       #D85A30
color:            #FFFFFF
font:             Plus Jakarta Sans 700 16px
border-radius:    8px
padding:          14px 28px
hover background: #F0997B
transition:       100ms ease
```
Use for: "Explore opportunities", "Submit a listing", "Publish listing",
"Create free account"

**Secondary (Outlined Teal)**
```
background:       transparent
border:           2px solid #1D9E75
color:            #1D9E75
font:             Plus Jakarta Sans 700 16px
border-radius:    8px
padding:          14px 28px
hover background: #E1F5EE
transition:       100ms ease
```

**Tertiary (Filled Teal)**
```
background:       #1D9E75
color:            #FFFFFF
font:             Plus Jakarta Sans 700 16px
border-radius:    8px
padding:          14px 28px
hover background: #0F6E56
transition:       100ms ease
```
Use for: "View all opportunities", "Log in" submit button

### Cards

**Opportunity card**
```
background:         #FFFFFF
border:             1px solid #9FE1CB
border-radius:      12px
padding:            20px
hover border-color: #1D9E75
transition:         border-color 100ms ease
```

**Category card**
```
background:         #F0FAF5
border:             1px solid #9FE1CB
border-radius:      12px
padding:            20px 16px
hover background:   #E1F5EE
hover border-color: #1D9E75
transition:         100ms ease
```

**Form card**
```
background:    #FFFFFF
border:        1px solid #9FE1CB
border-radius: 12px
padding:       32px
```

### Pills and badges

**Category pill (on cards)**
```
background:    #E1F5EE
color:         #1D9E75
font:          Inter 500 12px
border-radius: 999px
padding:       3px 10px
```

**Eyebrow pill (on dark sections)**
```
background:    #1D9E75
color:         #9FE1CB
font:          Inter 500 12px
border-radius: 999px
padding:       4px 12px
```

**Location pill (regional banner)**
```
background:    transparent
border:        1px solid #0F6E56
color:         #5DCAA5
font:          Inter 400 14px
border-radius: 999px
padding:       6px 14px
```

**"Submitted by community" badge**
```
background:    #F0FAF5
border:        1px solid #9FE1CB
color:         #0F6E56
font:          Inter 400 11px
border-radius: 999px
padding:       2px 8px
```

### Form inputs
```
border:             1px solid #9FE1CB
border-radius:      8px
padding:            12px 14px
font:               Inter 400 15px
color:              #04342C
background:         #FFFFFF
focus border-color: #1D9E75
focus outline:      none
```

### Category icon placeholder
```
width:         40px
height:        40px
background:    #1D9E75
border-radius: 8px
```

### Step number circles
```
width:         40px
height:        40px
background:    #E1F5EE
color:         #1D9E75
font:          Plus Jakarta Sans 700 18px
border-radius: 50%
```

---

## Section backgrounds

| Section                   | Background | Notes           |
|---------------------------|------------|-----------------|
| Page default              | `#F0FAF5`  | Crisp Mint      |
| Nav bar                   | `#04342C`  | Deep Forest     |
| Hero                      | `#E1F5EE`  | Mint            |
| Category grid             | `#FFFFFF`  | White           |
| Featured opportunities    | `#F0FAF5`  | Crisp Mint      |
| Submit callout            | `#1D9E75`  | Vibrant Teal    |
| Regional banner           | `#04342C`  | Deep Forest     |
| How it works              | `#FFFFFF`  | White           |
| Footer                    | `#04342C`  | Deep Forest     |
| Signup / login pages      | `#F0FAF5`  | Crisp Mint      |
| Account page              | `#F0FAF5`  | Crisp Mint      |

---

## Tailwind config

Add this to `tailwind.config.js` under `theme.extend`:

```js
colors: {
  brand: {
    teal:           '#1D9E75',
    forest:         '#04342C',
    coral:          '#D85A30',
    'coral-light':  '#F0997B',
    mint:           '#E1F5EE',
    'page-bg':      '#F0FAF5',
    seafoam:        '#9FE1CB',
    'mid-teal':     '#0F6E56',
    'soft-teal':    '#5DCAA5',
    'dark-forest':  '#085041',
    'deep-forest':  '#04342C',
    'forest-div':   '#063D2E',
  }
},
fontFamily: {
  display: ['"Plus Jakarta Sans"', 'sans-serif'],
  body:    ['Inter', 'sans-serif'],
},
borderRadius: {
  'brand-sm':   '6px',
  'brand-md':   '8px',
  'brand-lg':   '12px',
  'brand-xl':   '16px',
  'brand-full': '9999px',
},
```

---

## Logo

### Files and usage
| File                          | Use for                                  |
|-------------------------------|------------------------------------------|
| `woy-logo-primary.svg`        | Light and white backgrounds              |
| `woy-logo-reversed.svg`       | Dark/forest backgrounds — nav bar        |
| `woy-logo-on-teal.svg`        | Teal backgrounds — submit callout        |
| `woy-icon-only.svg`           | App icon, social avatar, profile pic     |
| `woy-icon-only-reversed.svg`  | Icon on forest/dark backgrounds          |
| `woy-icon-only-flat.svg`      | Arrow only, no box — watermarks          |
| `woy-wordmark-only.svg`       | Text lockup without icon, narrow spaces  |
| `woy-wordmark-only-reversed.svg` | Reversed wordmark, dark footer        |
| `woy-favicon.svg`             | Browser tab — place in `public/` folder  |

### Logo in nav component
```jsx
import logo from '@/assets/woy-logo-reversed.svg'
<img src={logo} alt="What's On Youth" height="30" />
```

### Logo rules
- Never stretch, rotate, recolour, or add effects to the logo
- Minimum size: 30px height for full lockup, 16px for icon only
- Clear space: icon height × 0.25 on all sides minimum
- Never place any logo on a coral background

---

## Design rules — always follow

1. No gradients — flat colour only throughout
2. No drop shadows — use border colour changes for depth
3. No animations except button hover (100ms ease) and card border (100ms ease)
4. Never use pure black or grey — always use Deep Forest `#04342C` or Mid Teal `#0F6E56`
5. Coral `#D85A30` is for CTA buttons only — never backgrounds or decoration
6. Mobile first — design for 375px then scale up
7. WCAG AA minimum contrast throughout
8. All interactive elements need visible focus rings using `#1D9E75`
9. Font weights: 400, 500, 700 only
10. Page background is always Crisp Mint `#F0FAF5` — never plain white

---

## Tone of voice

- Direct, warm, inclusive, practical, credible
- No slang, no hype, no excessive exclamation marks

| Don't say                        | Say instead                  |
|----------------------------------|------------------------------|
| "Unlock your potential!"         | "Find your next opportunity" |
| "Hey there, young legend"        | "Hi" or no greeting          |
| "Check out these sick events"    | "Browse upcoming events"     |
| "We're passionate about youth"   | "Built for young Victorians" |

---

## Categories

Exactly 5 categories. Do not add, rename, or reorder.

| Category  | Descriptor                | Route      |
|-----------|---------------------------|------------|
| Events    | What's on near you        | /events    |
| Jobs      | Find work and internships | /jobs      |
| Grants    | Funding for your ideas    | /grants    |
| Programs  | Courses and opportunities | /programs  |
| Wellbeing | Support when you need it  | /wellbeing |

---

## Platform details

- **Name:** What's On Youth
- **Geography:** Victoria, Australia (state-wide, including regional)
- **Age range:** 15–25 primary, 14–26 soft outer boundary
- **Submission moderation:** Auto-publish — listings go live immediately
- **Account requirement:** Free account required to submit listings
- **Auth provider:** Supabase (email + password)
- **Database table:** `listings` in Supabase
