

## Send to WhatsApp -- Full-Screen Loading Overlay

When the "Send to WhatsApp" button is clicked, a full-screen overlay with a spinner and "Sending..." text will appear, preventing any other interaction until the operation completes.

### What will change

**File: `src/components/CustomerDetail.tsx`**

- Add a full-screen fixed overlay (`position: fixed; inset: 0; z-index: 50`) that renders when `sending` is `true`.
- The overlay will have a semi-transparent dark background with a centered spinner (Loader2) and "Sending to WhatsApp..." text.
- This blocks all clicks and interactions on the page beneath it.
- No other files need to change; the `sending` state already exists in this component.

### Technical details

- Overlay uses Tailwind classes: `fixed inset-0 z-50 bg-black/50 flex items-center justify-center`
- Inner card with white background, rounded corners, spinner icon, and descriptive text.
- Conditionally rendered: `{sending && <div>...</div>}`

