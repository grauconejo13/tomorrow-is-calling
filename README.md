# Tomorrow Is Calling

An interactive, mobile-first sci-fi experience where an AI caller from the future helps people rehearse practical decisions.

## Hackathon

CALL-E — Your Code Is Calling. Deadline: September 14, 2026 at 10:45 AM CDT.

## Problem

Teams often discover risks, assumptions, and dependency gaps too late. A timed spoken rehearsal can surface these more effectively than a normal form or chatbot.

## Proposed solution

A temporal communications system connects the user with a future agent by phone. The agent adapts to spoken responses and returns a structured report.

## Practical use case

The leading use case is a project pre-mortem: a future agent calls from a fictional failed launch to expose current risks.

## Current leading scenario

Project pre-mortem call. This is a leading option, not a final scenario selection.

## How CALL-E will be used

A planned secure backend will use CALL-E at runtime to initiate a real outbound call, conduct the adaptive conversation, and return structured results. CALL-E is not integrated yet.

## Planned user experience

The user reviews a scenario, gives consent, enters a phone number, receives one adaptive call, and then reviews a readiness or risk report.

## Current project status

React and TypeScript foundation in progress. The CALL-E integration, backend, phone form, final interface, and deployment have not been built yet.

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
