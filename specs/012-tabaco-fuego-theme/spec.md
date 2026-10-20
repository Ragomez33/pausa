# Feature Specification: Tabaco & Fuego Warm Theme

**Feature Branch**: `012-tabaco-fuego-theme`

**Created**: 2026-10-19

**Status**: Draft

**Input**: User description: "Ajustar la paleta a un Light Mode cálido y legible con fondo blanco/crema, tarjetas blancas, texto marrón oscuro y acentos naranja. Mantener la navegación a Equipos y el botón 'Quiero fumar' con naranja fuerte. Actualizar tailwind.config.js, vistas y system-design.md sin alterar SQLite ni los hooks de Drizzle."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Experience a Cohesive Warm Identity (Priority: P1)

A person opens Pausa and immediately perceives a warm, fresh identity built on a soft cream page, white cards, ember orange, and deep tobacco-brown text. Surfaces, cards, borders, and text feel intentional and consistent across the primary screens, with no leftover navy or mint-green styling and with comfortable light-mode legibility.

**Why this priority**: The visual identity is the foundation of the feature. Without a coherent palette, the remaining stories cannot feel like one product.

**Independent Test**: Open each primary screen, compare its background, cards, borders, primary text, and secondary text against the documented palette, and confirm that no navy or mint-green surface remains.

**Acceptance Scenarios**:

1. **Given** any primary screen, **When** it renders, **Then** its page background uses the soft cream background token, cards use the white card token, and borders use the warm light-gray border token.
2. **Given** any primary screen, **When** text is displayed, **Then** primary text uses deep tobacco brown and secondary text uses medium gray-brown with readable contrast.
3. **Given** a person comparing the app before and after the change, **When** they scan the primary screens, **Then** no navy-blue or mint-green surface, text, or accent remains.
4. **Given** a screen with a status or alert state, **When** the state is shown, **Then** it uses the orange or amber accent roles rather than an unrelated color.

---

### User Story 2 - Reach the Squad from the Main Navigation (Priority: P2)

A person on any main screen sees a fixed top tab bar with Inicio, Historial, Inventario, Logros, and Equipo. The active destination is obvious, tapping a tab changes the main view immediately, and tapping Equipo opens the squad screen.

**Why this priority**: The team feature is only discoverable if the navigation entry is present and works reliably.

**Independent Test**: Open home, inspect the five navigation pills, tap Equipo, and confirm the squad screen opens. Repeat on a narrow phone width and confirm every label remains reachable.

**Acceptance Scenarios**:

1. **Given** any main screen, **When** the fixed top tab bar renders, **Then** it includes Inicio, Historial, Inventario, Logros, and Equipo.
2. **Given** the fixed top tab bar, **When** the person taps Equipo, **Then** the squad screen opens without requiring a back action.
3. **Given** any visible tab, **When** it is the current section, **Then** it uses a brand-orange fill with white text, distinct from inactive tabs.
4. **Given** a narrow phone width, **When** the tab bar renders, **Then** all five equal-width tabs remain fully visible without horizontal scrolling or clipped labels.

---

### User Story 3 - Recognize the Impulse Intervention Instantly (Priority: P3)

When an urge appears, the person sees one large orange circular "Quiero fumar" action centered on the screen. It reads as an ember-colored intervention rather than a generic green button, and it is not competing with secondary metrics or filler copy.

**Why this priority**: The intervention is the core habit-breaking action, and the new identity must make it the most recognizable element on the screen.

**Independent Test**: Open home, locate the large circular action, and verify that it uses the brand-orange background, a cigarette icon, and white bold text. Tap it and confirm the existing intervention flow opens.

**Acceptance Scenarios**:

1. **Given** the home screen, **When** the impulse action renders, **Then** it is a large `rounded-full` brand-orange circle centered in the available screen space.
2. **Given** the impulse action, **When** the person views it, **Then** it contains a cigarette icon and white bold "Quiero fumar" text with no interior subtitle.
3. **Given** the impulse action, **When** the person taps it, **Then** the existing pause intervention opens without behavior changes.
4. **Given** the pressed state, **When** the person interacts with the action, **Then** the feedback remains visible and the white text stays readable.

---

### User Story 4 - Preserve Design Decisions for Future Work (Priority: P4)

A designer or developer opens the project design reference and finds the palette, token roles, ordering, border treatments, background rules, and component guidance needed to extend the app without inventing a new visual language.

**Why this priority**: The theme must remain consistent as new screens and features are added. Documentation prevents future drift.

**Independent Test**: Read `system-design.md` and confirm it documents every color token, its intended role, the visual hierarchy of surfaces, border and radius conventions, and examples for navigation and intervention states.

**Acceptance Scenarios**:

1. **Given** the repository, **When** a contributor looks for visual guidance, **Then** `system-design.md` exists and documents the Tabaco & Fuego palette and token order.
2. **Given** a new screen being designed, **When** the contributor follows `system-design.md`, **Then** they can choose background, card, border, primary text, secondary text, accent, and status treatments without guessing.
3. **Given** a future color or component change, **When** it affects the design language, **Then** `system-design.md` is updated in the same change.

---

### Edge Cases

- What happens on a very narrow screen? The tab bar MUST keep all five equal-width tabs fully visible without horizontal scrolling or clipped labels.
- What happens when text sits directly on brand orange? The system MUST use white text for active pills and bright actions, and deep ember `accent-strong` for small orange text on light surfaces.
- What happens when a status is not an alert? The system MUST use deep amber `brand-amber` for pause, progress, and achievement text rather than the alert orange.
- What happens when a screen is missed during restyling? The system MUST be audited for remaining navy or mint-green classes before the feature is considered complete.
- What happens when a person cannot distinguish orange from amber? The active navigation state MUST also rely on fill, weight, or shape rather than color alone.
- What happens when an existing flow has disabled or pressed states? Those states MUST remain visibly distinct and readable under the new palette.
- What happens to data and calculations during the visual change? They MUST remain unchanged; only presentation and visual structure may change.
- What happens if the design reference is not updated with a new token? The token MUST NOT be used until it is documented, to prevent visual drift.

## Requirements *(mandatory)*

### Functional Requirements

EARS-syntax requirements (per constitution section 4):

- **FR-001** (Ubiquitous): The system shall define a soft cream page background with the value `#F8F6F4`.
- **FR-002** (Ubiquitous): The system shall define a white card surface with the value `#FFFFFF`.
- **FR-003** (Ubiquitous): The system shall define a warm light-gray border with the value `#E5E0DA`.
- **FR-004** (Ubiquitous): The system shall define deep tobacco-brown primary text with the value `#1A1412`.
- **FR-005** (Ubiquitous): The system shall define medium gray-brown secondary text with the value `#6E655F`.
- **FR-006** (Ubiquitous): The system shall define brand orange as the primary action, alert, and intervention accent with the value `#FF5722`.
- **FR-007** (Ubiquitous): The system shall define deep ember `accent-strong` with the value `#C2410C` for small orange text on light surfaces and pressed orange actions.
- **FR-008** (Ubiquitous): The system shall define deep amber `brand-amber` with the value `#B45309` for pause, progress, achievement, and amber text states.
- **FR-009** (Ubiquitous): The system shall replace navy-blue, mint-green, and dark-mode surfaces, text, borders, and accents across the primary screens with the light Tabaco & Fuego roles.
- **FR-010** (Event-driven): WHEN the home screen renders the "Quiero fumar" action, the system shall present it as a large brand-orange circle centered in the available screen space, with a cigarette icon and white bold text and no interior subtitle.
- **FR-011** (Ubiquitous): The main navigation shall be a fixed top tab bar with Inicio, Historial, Inventario, Logros, and Equipo, persistent across the main views.
- **FR-012** (Event-driven): WHEN the person taps a main tab, the system shall replace the current main view immediately without requiring a back action.
- **FR-013** (State-driven): WHILE a navigation destination represents the current section, the system shall show a brand-orange fill with white text, distinct from inactive destinations.
- **FR-014** (State-driven): WHILE the tab bar is shown on a narrow screen, the system shall fit all five equal-width tabs within the screen width without horizontal scrolling or clipped labels.
- **FR-015** (Ubiquitous): The system shall use the deep amber accent for pause, progress, and achievement states instead of the alert orange.
- **FR-016** (Ubiquitous): The system shall maintain readable contrast for primary and secondary text on every light surface, including pressed and disabled states.
- **FR-017** (Ubiquitous): The system shall use soft card shadows and clearly defined borders so white cards remain distinguishable from the cream page.
- **FR-018** (Ubiquitous): The system shall provide a `system-design.md` reference that documents the palette, token roles, visual ordering, backgrounds, borders, radii, and component usage guidance.
- **FR-019** (Event-driven): WHEN a future visual change introduces or modifies a design token, the system shall update `system-design.md` in the same change.
- **FR-020** (State-driven): WHILE the theme is applied, the system shall preserve all existing persistence, query, hook, navigation-destination, and calculation behavior.
- **FR-021** (Unwanted Behavior): IF a primary screen still shows navy, mint-green, or dark-mode styling, THEN the system shall treat the theme as incomplete and the screen shall be corrected.
- **FR-022** (Unwanted Behavior): IF text or an icon loses readability on a light surface, THEN the system shall adjust the foreground role or surface treatment before release.
- **FR-023** (Ubiquitous): The home screen shall show only the current-streak card and a compact today summary of resisted/ceded counts above the central action.
- **FR-024** (Ubiquitous): The home screen shall not include avoided-cigarettes, money-saved, inventory-spending, or pack-count cards.
- **FR-025** (Ubiquitous): The home screen shall not include the removed filler phrases specified in the dashboard simplification feature.
- **FR-026** (Ubiquitous): The main views `/`, `/history`, `/inventory`, `/badges`, and `/team` shall show the fixed top tab bar and shall not show redundant "Volver" buttons; team create/join/detail sub-screens retain back navigation.
- **FR-027** (State-driven): WHILE switching between main tabs, the system shall keep the tab navigator and previously visited screens mounted so the UI does not flash blank or rebuild the full hierarchy.
- **FR-028** (Ubiquitous): The root navigation container and tab scenes shall use the `background` theme color so route transitions never expose a white or black frame.
- **FR-029** (State-driven): WHILE local SQLite data is loading, each main screen shall render a stable loading state over the themed background rather than an empty flash.

### Key Entities *(include if feature involves data)*

- **Design Token**: A named visual role such as background, card, border, primary text, secondary text, brand orange, accent-strong, brand amber, or white, with a fixed color value and intended usage.
- **Theme Surface**: A layered visual region composed of background, card, border, and text roles used consistently across screens.
- **Navigation Pill**: A destination entry with a label, target route, active/inactive state, and pressed feedback.
- **Intervention Action**: The prominent "Quiero fumar" control that uses the brand-orange role and opens the existing pause flow.
- **Design Reference**: The `system-design.md` document that records token values, ordering, visual rules, and usage guidance for future iterations.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of audited primary screens use the light Tabaco & Fuego palette, with 0 remaining navy-blue, mint-green, or dark-mode surfaces, accents, or text roles.
- **SC-002**: 100% of taps on the Equipo tab open the squad screen, with 0 navigation regressions on the other four destinations.
- **SC-003**: The active tab is identifiable through a brand-orange fill and weight difference in 100% of tested screens, and the five equal-width tabs fit without horizontal scrolling.
- **SC-004**: All five tabs remain fully visible and their short labels readable at the narrowest supported phone width, with Equipo 100% visible.
- **SC-005**: Primary text, secondary text, deep ember text, and deep amber text meet a contrast ratio of at least 4.5:1 on their intended light surfaces in 100% of audited combinations.
- **SC-006**: The "Quiero fumar" action is a large centered brand-orange circle with a cigarette icon and white bold text, remains the most visually prominent home action, and opens the existing pause flow in 100% of tested cases.
- **SC-007**: `system-design.md` documents every token, role, visual order, border convention, background rule, and component example required to extend the theme without guessing.
- **SC-008**: Existing measurements, saved records, and navigation destinations remain unchanged after the visual update, with 0 regressions in automated checks.
- **SC-009**: White cards remain distinguishable from the cream page through a defined border and soft shadow in 100% of audited screens.
- **SC-010**: Switching between any two main tabs produces no blank, white, or black flash in 100% of tested transitions, and previously visited tab state remains mounted.
- **SC-011**: Route transitions and local-data loading always show the themed background, with 0 frames of unstyled default background.

## Clarification Gates

The constitution requires open product decisions to be stated before planning. The following defaults are resolved for this feature and remain available for adjustment before implementation.

1. **Brand orange value**
   - Context: The request allows either `#FF5722` or `#E65100`.
   - Recommended default: Use `#FF5722` for borders, glows, active fills, and the intervention accent, plus `accent-strong #C2410C` for small orange text on light surfaces.
   - Alternative: Use `#E65100` for a deeper, less saturated ember treatment.

2. **Theme scope**
   - Context: The request names Dashboard, Inventory, and the main action but also asks to replace all navy and mint tones.
   - Recommended default: Apply the theme app-wide, prioritizing Dashboard and Inventory, while auditing every primary screen for legacy colors.
   - Alternative: Limit the first iteration strictly to Dashboard and Inventory and schedule the remaining screens later.

3. **Design reference location**
   - Context: `system-design.md` is requested without a path.
   - Recommended default: Place `system-design.md` at the repository root so it is easy to find alongside the constitution and code rules.
   - Alternative: Place it under `specs/012-tabaco-fuego-theme/` as part of the feature package.

## Assumptions

- The app should feel warm, fresh, urban, and identity-driven rather than clinical or corporate.
- The theme applies app-wide in light mode, with Dashboard and Inventory treated as the first screens to audit and update.
- Brand orange `#FF5722` is the primary accent; `accent-strong #C2410C` is the accessible deep-ember variant for small orange text and pressed states; `brand-amber #B45309` is reserved for pause, progress, and achievement text.
- Deep tobacco brown is used for primary text on cream and white surfaces; white is used for text and icons on orange or amber fills.
- The existing navigation destinations and the `/team` route remain the source of truth; this feature only ensures the Equipo entry is present and clearly active/inactive.
- `system-design.md` lives at the repository root and is the canonical design reference for future iterations.
- No new runtime dependencies are required.
- No SQLite schema, Drizzle query, hook logic, or metric calculation changes are included.
- Voice, copy, and content are preserved except where a label must change to match the new visual hierarchy.
- Accessibility is evaluated on the supported phone widths and standard system text scaling.
