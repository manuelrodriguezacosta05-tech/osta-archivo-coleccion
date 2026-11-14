---
name: Osta · Archivo de la colección
description: A three-wing museum in the Baltic forest, signposted like a real gallery, for finding what the collection holds, lacks, can build and must repair.
world: "Museo del bosque báltico"
colors:
  spruce: "#1d3529"
  spruce-raised: "#28473a"
  spruce-ink: "#eef1e8"
  rail-ink: "#e4e7dc"
  rail-muted: "#a9b8a6"
  birch-ground: "#eceae2"
  paper: "#f6f5f0"
  paper-bright: "#fbfaf7"
  peat-ink: "#1b231d"
  moss-muted: "#4f5a51"
  lichen-faint: "#5a645b"
  seam: "#cdcabd"
  seam-strong: "#b3af9f"
  house-estonia: "#1d3529"
  house-francia: "#2f4b66"
  house-afganistan: "#a8761f"
  house-afganistan-fill: "#c08a2c"
  stamp-rust: "#a3432f"
  rust-wash: "#f1ddd5"
  dusk-wash: "#dfe6ec"
  resin-text: "#8a6114"
  resin-wash: "#f2e6c9"
  needle-wash: "#dfe6d9"
  night-ground: "#0e1210"
  night-paper: "#161c18"
  night-paper-bright: "#1b221d"
  night-ink: "#e6e8df"
  night-seam: "#2f3a32"
  night-seam-strong: "#435045"
  night-estonia: "#7fb08e"
  night-francia: "#8fb2d6"
  night-afganistan: "#d9a64a"
  night-rust: "#e2917c"
typography:
  display:
    fontFamily: "Barlow Semi Condensed, Arial Narrow, sans-serif"
    fontSize: "clamp(36px, 4.2vw, 56px)"
    fontWeight: 700
    lineHeight: 1.05
    letterSpacing: "-0.005em"
  headline:
    fontFamily: "Barlow Semi Condensed, Arial Narrow, sans-serif"
    fontSize: "clamp(32px, 3.6vw, 48px)"
    fontWeight: 700
    lineHeight: 1.05
    letterSpacing: "-0.005em"
  figure:
    fontFamily: "Barlow Semi Condensed, Arial Narrow, sans-serif"
    fontSize: "clamp(36px, 3.6vw, 52px)"
    fontWeight: 700
    lineHeight: 1
    letterSpacing: "-0.01em"
  title:
    fontFamily: "Barlow Semi Condensed, Arial Narrow, sans-serif"
    fontSize: "26px"
    fontWeight: 700
    lineHeight: 1.05
  row-title:
    fontFamily: "Barlow Semi Condensed, Arial Narrow, sans-serif"
    fontSize: "17px"
    fontWeight: 600
    lineHeight: 1.2
    letterSpacing: "0.01em"
  body:
    fontFamily: "Barlow, Segoe UI, system-ui, sans-serif"
    fontSize: "15.5px"
    fontWeight: 400
    lineHeight: 1.5
    fontFeature: "tnum"
  label:
    fontFamily: "Barlow Semi Condensed, Arial Narrow, sans-serif"
    fontSize: "12px"
    fontWeight: 600
    letterSpacing: "0.16em"
rounded:
  hair: "2px"
  sm: "3px"
  dialog: "4px"
spacing:
  gap-tight: "4px"
  gap: "12px"
  gap-wide: "14px"
  panel: "18px 20px"
  page-x: "40px"
  page-x-mobile: "16px"
  section: "44px"
components:
  button:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.peat-ink}"
    rounded: "{rounded.sm}"
    padding: "9px 15px"
  button-hover:
    backgroundColor: "{colors.paper-bright}"
  button-primary:
    backgroundColor: "{colors.spruce}"
    textColor: "{colors.spruce-ink}"
    rounded: "{rounded.sm}"
    padding: "9px 15px"
  button-primary-hover:
    backgroundColor: "{colors.spruce-raised}"
  chip:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.peat-ink}"
    typography: "{typography.row-title}"
    rounded: "{rounded.hair}"
    padding: "7px 14px"
  chip-active:
    backgroundColor: "{colors.spruce}"
    textColor: "{colors.spruce-ink}"
  input:
    backgroundColor: "{colors.paper-bright}"
    textColor: "{colors.peat-ink}"
    typography: "{typography.body}"
    rounded: "{rounded.sm}"
    padding: "8px 10px"
  tag:
    backgroundColor: "{colors.needle-wash}"
    textColor: "{colors.house-estonia}"
    rounded: "{rounded.hair}"
    padding: "1px 8px"
  tag-blue:
    backgroundColor: "{colors.dusk-wash}"
    textColor: "{colors.house-francia}"
  tag-amber:
    backgroundColor: "{colors.resin-wash}"
    textColor: "{colors.resin-text}"
  tag-red:
    backgroundColor: "{colors.rust-wash}"
    textColor: "{colors.stamp-rust}"
  nav-item:
    textColor: "{colors.rail-ink}"
    rounded: "{rounded.sm}"
    padding: "9px 10px 8px"
  nav-item-active:
    backgroundColor: "{colors.rail-ink}"
    textColor: "{colors.spruce}"
  panel:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.peat-ink}"
    padding: "18px 20px"
  wing:
    backgroundColor: "{colors.paper}"
    padding: "14px 16px 16px"
  room:
    backgroundColor: "{colors.paper-bright}"
    rounded: "{rounded.hair}"
    padding: "8px 9px"
---

# Design System: Osta · Archivo de la colección

## Overview

**Creative North Star: "Museo del bosque báltico"**

The collection is a museum standing in Osta's Estonian forest, and the interface is its signage. A dark spruce rail holds the building's directory; the ground is pale birch; every exhibit sits on a paper panel bounded by a 1px seam. Titles, counts and labels are set in a condensed sans that reads like gallery wayfinding, while running text stays in a calm, humanist reading face with tabular figures. Hierarchy comes from scale contrast and the weight of the condensed face, not from boxes, colour fields or shadows.

The system is dense and operational: it is built for working in long filterable lists beside the game, and it wears the same signage on every screen so the Vista general and the lists feel like rooms of one building. Colour is assigned by house, never decoratively. Estonia is spruce, Francia is northern-dusk blue, Afganistán is resin amber, and those three hues carry everything that belongs to a house: wing rules, room fills, swatches, tags. Rust is held back for stamps that flag repair or doubt. Every drawn length (the rail's extent bars, the room fills) is an exact proportion of a real count.

Explicitly rejected: the generic white admin dashboard with a blue accent and stat tiles. Militarist emblems are never used as decoration, even though the collection is military material.

**Key Characteristics:**
- Spruce-green navigation rail beside a birch-white ground with paper panels.
- Condensed gallery signage for titles, numbers and labels; Barlow for reading.
- House colour as the only categorical colour; rust only for stamps.
- 1px seams and tonal steps instead of shadows; corners of 2-3px.
- Every bar and fill is an exact count, drawn to proportion.
- States are stamped visibly, never hidden.

## Colors

A forest palette of spruce, birch and peat, with three house hues and one reserved rust.

### Primary
- **Spruce** (#1d3529): the rail background, primary buttons, active chips, the toast, text selection, the Estonia house colour and its wing rule. It is the building's structure.
- **Spruce Raised** (#28473a): hover state of primary buttons; rail scrollbar thumb.
- **Spruce Ink** (#eef1e8): text on any spruce fill (primary buttons, active chips, toast, selection). Written as a literal in the source rather than a custom property.

### Secondary (house colours)
- **Northern-Dusk Blue** (#2f4b66): Francia's house colour; also the focus ring, the caret, text links and the blue stamp. In dark mode it lifts to #8fb2d6.
- **Resin Amber** (#a8761f): Afganistán's house colour for text, swatches and wing rules; **Resin Fill** (#c08a2c) is its brighter room fill, which takes peat ink (#1b231d) on top instead of light ink.
- **Needle Wash** (#dfe6d9), **Dusk Wash** (#dfe6ec), **Resin Wash** (#f2e6c9) with **Resin Text** (#8a6114): soft tag grounds paired with their house-coloured text.

### Tertiary
- **Stamp Rust** (#a3432f): repair and doubt stamps, the alert callout, red tags. **Rust Wash** (#f1ddd5) is its tag and alert ground.

### Neutral
- **Birch Ground** (#eceae2): page background; also the inline code ground.
- **Paper** (#f6f5f0): panels, wings, tables, figure strip, dialog, default buttons.
- **Paper Bright** (#fbfaf7): rooms, inputs, callouts, row and button hover.
- **Peat Ink** (#1b231d): body and heading text.
- **Moss Muted** (#4f5a51): subtitles, secondary copy, breadcrumb.
- **Lichen Faint** (#5a645b): small labels, captions, footnotes, table headers.
- **Seam** (#cdcabd) and **Seam Strong** (#b3af9f): every border and divider; the strong seam frames buttons, chips, inputs and table header rules.
- **Rail Ink** (#e4e7dc) and **Rail Muted** (#a9b8a6): text and counts on the spruce rail; rail ink also fills the active nav item.

Dark mode (prefers-color-scheme, unless `data-theme="light"`) keeps the rail spruce and turns the ground to night (#0e1210) with night paper (#161c18, #1b221d), night ink (#e6e8df) and dark seams (#2f3a32, #435045). House colours lift to #7fb08e, #8fb2d6 and #d9a64a; rust to #e2917c; the washes darken to the same hues at low lightness. Resin Fill stays #c08a2c in both modes.

### Named Rules
**The House Colour Rule.** Estonia, Francia and Afganistán hues appear only on things that belong to that house (wing rules, room fills, swatches, tags, sheet heads). They are never decoration and never a generic accent.

**The Rust Is A Stamp Rule.** Rust appears only on stamps, red tags and the alert callout: repair, doubt, priority. If it is not a state that needs attention, it is not rust.

## Typography

**Display Font:** Barlow Semi Condensed (with Arial Narrow, sans-serif), weights 500/600/700
**Body Font:** Barlow (with Segoe UI, system-ui, sans-serif), weights 400/500/600
**Label/Mono Font:** ui-monospace, Consolas, for inline code only

**Character:** A gallery-signage condensed sans for everything you navigate by (titles, counts, references, labels) against an open, readable sibling for everything you read. All figures are tabular, so counts line up in ledgers and tables.

### Hierarchy
- **Display** (700, clamp(36px, 4.2vw, 56px), 1.05): the Vista general title only.
- **Headline** (700, clamp(32px, 3.6vw, 48px), 1.05): page titles on every other section; balanced wrapping.
- **Figure** (700, clamp(36px, 3.6vw, 52px), 1): the four-figure strip; a trailing denominator drops to 0.48em in lichen faint.
- **Title** (700, 26px, 1.05): section headings and wing names; wing counts repeat it in the house colour. Panel headings 24px, sheet title 34px, h3 20-21px.
- **Row title** (600, 17px, 1.2, 0.01em): clickable object names in lists, ledgers and plates (16px on plates).
- **Body** (400, 15.5px, 1.5): running text; subtitles 16px to 68ch; table and control text 14.5px; captions 13-13.5px.
- **Label** (600, 12px, 0.12-0.16em, uppercase): field labels, figure captions, dialog header, filter labels. Table headers use the same face at 0.14em without uppercase.

### Named Rules
**The Signage Rule.** If the reader navigates by it (a title, a count, a reference code, a label), it is set in Barlow Semi Condensed. If the reader reads it, it is Barlow. Never set paragraphs in the condensed face.

**The Exact Number Rule.** Numbers are the signage. Counts are large condensed figures with tabular alignment; they are never replaced by icons, gauges or vague descriptors.

## Layout

A two-column shell: a 256px sticky rail and a fluid workspace. The workspace has a sticky topbar (breadcrumb at left, actions at right, 92% ground with 6px backdrop blur and a seam beneath) and a main column capped at 1360px with 30px/40px padding. Sections open with a heading row that sits on a seam (padding-bottom 18px) and are separated by 44px.

The Vista general stacks: heading with a right-aligned revision and stamp; a four-figure strip in one seamed band; the floor plan of three wings (columns 1.25fr 1.25fr 0.9fr, 14px gap) whose rooms auto-fill at a 118px minimum with 4px gaps and dense packing; a two-column "next step" row (1.2fr 1fr); a five-plate gallery. Lists use a filter grid (search 2fr plus five equal columns) above a seamed table.

Responsive: at 1200px the filter grid goes to three columns, the gallery to three, and the plan to two wings with the third spanning. At 900px the rail becomes an off-canvas drawer (284px, slides in on a 0.25s ease-out with a spruce scrim), the menu button appears, page gutters drop to 16px, the figure strip goes 2x2, and the plan, next row and method grid stack. At 620px rooms go two-up, the gallery two-up with four plates, and tables reflow into stacked rows with headers hidden.

## Elevation & Depth

The system is flat. Depth comes from tonal steps (birch ground, paper panel, bright paper for rooms, inputs and hover) and from 1px seams. The rail is the one dark mass, and it sits beside the work rather than over it. The only real shadow belongs to the modal object sheet, because it genuinely floats above the page.

### Shadow Vocabulary
- **Sheet lift** (`box-shadow: 0 30px 80px -20px rgba(10,20,14,.5)`): the object-sheet dialog only, over a spruce backdrop at 55%.
- **Focus halo** (`box-shadow: 0 0 0 3px color-mix(in srgb, var(--fr) 22%, transparent)`): text inputs and selects on focus, paired with a dusk-blue border. A state, not elevation.

### Named Rules
**The Seam Not Shadow Rule.** Panels, wings, plates, tables and callouts are separated by a 1px seam and a tonal step, never by a drop shadow. A shadow is reserved for the one thing that truly floats: the modal sheet.

## Shapes

Small, near-square corners: 2px on rooms, tags, stamps, chips and code; 3px on buttons, inputs, nav items and the toast; 4px on the dialog. Panels, wings, plates and the figure strip have square corners. House identity is carried by a 6px top rule in the house colour on each wing and on the object-sheet head. Stamps are 1.5px outlined boxes rotated -1.5deg. The extent bars in the rail are 3px tall with 2px rounding. The only circle is the 8px live indicator in the rail footer.

## Components

### Buttons
- **Shape:** gently squared (3px).
- **Default:** paper ground, strong seam border, 9px 15px, 14.5px body text, optional 18px line icon at a 7px gap. Hover darkens the border to ink and lifts the ground to bright paper.
- **Primary:** spruce fill and border with spruce ink text; hover to spruce raised.
- **Icon button (topbar):** same family, 7px 12px, 14px; the label hides below 900px so only the icon remains.
- **Text link:** dusk blue, 600, 1px underline at a 4px offset. Disabled buttons drop to 40% opacity.

### Chips
- **Style:** square-ish (2px), paper ground, strong seam, condensed 600 14.5px with 0.02em tracking, 7px 14px.
- **State:** the active chip is filled spruce with spruce ink. No hover colour change.

### Tags and Stamps
- **Tags:** inline condensed 600 13px labels on a soft wash (needle by default, dusk, resin, rust variants); a gray variant has no ground. Used for neutral attributes.
- **Stamps:** outlined, uppercase, 700 12px with 0.14em tracking, tilted -1.5deg; rust by default, with blue, amber and green variants. Used for states that need attention (doubts, priority, repair, the revision's open-doubt count).

### Cards / Containers
- **Corner Style:** square.
- **Background:** paper on the birch ground.
- **Shadow Strategy:** none (see Elevation & Depth).
- **Border:** 1px seam; wings add a 6px house-colour top rule.
- **Internal Padding:** panels 18px 20px; wings 14px 16px 16px; photo cards 16px 18px; plate captions 10px 12px 12px.
- **Ledger:** lists inside panels are seam-ruled rows with a condensed 700 24px count at right.
- **Callout:** bright paper, seam, 12px 16px; alert and warn variants tint border and ground toward rust or resin.

### Inputs / Fields
- **Style:** bright paper, strong seam, 3px corners, 8px 10px, Barlow 15px. Labels sit above in the uppercase condensed label style.
- **Focus:** border turns dusk blue with a 3px dusk halo at 22%. Checkboxes use spruce as their accent colour.

### Navigation
- **Rail:** spruce, 24px 16px 20px padding, brand lockup (tree mark, 24px condensed wordmark, 11.5px tracked subtitle) above eight section links.
- **Item:** 15px rail-ink text, condensed count at right in rail muted, and beneath it a full-width 3px extent bar whose fill width is that section's exact share. Hover is a 6% white wash; active inverts to a rail-ink fill with spruce text, count and bar.
- **Footer:** seam-topped block with the live indicator, last-update stamp and the three house swatches.
- **Mobile:** off-canvas drawer behind a menu button, with a spruce scrim.

### Floor Plan Room (signature)
Each room is a section of a house's collection: a bright-paper cell (2px, seam) whose house-coloured fill rises from the bottom to exactly its share of displayed pieces, animated with a 0.9s rise on cubic-bezier(.16,1,.3,1). The label (22px condensed count plus a 13px name) is drawn twice and clipped at the fill line, so text over the fill switches to light ink (peat ink on Afganistán's resin fill). Rooms span two columns when large. Hover sets the border to ink; empty rooms go faint and inert. Reduced motion disables the rise.

### Figure Strip
Four equal cells in one seamed paper band with seam dividers; each cell is a button with a Figure-size count and a 14.5px caption, hovering to bright paper.

### Object Sheet (dialog)
Up to 780px wide, paper, strong seam, 4px corners, the sheet-lift shadow. A sticky top bar carries the uppercase label and a close icon; the head carries a 6px house-colour rule, a 34px title and a tag row; fields sit in a two-column grid of uppercase labels over 15px values.

## Do's and Don'ts

### Do:
- **Do** colour anything that belongs to a house with that house's hue: spruce #1d3529, dusk #2f4b66, resin #a8761f (fill #c08a2c).
- **Do** draw every bar and fill as the exact proportion of a real count, as the rail extent bars and floor-plan rooms do.
- **Do** separate surfaces with a 1px seam (#cdcabd) and a tonal step from birch ground to paper to bright paper.
- **Do** set titles, counts, references and labels in Barlow Semi Condensed, and reading text in Barlow with tabular figures.
- **Do** show states as visible stamps or tags; doubts and alerts stay on screen.
- **Do** keep corners at 2-3px, and mark a house container with a 6px top rule in its colour.
- **Do** honour reduced motion and the dark-mode token set for every new surface.

### Don't:
- **Don't** build the generic white admin dashboard with a blue accent and stat tiles.
- **Don't** use rust (#a3432f) for anything except repair, doubt and priority stamps, red tags and alerts.
- **Don't** add drop shadows to panels, cards or plates; the only shadow is the modal sheet's.
- **Don't** use militarist emblems as decoration.
- **Don't** use a house colour as a generic accent or on content that belongs to no house.
- **Don't** set paragraphs in the condensed signage face.
