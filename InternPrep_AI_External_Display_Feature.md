# InternPrep AI --- External Display Workspace / Presentation Mode

## 1. Feature Overview

### Feature name

**External Display Workspace / Presentation Mode**

### Purpose

Add a safe, focused multi-display capability to the existing
**InternPrep AI Case Interview Simulator**.

The current Case Interview Simulator already uses a split-screen
experience:

-   **Left side:** live interview experience with the AI interviewer,
    conversation, interview stages, quick suggestions, and answer input.
-   **Right side:** visual workspace used for the case scratchpad/canvas
    and for viewing the original case document.

The assignment requirement is to create a feature where, after an
external display is connected, the user can click one button and move
the visual/media area to the external display while keeping the
instructions/interview experience on the primary display.

The implementation should therefore treat the existing right-hand
workspace as a reusable **presentation surface**, rather than creating a
separate video-only feature.

The feature must remain simple, reliable, visually polished, and
isolated from unrelated InternPrep AI functionality.

------------------------------------------------------------------------

# 2. Assignment Context

The external assignment asks for a simple interaction:

1.  A media/video area is shown on one half of the screen.
2.  Instructions/text are shown on the other half.
3.  When an external display is connected, clicking a button moves the
    media/video to the external display.
4.  The original screen retains only the instructions.

For InternPrep AI, this maps naturally to the existing Case Interview
Simulator:

``` text
Primary Display
+-----------------------------------------------------------+
|                                                           |
|                    INTERVIEW PANEL                       |
|                                                           |
|  AI interviewer                                           |
|  Conversation                                             |
|  Interview phases                                         |
|  Quick suggestions                                        |
|  Answer input                                             |
|                                                           |
+-----------------------------------------------------------+

External Display
+-----------------------------------------------------------+
|                                                           |
|                    WORKSPACE PANEL                        |
|                                                           |
|  Scratchpad / Case Document / Video                       |
|                                                           |
+-----------------------------------------------------------+
```

The key product decision is:

> **Do not implement this as "move a video element to another monitor."
> Implement it as "present the existing workspace on another display."**

This makes the feature reusable for the existing scratchpad, case
document, video/media, and future visual learning content.

------------------------------------------------------------------------

# 3. Why This Belongs in InternPrep AI

InternPrep AI is an existing AI-powered placement preparation platform
with multiple workflows and active users. The resume describes it as a
deployed full-stack platform with 5+ workflows, 75+ features, 100+
active users, and an AI/RAG framework using Gemini multimodal processing
and pgvector.

This assignment should therefore be implemented as a **small extension
of an existing product**, not as a separate throwaway application.

The feature should demonstrate:

-   understanding of an existing codebase
-   careful UI preservation
-   reusable component design
-   browser/window APIs
-   practical multi-display UX
-   safe incremental development
-   ability to ship a focused feature without disturbing existing
    functionality

The resume context supports positioning InternPrep AI as an existing
product rather than a new assignment-only prototype.

------------------------------------------------------------------------

# 4. Current UI Context

The target screen is the existing **Case Interview Simulator**.

The current layout is approximately:

``` text
+---------------------------------------------------------------+
| Back | CASE INTERVIEW SIMULATOR | Timer | Controls | End      |
+---------------------------------------------------------------+
| Interview phases / progress                                   |
+----------------------------------+----------------------------+
|                                  |                            |
|                                  |                            |
|          INTERVIEW               |         WORKSPACE          |
|                                  |                            |
|   AI interviewer                 |     Scratchpad / Canvas    |
|   conversation                   |     / Case Document        |
|                                  |                            |
|                                  |                            |
|                                  |                            |
|                                  |                            |
+----------------------------------+----------------------------+
| Quick suggestions / Answer input |                            |
+----------------------------------+----------------------------+
```

The left side is the primary interaction surface.

The right side is the visual workspace.

The existing design should **not be redesigned**.

------------------------------------------------------------------------

# 5. Core Product Principle

## Separate the content from its rendering location

The workspace should be thought of as:

``` text
Workspace Content
       |
       +---- Scratchpad
       |
       +---- Document
       |
       +---- Video
       |
       +---- Future Media
```

and separately:

``` text
Workspace Presentation Location
       |
       +---- Primary Window
       |
       +---- External Window
```

Therefore:

``` text
WorkspacePanel(content, presentationMode)
```

rather than creating separate implementations for:

``` text
VideoOnExternalDisplay
DocumentOnExternalDisplay
ScratchpadOnExternalDisplay
```

The same workspace component should be capable of rendering in either
location.

------------------------------------------------------------------------

# 6. MVP Scope

The following are mandatory.

### 6.1 Existing workspace remains unchanged by default

When no external presentation is active, the Case Interview Simulator
must behave and look exactly as it currently does.

### 6.2 Detect an external display

Use the browser's Window Management API where supported:

``` javascript
window.getScreenDetails()
```

The implementation should identify a display other than the primary
display.

### 6.3 Add a presentation control

Add a small, visually consistent control to the workspace header, for
example:

``` text
Present Workspace
```

The control should fit the existing design language.

### 6.4 Open the workspace on the external display

When the user clicks the presentation button:

1.  detect available screens
2.  select an external/non-primary display
3.  open a dedicated presentation window
4.  position it using the external display's available coordinates and
    dimensions
5.  render the workspace content in that window

### 6.5 Keep the interview on the primary display

The left interview experience remains on the current screen.

The candidate should still be able to:

-   see the interviewer
-   read the conversation
-   navigate interview stages
-   use quick suggestions
-   enter answers
-   control the session

### 6.6 Preserve usefulness of the right-side area

Do not leave a blank white panel after the workspace moves.

Replace the right-side workspace with a polished state such as:

``` text
Workspace Presented

Your workspace is currently open
on the external display.

● External Display Connected

[ Return Workspace ]
```

This ensures the existing page remains intentional and useful.

### 6.7 Return the workspace

A button should close the external presentation window and restore the
workspace to the primary display.

### 6.8 Support multiple workspace content types

The presentation mechanism must be content-agnostic.

It should work with:

-   existing scratchpad/canvas
-   existing case document viewer
-   video/media content

The assignment must not become tied specifically to video.

------------------------------------------------------------------------

# 7. Non-Goals

Do NOT build the following for this assignment:

-   backend changes
-   database changes
-   new authentication
-   new user roles
-   WebSocket infrastructure
-   WebRTC
-   Electron
-   Tauri
-   desktop application packaging
-   new state-management libraries
-   new design system
-   classroom management system
-   analytics
-   recording
-   screen sharing
-   complicated display selection UI
-   resolution selection
-   presentation settings
-   unrelated UI redesign
-   large refactor of the Case Interview Simulator

The implementation should be surgical and incremental.

------------------------------------------------------------------------

# 8. Recommended Architecture

## 8.1 Conceptual structure

``` text
Case Interview Simulator
|
+-- InterviewPanel
|
+-- WorkspaceController
       |
       +-- WorkspacePanel
       |      |
       |      +-- Scratchpad
       |      +-- DocumentViewer
       |      +-- VideoPlayer
       |
       +-- PresentationController
              |
              +-- Display Detection
              +-- External Window
              +-- Presentation State
```

## 8.2 Important rule

The presentation controller should know **where** to render the
workspace.

It should not know the implementation details of whether the workspace
contains:

-   a canvas
-   PDF/document
-   video

The workspace component should remain responsible for rendering its
content.

------------------------------------------------------------------------

# 9. Suggested Component Responsibilities

The exact names should follow the existing project's conventions. Do not
create duplicate abstractions if equivalent components already exist.

### WorkspacePanel

Responsible for rendering the existing right-hand content.

Possible content:

``` typescript
type WorkspaceContent =
  | { type: "scratchpad" }
  | { type: "document"; url: string }
  | { type: "video"; url: string };
```

The actual existing application's types and state should be preferred
over introducing this exact type if equivalent state already exists.

### WorkspaceController

Responsible for deciding whether the workspace is:

``` text
inline
```

or:

``` text
external
```

### PresentationController

Responsible for:

-   detecting external display
-   opening the presentation window
-   positioning it
-   tracking whether it is open
-   closing it
-   restoring the workspace

### Presentation Window

Should render only the workspace/presentation surface.

It should NOT duplicate the interview UI.

------------------------------------------------------------------------

# 10. Window Management API

Use the browser Window Management API where supported.

Primary API:

``` javascript
const screenDetails = await window.getScreenDetails();
```

Then inspect:

``` javascript
screenDetails.screens
```

A screen object can provide information such as:

``` javascript
availLeft
availTop
availWidth
availHeight
isPrimary
isInternal
```

The exact browser-supported properties should be verified during
implementation.

The intended selection logic is conceptually:

``` javascript
const externalScreen = screenDetails.screens.find(
  (screen) => !screen.isPrimary
);
```

or another robust condition based on the actual browser data.

Do not hard-code:

``` text
1920x1080
```

or:

``` text
left = 1920
```

The actual display geometry must come from the browser API.

------------------------------------------------------------------------

# 11. Opening the External Presentation Window

The presentation window should be opened directly from the user's click
event to avoid popup blocking.

Conceptually:

``` text
User clicks Present Workspace
        |
        v
getScreenDetails()
        |
        v
Find external display
        |
        v
window.open()
        |
        v
Position using display geometry
        |
        v
Render Workspace
```

Do not open the window automatically on page load.

Do not create hidden popup windows.

Do not ask the user to manually drag the window to another monitor if
the browser API can place it automatically.

------------------------------------------------------------------------

# 12. Presentation Window UI

The external window should be intentionally minimal.

For a scratchpad:

``` text
+---------------------------------------------------------+
|                                                         |
|                    CASE WORKSPACE                       |
|                                                         |
|                 Existing Scratchpad                     |
|                                                         |
+---------------------------------------------------------+
```

For a document:

``` text
+---------------------------------------------------------+
|                                                         |
|                  CASE DOCUMENT                          |
|                                                         |
|                 Existing Viewer                         |
|                                                         |
+---------------------------------------------------------+
```

For video:

``` text
+---------------------------------------------------------+
|                                                         |
|                      VIDEO                              |
|                                                         |
|                                                         |
+---------------------------------------------------------+
```

Use the existing application's styling and components wherever possible.

Do not create a visually unrelated "presentation app."

------------------------------------------------------------------------

# 13. Primary Screen After Presentation

The right-hand area should not become an empty placeholder.

Recommended state:

``` text
+----------------------------------------------+
| Workspace                                    |
|                                              |
|             Workspace Presented              |
|                                              |
|       Your workspace is open on the          |
|       external display.                      |
|                                              |
|       ● External Display                    |
|                                              |
|          [ Return Workspace ]                |
|                                              |
+----------------------------------------------+
```

The interview panel on the left remains active.

The top-level header, timer, controls, phases, and answer input should
remain functional.

------------------------------------------------------------------------

# 14. State Management

This is one of the most important parts.

There must be **one logical source of truth** for workspace state.

Do not create:

``` text
Primary Scratchpad State
External Scratchpad State
```

Instead:

``` text
Shared Workspace State
        |
        +---- Primary Renderer
        |
        +---- External Renderer
```

If the existing scratchpad already has a state-management mechanism,
reuse it.

If the existing workspace is already controlled by a parent component,
preserve that structure.

Do not introduce Redux/Zustand/etc. simply for this feature.

------------------------------------------------------------------------

# 15. Important Scratchpad Considerations

The current right-hand area appears to contain a rich canvas/scratchpad
with tools such as selection, shapes, arrows, pen, text, image and
eraser.

Before implementation, inspect how the existing scratchpad is built.

Specifically check whether it relies on:

-   `window`
-   `document`
-   viewport dimensions
-   pointer events
-   keyboard listeners
-   resize listeners
-   global event listeners
-   portals
-   canvas coordinates
-   browser-specific APIs

When rendering into another window, make sure event listeners and DOM
references are associated with the correct window/document where
necessary.

Do NOT rebuild the scratchpad.

Reuse the existing component.

------------------------------------------------------------------------

# 16. Document Viewer Considerations

The existing document viewer should also be reused.

If it uses:

-   iframe
-   PDF renderer
-   embedded viewer
-   custom document component

do not replace it.

The presentation mechanism should simply provide a different rendering
destination.

Verify:

-   scrolling works
-   zoom works if already supported
-   document remains readable
-   window dimensions are handled correctly

------------------------------------------------------------------------

# 17. Video Support

The assignment explicitly mentions video/media.

The architecture must therefore support:

``` text
WorkspaceContent = video
```

The presentation mechanism should not contain video-specific logic
beyond rendering the existing video component.

For the MVP, it is acceptable for the presentation video to start from
its current/default position.

Optional enhancement only if time allows:

-   preserve current timestamp
-   synchronize play/pause
-   synchronize seek position

Do not spend core implementation time on synchronization.

------------------------------------------------------------------------

# 18. External Window Lifecycle

The feature should handle the basic lifecycle cleanly.

### Open

``` text
Primary -> External
```

### Active

``` text
Primary:
Interview + presentation status

External:
Workspace
```

### Return

``` text
External window closes
Primary:
Interview + workspace restored
```

### User manually closes external window

The application should ideally detect this and restore the workspace to
inline mode.

If detecting this requires significant complexity, implement a simple
polling/closed-state check rather than adding complex infrastructure.

------------------------------------------------------------------------

# 19. No External Display

If the user clicks the button but no external display is available:

Show a friendly message:

``` text
No external display detected.

Connect an extended display and try again.
```

The existing workspace must remain fully usable.

Never hide the workspace before successfully opening the external
presentation.

------------------------------------------------------------------------

# 20. Unsupported Browser

The Window Management API is not universally supported.

If unavailable:

``` text
External display presentation is not supported
in this browser.

Try a supported Chromium-based browser.
```

The normal workspace should continue to work.

The feature should fail gracefully.

Do not make the entire Case Interview Simulator dependent on this API.

------------------------------------------------------------------------

# 21. Permission Handling

The browser may ask the user for permission to access multi-screen
information.

This is expected.

The implementation should:

-   trigger permission from the user action
-   handle denial gracefully
-   not crash
-   keep the workspace inline if permission is denied

Do not build a custom permission system.

------------------------------------------------------------------------

# 22. Layout Preservation

This is critical.

The existing Case Interview Simulator is visually complex and already
designed as a split-screen experience.

When presentation mode is inactive:

``` text
Existing layout = unchanged
```

When presentation mode is active:

``` text
Left interview panel = remains fully functional

Right panel = becomes presentation status
```

Do not make broad layout changes.

Avoid changing:

-   header dimensions
-   phase navigation
-   conversation styling
-   answer box behavior
-   timer placement
-   global spacing
-   typography
-   colors
-   unrelated responsive breakpoints

The goal is to add functionality, not redesign the simulator.

------------------------------------------------------------------------

# 23. UI/UX Requirements

The feature should feel like it belongs to InternPrep AI.

Use:

-   existing buttons
-   existing typography
-   existing border radius
-   existing spacing
-   existing icon style
-   existing colors
-   existing status indicators

Recommended states:

### Normal

``` text
Workspace                     [ Present ]
```

### External display detected

``` text
Workspace              [ Present ]
```

Optionally show a subtle indicator:

``` text
● External display available
```

### Presenting

``` text
Workspace              [ Return ]
```

with:

``` text
● Presented on external display
```

### Error

Use a non-blocking toast/banner where the existing application already
has a notification pattern.

Do not introduce a new notification library.

------------------------------------------------------------------------

# 24. Testing Without a Physical Second Monitor

The developer may not always have access to a secondary display.

Testing should therefore happen in layers.

## Layer 1 --- Normal UI testing

Verify:

-   existing page loads
-   existing workspace works
-   button appears correctly
-   no external mode does not alter behavior

## Layer 2 --- Mock display development mode

During development only, provide a minimal mock path for the display
detection function.

Conceptually:

``` text
getPresentationDisplay()
|
+-- real mode -> Window Management API
|
+-- mock mode -> simulated display
```

Do not ship a visible mock mode as part of the production UX.

The mock should be easy to disable/remove before final submission.

## Layer 3 --- Same-machine two-window testing

Even without a second physical monitor, test:

-   opening a new window
-   rendering workspace
-   closing the window
-   returning state
-   video playback
-   document rendering
-   scratchpad interactions

The two windows can temporarily coexist on the same physical screen.

## Layer 4 --- Actual external display

Before final submission, test once with any available:

-   monitor
-   television
-   projector
-   USB-C display
-   HDMI display

Use **Extend these displays**, not Duplicate.

------------------------------------------------------------------------

# 25. Acceptance Criteria

The feature is complete when all of the following are true.

## Core

-   [ ] Existing Case Interview Simulator works exactly as before when
    presentation mode is inactive.
-   [ ] Workspace contains existing scratchpad/document functionality.
-   [ ] A presentation control exists.
-   [ ] External displays can be detected where browser support exists.
-   [ ] Clicking the control opens a new presentation window.
-   [ ] Presentation window is positioned using actual external-display
    geometry.
-   [ ] Workspace is rendered in the external window.
-   [ ] Interview remains on the primary display.
-   [ ] Primary workspace area changes to a useful status state.
-   [ ] Workspace can be returned to the primary display.
-   [ ] Existing workspace state is not lost.

## Content

-   [ ] Scratchpad works when presented externally.
-   [ ] Document viewer works when presented externally.
-   [ ] Video/media works when presented externally.

## Safety

-   [ ] No backend changes are required.
-   [ ] No database changes are required.
-   [ ] No unrelated files/components are changed unnecessarily.
-   [ ] Unsupported browsers fail gracefully.
-   [ ] No external display fails gracefully.
-   [ ] Permission denial fails gracefully.
-   [ ] Existing simulator remains usable if presentation fails.

## Quality

-   [ ] UI matches existing InternPrep AI design.
-   [ ] No blank/broken panel after presentation.
-   [ ] No console errors introduced.
-   [ ] No obvious memory leaks from event listeners/window lifecycle.
-   [ ] No popup is opened without user interaction.
-   [ ] Code is understandable and appropriately scoped.

------------------------------------------------------------------------

# 26. Recommended Implementation Order

Do not try to implement everything at once.

## Step 1 --- Inspect

Before changing anything, identify:

1.  Case Interview Simulator route
2.  Parent layout component
3.  Interview panel component
4.  Workspace panel component
5.  Scratchpad component
6.  Document viewer component
7.  Video component if one exists
8.  Workspace state
9.  Styling conventions
10. Existing window/portal utilities

Do not modify code during this inspection step.

## Step 2 --- Build the smallest presentation proof

Implement:

``` text
Button
  ->
detect display
  ->
window.open()
  ->
simple presentation content
```

Verify that the browser window opens.

## Step 3 --- Move the actual workspace

Replace the simple test content with the existing WorkspacePanel.

## Step 4 --- Preserve primary UI

Add the "Workspace Presented" state.

## Step 5 --- Test each content type

Test:

1.  scratchpad
2.  document
3.  video

## Step 6 --- Add return behavior

Close external window and restore inline workspace.

## Step 7 --- Add graceful failures

Handle:

-   no external display
-   unsupported API
-   permission denial
-   manually closed presentation window

## Step 8 --- Polish

Only after functionality works:

-   spacing
-   status indicator
-   button labels
-   loading state
-   error messaging
-   presentation window styling

------------------------------------------------------------------------

# 27. Recommended Development Discipline

Because the existing platform is complex, follow these rules.

### Rule 1

**Do not refactor unrelated code.**

### Rule 2

**Do not rename existing components unless absolutely necessary.**

### Rule 3

**Do not replace existing libraries.**

### Rule 4

**Do not change the backend.**

### Rule 5

**Do not introduce a new state-management library.**

### Rule 6

**Reuse existing UI components.**

### Rule 7

**Make small changes and test after each change.**

### Rule 8

**If a proposed change affects unrelated functionality, stop and
reassess.**

### Rule 9

**Preserve existing responsive behavior.**

### Rule 10

**Prefer the smallest working implementation.**

------------------------------------------------------------------------

# 28. Important Technical Design Decision

Do not make the feature video-specific.

Bad architecture:

``` text
PresentVideoButton
       |
       +--> VideoWindow
```

Preferred architecture:

``` text
PresentWorkspaceButton
       |
       +--> PresentationController
                  |
                  +--> WorkspacePanel
                         |
                         +--> Scratchpad
                         +--> Document
                         +--> Video
```

This satisfies the assignment while making the feature genuinely useful
inside InternPrep AI.

------------------------------------------------------------------------

# 29. Suggested User Flow

### Initial

``` text
User enters Case Interview Simulator

             |
             v

Interview + Workspace
```

### User connects display

``` text
Browser detects secondary display

             |
             v

Workspace shows:
"External display available"
```

### User clicks

``` text
Present Workspace
```

### Browser

``` text
Multi-screen permission if required
```

### Success

``` text
Primary:
Interview + Workspace Presented status

External:
Full Workspace
```

### Return

``` text
User clicks:
Return Workspace

             |
             v

External window closes

             |
             v

Original split-screen layout restored
```

------------------------------------------------------------------------

# 30. Demonstration Scenario for the Interviewer

The safest demo should use a very simple, deterministic case.

### Scenario

Open the Case Interview Simulator with:

-   an interview/case prompt on the left
-   a scratchpad/document on the right

Then demonstrate:

### 1. Normal mode

Say:

> "This is the existing Case Interview Simulator. The candidate
> interacts with the interviewer on the left while the right side is
> used as a workspace."

### 2. Presentation mode

Click:

> "Present Workspace"

Say:

> "When an extended display is available, the workspace can be presented
> separately so the interview remains available on the primary display."

### 3. External window

Show the workspace on the second display.

### 4. Primary screen

Show:

> "The interview remains fully usable, and the right side now
> communicates that the workspace is being presented externally instead
> of leaving an empty panel."

### 5. Explain generalization

Say:

> "I intentionally implemented this at the workspace level rather than
> specifically for video, so the same presentation mechanism can handle
> the scratchpad, case document, or media."

This is the key engineering point to emphasize.

------------------------------------------------------------------------

# 31. If a Physical Display Is Not Available During the Demo

Do not fake successful external-display detection.

Instead, have a development/test mode available while building.

For the final interviewer demo, if no physical display is available,
demonstrate the two-window behavior and clearly explain:

> "The actual display selection is handled through the browser's Window
> Management API. Since I don't have a second physical display in this
> environment, I used a mock display path during development to validate
> the presentation lifecycle."

If a physical monitor is available, use it.

------------------------------------------------------------------------

# 32. Optional Enhancements --- Only If the MVP Is Stable

These are deliberately lower priority.

### Priority 1

Preserve current video timestamp when moving it.

### Priority 2

Synchronize play/pause.

### Priority 3

Detect manual closing of the external window.

### Priority 4

Handle display disconnection.

### Priority 5

Allow selecting among multiple external displays.

Do not implement these before the core feature is stable.

------------------------------------------------------------------------

# 33. Potential Risks

## Risk: Browser compatibility

The Window Management API is not universally available.

Mitigation:

-   feature detection
-   graceful fallback
-   document supported browser in README

## Risk: Popup blocking

Mitigation:

-   open the window directly from the button click

## Risk: State duplication

Mitigation:

-   preserve one source of truth
-   render the existing workspace rather than cloning its state

## Risk: Complex scratchpad behavior in a new window

Mitigation:

-   inspect existing implementation first
-   preserve existing component
-   ensure DOM/window references target the correct document where
    required

## Risk: Breaking existing simulator

Mitigation:

-   keep changes isolated
-   preserve inline mode as the default
-   test the existing simulator after every meaningful change

## Risk: Empty primary workspace

Mitigation:

-   replace with a polished presentation-status state

------------------------------------------------------------------------

# 34. What Success Looks Like

The final feature should feel like a natural extension of InternPrep AI.

A reviewer should be able to understand it immediately:

> "The candidate keeps the interview on their laptop while the case
> workspace is displayed separately."

They should NOT feel:

> "This is a separate demo that happens to open a video."

The implementation should communicate:

-   good product judgment
-   simple architecture
-   reusable thinking
-   careful handling of browser constraints
-   respect for an existing codebase
-   polished UX
-   appropriate engineering scope

------------------------------------------------------------------------

# 35. Final Scope Statement for the Coding LLM

Implement a minimal, production-quality external-display presentation
capability inside the existing InternPrep AI Case Interview Simulator.

The current left side of the simulator is the interview interface and
must remain on the primary display. The current right side is the
workspace containing the scratchpad/canvas and case document viewer.
Treat this workspace as a reusable presentation surface.

Add a small "Present Workspace" control. When clicked, use the browser
Window Management API to detect an available external display and open a
dedicated presentation window positioned using the external display's
actual coordinates and dimensions. Render the existing workspace in that
window.

Do not make the implementation video-specific. The same mechanism must
support the existing scratchpad, document viewer, and a video/media
workspace if present.

When presentation is active, the primary screen must remain fully
useful. Replace the original right-side workspace with a polished
"Workspace Presented" state and a "Return Workspace" action. The
interview UI, timer, phases, quick suggestions, and answer input must
continue to work normally.

When presentation mode is inactive, the existing UI and behavior must
remain unchanged.

Do not modify the backend, database, authentication, unrelated
workflows, or introduce new infrastructure. Reuse existing components,
state, styling, and libraries. Make the smallest set of changes
necessary.

Implement graceful handling for unsupported browsers, missing external
displays, permission denial, popup failure, and external-window closure.

Before coding, inspect the existing Case Interview Simulator
architecture and identify the actual workspace, scratchpad, document
viewer, video/media components, and state-management approach. Do not
assume their implementation.

Build and test incrementally. Prioritize a stable MVP over optional
enhancements.

------------------------------------------------------------------------

# 36. Final Checklist Before Submission

-   [ ] Existing simulator works normally.
-   [ ] Presentation button is visible and polished.
-   [ ] External display detection works in supported browser.
-   [ ] Presentation window opens correctly.
-   [ ] External window uses real display geometry.
-   [ ] Workspace appears externally.
-   [ ] Interview remains on primary display.
-   [ ] Primary workspace area shows a useful status.
-   [ ] Return Workspace works.
-   [ ] Scratchpad works.
-   [ ] Document works.
-   [ ] Video works if included in the workspace.
-   [ ] No backend/database changes.
-   [ ] No unrelated refactor.
-   [ ] No console errors.
-   [ ] README explains browser requirement and testing.
-   [ ] Final demo is deterministic and easy to understand.

------------------------------------------------------------------------

# 37. Positioning of the Feature

For the assignment submission, describe it simply as:

> **Multi-Screen Workspace for Case Interview Simulator**
>
> A browser-based presentation mode that separates the candidate's
> interview interface from the visual workspace. The interview remains
> on the primary display while the scratchpad, case document, or media
> workspace can be presented on an external display with a single
> action.

The feature is intentionally implemented at the workspace level rather
than being tied to a specific media type, allowing the same mechanism to
support multiple educational interaction patterns.
