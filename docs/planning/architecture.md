# Architecture

## Preliminary architecture

```text
React client
    ↓
Secure Node.js backend
    ↓
CALL-E SDK or API
    ↓
Real outbound phone call
    ↓
Adaptive voice conversation
    ↓
Structured CALL-E result
    ↓
Backend validation and transformation
    ↓
React result dashboard
```

## Current foundation

The frontend is a Vite React and TypeScript application in `client/`, organized into pages, reusable components, services, styles, and types. The exact backend framework and CALL-E integration method are pending verification.

## Data and security boundaries

- CALL-E credentials remain on the server.
- The browser must not call CALL-E with a private API key.
- Phone numbers must never be committed to Git.
- Raw transcripts are not stored by default.
- Consent is collected before placing a call.
- Structured results are preferred over unnecessary long-term storage of recordings or transcripts.
