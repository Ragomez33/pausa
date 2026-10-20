# Feature Specification: Inventory Control & Financial Sync

**Feature Branch**: `005-inventory-control`

**Created**: 2026-10-19

**Status**: Draft

**Input**: User description: "Implementar el módulo de Control de Inventario de cigarrillos en la aplicación local-first, permitiendo al usuario llevar la trazabilidad de sus cajetillas y existencias actuales. Registrar movimientos de inventario (compra/consumo) con timestamp, tipo, cantidad y costo opcional. Mostrar stock actual de cigarrillos y cajetillas, consumo diario del perfil y días restantes. Reemplazar la alerta de inventario bajo por una reflexión financiera no alarmista. Botón rápido 'Registrar Compra de Cajetilla' con unidades y costo opcional. Registrar consumos. Actualizar reactivamente las métricas financieras del Home. Todo local, sin red."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - See Current Stock and a Conscious Reflection (Priority: P1)

A person opens the inventory section and immediately sees how many cigarettes and full packs they currently have, how many days that supply is expected to last at their configured daily consumption, and a supportive financial reflection when the supply is running low.

**Why this priority**: Knowing what is on hand is the core value of inventory control and the prerequisite for meaningful purchase or consumption actions. The reflection must reinforce the goal of reducing consumption instead of nudging the person to restock.

**Independent Test**: Seed a profile with a known daily consumption and a known set of inventory movements, open the inventory view, and verify stock, packs, days remaining, and the conscious reflection match the stored records; change the records and confirm the view updates on return.

**Acceptance Scenarios**:

1. **Given** a profile and no inventory movements, **When** the inventory view opens, **Then** it shows 0 cigarettes, 0 packs, and a non-alarming conscious reflection without crashing.
2. **Given** purchases and consumptions that net to 45 cigarettes, **When** the inventory view opens, **Then** it shows 45 cigarettes and 2 full packs.
3. **Given** 60 cigarettes in stock and a daily consumption of 20, **When** the inventory view opens, **Then** it shows approximately 3 days remaining.
4. **Given** a supply that will last 3 days or less (or is empty), **When** the inventory view renders, **Then** a supportive reflection encourages avoiding the next pack purchase instead of showing a low-inventory alert.
5. **Given** the inventory view is open, **When** a movement is recorded, **Then** the stock, packs, days remaining, and reflection refresh without an app restart.

---

### User Story 2 - Register a Pack Purchase (Priority: P2)

The person buys one or more packs and records the purchase from a quick action. They enter how many packs they bought and, optionally, what they paid. The stock increases immediately in cigarettes and packs, and any entered cost is added to the recorded spending.

**Why this priority**: Purchases are the main way inventory enters the system; without them, consumption tracking would drain an always-empty stock.

**Independent Test**: From an empty inventory, register a purchase of 2 packs for a known cost and confirm the event is stored, stock increases by 40 cigarettes, packs show 2, total spending increases by the entered cost, and the view refreshes.

**Acceptance Scenarios**:

1. **Given** the inventory view, **When** the person opens the quick purchase action, **Then** they can enter a number of packs and an optional cost.
2. **Given** a valid purchase of 2 packs, **When** it is saved, **Then** a purchase movement is stored with the pack count converted to cigarettes and the optional cost.
3. **Given** a purchase with no cost entered, **When** it is saved, **Then** stock increases and the purchase is recorded without adding to total spending.
4. **Given** zero, negative, or non-numeric pack quantities, **When** the person submits, **Then** the save is blocked with a clear message.
5. **Given** the person taps save repeatedly, **When** the first save succeeds, **Then** only one purchase movement is stored.

---

### User Story 3 - Register Consumption and Keep Home Finances Current (Priority: P3)

The person records cigarettes consumed, and the stock decreases accordingly. When they return to the home screen, the global financial information reflects their inventory spending without requiring a restart or manual refresh.

**Why this priority**: Consumption keeps the stock honest, while the home financial view connects inventory behavior to the person's broader progress.

**Independent Test**: With stock available, record a consumption and confirm the stock decreases, the movement is stored, consumption beyond stock is blocked, and the home financial summary reflects inventory spending on return.

**Acceptance Scenarios**:

1. **Given** stock of 40 cigarettes, **When** the person records a consumption of 10 cigarettes, **Then** a consumption movement is stored and stock becomes 30.
2. **Given** stock of 10 cigarettes, **When** the person tries to record a consumption of 11, **Then** the save is blocked and no movement is stored.
3. **Given** one or more purchases with costs, **When** the home screen opens, **Then** the financial summary shows the cumulative inventory spending alongside the existing savings information.
4. **Given** a saved purchase or consumption, **When** the person returns to home, **Then** the financial summary is current without an app restart.
5. **Given** the person leaves the consumption or purchase form without saving, **Then** nothing is stored.

---

### Edge Cases

- What happens when no profile exists? The person MUST be routed to onboarding before using inventory.
- What happens when daily consumption is zero? Days remaining MUST be shown as unavailable rather than dividing by zero; the reflection applies only when stock is empty.
- What happens when a consumption exceeds available stock? The save MUST be blocked and stock MUST never become negative.
- What happens when a purchase cost is empty? The purchase MUST still be recorded, with no addition to total spending.
- What happens when a purchase cost is negative or non-numeric? The save MUST be blocked with a clear message.
- What happens when a quantity is zero, negative, fractional, or non-numeric? The save MUST be blocked.
- What happens when the same save action is triggered repeatedly? At most one movement per completed submission.
- What happens when stock reaches exactly zero? The inventory view MUST show an empty state and a conscious reflection that discourages an automatic restock.
- What happens when storage fails during a save? No partial movement may be stored, and a clear error MUST be shown.
- What happens when the person switches away mid-form? Draft values may be discarded; no movement is stored until submit.

## Requirements *(mandatory)*

### Functional Requirements

EARS-syntax requirements (per constitution section 4):

- **FR-001** (Ubiquitous): The system shall record every inventory movement as an immutable local record containing its moment, action type, quantity, and optional cost.
- **FR-002** (Ubiquitous): The system shall support exactly two movement types: purchase and consumption.
- **FR-003** (Ubiquitous): The system shall store movement quantities as positive whole numbers of cigarettes.
- **FR-004** (Ubiquitous): The system shall store a cost only for purchases, allowing it to be absent.
- **FR-005** (Event-driven): WHEN a purchase is recorded, the system shall add its cigarette quantity to available stock.
- **FR-006** (Event-driven): WHEN a consumption is recorded, the system shall subtract its cigarette quantity from available stock.
- **FR-007** (Ubiquitous): The system shall display current stock in cigarettes and the equivalent number of full packs.
- **FR-008** (Ubiquitous): The system shall display estimated days remaining based on the profile's daily cigarette consumption.
- **FR-009** (State-driven): WHILE the estimated supply is 3 days or less, or stock is empty, the system shall show a supportive financial reflection that encourages avoiding the next pack purchase without presenting an alarming low-inventory warning.
- **FR-010** (Event-driven): WHEN the person taps "Registrar Compra de Cajetilla", the system shall present a form for pack count and optional cost.
- **FR-011** (Event-driven): WHEN a valid purchase of N packs is saved, the system shall store a purchase movement whose quantity equals N packs converted to cigarettes.
- **FR-012** (Event-driven): WHEN a valid consumption of N cigarettes is saved, the system shall store a consumption movement with that quantity.
- **FR-013** (Unwanted Behavior): IF a consumption exceeds available stock, THEN the system shall block the save and explain that stock is insufficient.
- **FR-014** (Unwanted Behavior): IF a quantity or cost is empty, non-numeric, negative, or otherwise invalid, THEN the system shall block the save and communicate the error clearly.
- **FR-015** (Unwanted Behavior): IF storage fails during a save, THEN the system shall not persist a partial movement and shall show a clear, user-visible error.
- **FR-016** (Unwanted Behavior): IF the same submission is triggered repeatedly, THEN the system shall store at most one movement.
- **FR-017** (State-driven): WHILE no profile exists, the system shall block inventory access and route the person to onboarding.
- **FR-018** (Ubiquitous): The system shall compute total inventory spending as the sum of purchase costs that were provided; missing costs contribute zero.
- **FR-019** (Event-driven): WHEN a purchase or consumption is saved, the system shall refresh stock and financial information without requiring an app restart.
- **FR-020** (Event-driven): WHEN the home screen becomes visible after an inventory change, the system shall show current inventory spending.
- **FR-021** (Ubiquitous): The system shall keep all inventory data on the device and shall not perform network calls or remote synchronization.
- **FR-022** (Ubiquitous): The system shall retain every movement for traceability and derive current stock from those records rather than storing a mutable stock total as the source of truth.
- **FR-023** (Ubiquitous): The inventory screen shall present high-contrast cards with rounded corners, subtle neon-accented borders, and consistent typography aligned with the dashboard.
- **FR-024** (Ubiquitous): The inventory quick actions and forms shall use clear visual hierarchy, readable contrast, and touch targets of at least 44 points.
- **FR-025** (Ubiquitous): The removal of the low-inventory alert and the visual redesign shall not alter inventory calculations, validation, persistence, or spending behavior.

### Key Entities *(include if feature involves data)*

- **Inventory Movement**: An immutable record of stock entering or leaving.
  - Moment of the movement (ISO date-time)
  - Action type: purchase or consumption
  - Quantity in cigarettes (positive whole number)
  - Optional cost (non-negative, purchases only)
- **Inventory Summary** (derived, not stored):
  - Current cigarettes in stock: purchases minus consumptions, never below zero
  - Full packs available: whole packs contained in the current stock
  - Estimated days remaining: stock divided by the profile's daily cigarette average, or unavailable when that average is zero
  - Low-inventory state: true when stock is empty or estimated days remaining is 3 or less
  - Total inventory spending: sum of provided purchase costs
- **User Profile** (read-only): provides daily cigarette average, currency, and the onboarding guard.
- **Home Financial Summary** (derived, not stored): existing savings information plus cumulative inventory spending.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of displayed stock, pack, and days-remaining values match a manual calculation from the stored movements and profile, with 0 hardcoded values.
- **SC-002**: A person can record a purchase or consumption in under 30 seconds from opening the corresponding action.
- **SC-003**: 100% of valid purchases and consumptions are persisted and reflected in the inventory summary on the next view.
- **SC-004**: 100% of attempts to consume more than available stock are blocked, with 0 cases of negative stock.
- **SC-005**: The conscious reflection appears in 100% of tested cases at 3 or fewer estimated days and when stock is empty, and does not appear when more than 3 days remain; no low-inventory warning is displayed in any case.
- **SC-006**: Repeated taps produce at most one stored movement in 100% of tested cases.
- **SC-007**: After returning home from an inventory change, the financial summary reflects total inventory spending with 0 app restarts required.
- **SC-008**: 100% of invalid quantity/cost submissions are blocked with a visible message, and 0 invalid movements are stored.
- **SC-009**: 100% of inventory operations remain local, with 0 network requests.
- **SC-010**: The inventory screen keeps its stock, spending, and reflection content readable without clipped labels at the supported phone widths.

## Clarification Gates

The constitution requires open product decisions to be stated before planning. The following points have recommended defaults and remain open for confirmation before `/speckit.plan`.

1. **Movement quantity unit**
   - Context: The request says quantity may represent cigarettes or packs, while the purchase form asks for pack units.
   - Recommended default: Store every movement as a number of cigarettes. The purchase form collects whole packs and converts them using 20 cigarettes per pack; consumption collects cigarettes directly.
   - Alternative: Store packs for purchases and cigarettes for consumptions, requiring unit-aware summing everywhere.

2. **Conscious-reflection threshold**
   - Context: "Por agotarse" is not quantified.
   - Recommended default: Show the financial reflection when estimated days remaining is 3 or less, or when stock is empty. With daily consumption at zero, show it only when stock is empty.
   - Alternative: Show it below one full pack, or use a configurable user threshold.

3. **Home financial meaning**
   - Context: The home currently shows estimated money saved from resisted impulses; the request asks to recalculate global financial metrics after inventory changes.
   - Recommended default: Keep the existing savings figure and add cumulative inventory spending as a separate value, so the person sees both without changing the savings definition.
   - Alternative: Show a single net balance (savings minus inventory spending), or replace savings with spending.

## Assumptions

- The app is local-first; inventory data never leaves the device in this feature.
- One pack equals 20 cigarettes, consistent with the existing app constant.
- A purchase is entered as a whole number of packs; consumption is entered as a whole number of cigarettes.
- Current stock is always derived from the movement log, never from a separately editable total.
- Stock cannot go below zero; a consumption larger than the available stock is rejected.
- Costs are optional for purchases. Missing costs do not count toward total spending; entered costs are non-negative.
- The conscious-reflection threshold is 3 estimated days remaining, or empty stock.
- The reflection never instructs the person to buy more cigarettes; it reinforces avoiding the next pack purchase.
- The inventory summary refreshes when the screen gains focus and immediately after a successful save.
- The home financial summary refreshes on focus, using the existing home refresh behavior.
- Currency display uses the profile currency with a readable fallback for invalid codes.
- The existing onboarding guard and local persistence layer remain in place; this feature builds on them.
- No network calls, remote synchronization, or team aggregation are included.
