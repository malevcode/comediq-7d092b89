# Comediq Storytime-style redesign v2 (design files)

Design source exported from the Claude design canvas "Comediq App Redesign".
Each `.dc.html` file is one artboard. They are reference designs, not app code.

## App screens
- `Main.dc.html`: clickable prototype (Home, Map, Mic Detail, Register sheet, My Mic tracker, Sets, Profile). Pass `scene` to jump to a state.
- `Flow.dc.html`: every screen side by side.
- `States.dc.html`: register and check-in states (loading, before check-in, in range, checked in).

## Add a listing flow
- `ListingFlow.dc.html`: clickable one-page listing flow (chooser, form, preview, success).
- `ListingMicPath.dc.html`, `ListingShowPath.dc.html`: each path start to finish.
- `ListingStates.dc.html`: empty, venue not found, errors, edit, published.
- `ListingComponents.dc.html`: StepHeader, TextInput, ChipGroup, VenueSearchField, ToggleCard, CheckboxCard, PreviewCard, PrimaryButton.
- `ListingDesktop.dc.html`: the same flow in a desktop panel for comediq.us.

`canvas.json` is the canvas layout. `documentation.md` explains how it all works and the brand tokens.
Images load from the hosted canvas (`/_blob/...`), so the logo will not show if you open these files locally.
