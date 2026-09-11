# Tomorrow Is Calling

An interactive, mobile-first sci-fi experience where an AI caller from the future helps people rehearse practical decisions.

## Hackathon

CALL-E — Your Code Is Calling. Deadline: September 14, 2026 at 10:45 AM CDT.

## Problem

Teams often discover risks, assumptions, and dependency gaps too late. A timed spoken rehearsal can surface these more effectively than a normal form or chatbot.

## Proposed solution

A temporal communications system connects the user with a future agent by phone. The agent adapts to spoken responses and returns a structured report.

## Practical use case

The selected MVP is a time-critical shipment readiness check. It helps an operations coordinator identify exceptions before a pickup cutoff, delivery, or handoff is missed.

## Current leading scenario

Time-critical shipment readiness check. The interface currently uses fictional mock data; future versions may support deliveries, launches, and other operational handoffs.

## How CALL-E will be used

A planned secure backend will use CALL-E at runtime to verify readiness, identify exceptions, and return structured prevention actions. CALL-E is not integrated yet.

## Planned user experience

The user reviews a scenario, gives consent, enters a phone number, receives one adaptive call, and then reviews a readiness or risk report.

## Current project status

The frontend-only mock flow includes a multi-operation overview queue. SH-2048 is the only interactive prototype workflow; other rows illustrate scheduled, queued, and completed states. CALL-E integration, backend, real calls, live tracking, prediction, carrier integrations, and deployment have not been built yet.

The SH-2048 prototype includes a call-monitoring lifecycle that represents application state only. It does not carry live phone audio, show a transcript or recording, or place a real call.

This application is not a shipment-tracking platform and does not claim to predict the future.

Future versions may support multiple active CALL-E readiness checks; this prototype does not.

## Technology stack

- React
- TypeScript
- Vite
- CALL-E (planned)

## Preliminary architecture

React client → secure Node.js backend → CALL-E SDK or API → real outbound phone call → adaptive voice conversation → structured CALL-E result → backend validation → React result dashboard.

## Project structure

```text
client/             Vite React application
docs/               Hackathon, planning, and development documentation
tasks/              Backlog and sprint tracking
```

## Local development instructions

```bash
cd client
npm install
npm run dev
```

Use `npm run lint` and `npm run build` from `client` to validate the app.

## Environment variables

Copy the placeholder values from `.env.example` when a backend or CALL-E integration is introduced. Do not commit real credentials.

## Privacy and phone-number safety

Phone numbers will only be collected after clear consent, handled securely, and never committed to source control or logs. The final implementation will minimize retention; raw transcripts and recordings are not stored by default.

## Hackathon submission requirements

The final project must use CALL-E at runtime, be functional and deployed, include a public contribution pull request to Awesome Phone Call Agents, and provide a public demonstration video. See [submission details](docs/hackathon/submission.md).

## Development roadmap

See [the planning roadmap](docs/planning/roadmap.md).

## License

License to be determined.
