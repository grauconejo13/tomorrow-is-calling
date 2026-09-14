# Tomorrow Is Calling

**Tomorrow Is Calling** is a CALL-E–powered vehicle transport workflow that turns a customer’s first shipping request into a structured quote, decision, payment handoff, and booking flow.

The project explores how an AI phone agent can reduce repetitive coordination work while keeping important business boundaries explicit: CALL-E can collect information, explain pricing, record a customer decision, and trigger approved next steps, but it does not collect payment credentials or invent pricing.

## Hackathon

Built for **CALL-E — Your Code Is Calling**.

**Submission deadline:** September 14, 2026 at 10:45 AM CDT.

## The problem

Vehicle transport requests often involve repeated phone calls, incomplete information, quote follow-ups, payment coordination, and handoffs between customers and staff.

A customer may provide only part of what is needed to price and book a shipment. Staff then have to confirm pickup and delivery locations, vehicle details, operability, service type, preferred dates, pricing, payment terms, and the customer’s final decision.

The result is a workflow that is easy to delay and difficult to scale consistently.

## The solution

Tomorrow Is Calling uses **CALL-E as the conversational layer** for the customer-facing workflow.

CALL-E can:

- collect and confirm transport details;
- identify missing or invalid information;
- present an estimated or confirmed transport quote;
- explain the initial payment and remaining balance;
- record whether the customer accepts, declines, wants time, requests the quote by email, or raises a price objection;
- send the customer to a secure payment handoff after explicit acceptance; and
- return structured results to the staff console.

The application keeps business logic and sensitive operations outside the voice conversation.

## Customer flow

```text
Customer requests transport
        ↓
CALL-E collects details
        ↓
Request validated?
   ↙          ↘
 No            Yes
 ↓              ↓
Request       Quote engine
correction       ↓
   └──────→ Estimated quote
                  ↓
          Rate / carrier confirmation
                  ↓
            Confirmed quote
                  ↓
          CALL-E presents quote
                  ↓
           Customer decision
      ↙       ↓       ↓        ↘
  Decline   Think    Email    Price issue
                                 ↓
                            Human review

                 Accept
                   ↓
          Secure payment link
                   ↓
           Initial payment
                   ↓
                Booked
                   ↓
        Carrier assignment
                   ↓
                Pickup
                   ↓
              In transit
                   ↓
               Delivery
                   ↓
          Remaining payment
                   ↓
                Closed
```

## Demo scenario

The current prototype uses a sample transport quote:

- **Estimated range:** $1,050–$1,250
- **Confirmed transport price:** $1,180
- **Initial payment:** $590
- **Remaining balance:** $590 at delivery
- **Supported demo payment methods:** credit card, debit card, and ACH

The 50/50 payment split is a **demo-selected payment term**, not a claim that all vehicle transport companies use the same structure.

## Customer decision states

The quote workflow supports five customer outcomes:

| Customer response | System state | Next action |
| --- | --- | --- |
| Accept | `QUOTE_ACCEPTED` | Send secure payment link |
| Decline | `QUOTE_DECLINED` | Close or follow up later |
| Think about it | `QUOTE_PENDING_CUSTOMER` | Send/retain quote for review |
| Email the quote | `QUOTE_SENT` | Wait for customer response |
| Price is too high | `PRICE_OBJECTION` | Escalate for human review |

Only an **explicit quote acceptance** can continue to the payment step.

## Payment and safety boundary

CALL-E is intentionally separated from payment credential collection.

**CALL-E may:**

- present an approved price;
- explain payment terms;
- record quote acceptance;
- send or trigger a secure hosted payment link; and
- report the resulting workflow state.

**CALL-E does not:**

- ask the customer to speak a card number;
- store card or bank credentials;
- charge the customer directly during the call;
- invent discounts or negotiate below an approved price floor; or
- silently alter a confirmed transport price.

Payment credentials belong on a secure provider-hosted checkout page.

## Application workflow

The staff-facing prototype includes:

- transport request intake;
- customer and shipment details;
- quote summary;
- CALL-E call brief;
- customer decision states;
- secure-payment handoff state;
- structured call outcome/reporting; and
- operational next actions.

The interface is designed to make each state visible rather than hiding important transitions inside the conversation.

## Architecture

```text
Customer
   ↓
React + TypeScript client
   ↓
Transport / quote workflow
   ↓
Secure backend
   ├── CALL-E voice agent
   ├── Quote / business rules
   ├── CRM or job state
   └── Secure payment provider
             ↓
      Payment confirmation
             ↓
      Booking / dispatch state
```

A production version could connect services such as a payment processor, messaging provider, CRM, and carrier/dispatch systems. Those integrations should remain isolated behind the backend rather than exposing credentials or privileged operations to the browser or voice agent.

## Technology stack

- **React**
- **TypeScript**
- **Vite**
- **CALL-E** for the phone-agent workflow
- Backend/service integrations as the prototype evolves

## Project structure

```text
client/             Vite React application
docs/               Hackathon, planning, and development documentation
tasks/              Backlog and sprint tracking
```

## Local development

```bash
cd client
npm install
npm run dev
```

Validation commands:

```bash
npm run lint
npm run build
```

## Environment variables

Use `.env.example` as the reference for local configuration.

Never commit real API keys, payment credentials, phone numbers, or other secrets to source control.

## Privacy

The project follows a minimum-data approach for phone and customer information. Sensitive payment credentials are not part of the CALL-E conversation and should not be stored in application logs.

For a production deployment, phone-number retention, call recordings, transcripts, and customer data should be governed by explicit consent and a documented retention policy.

## Current status

The repository contains the working transport workflow UI and the quote/payment state model used for the hackathon demo. CALL-E integration work is being developed alongside the customer and staff-console flow.

The prototype is designed to demonstrate the system interaction and decision logic. External carrier, CRM, payment, and production dispatch integrations may be represented with demo/test behavior unless explicitly connected.

## Why this matters

The goal is not to replace every human interaction in logistics. It is to give routine coordination work a reliable first layer while preserving human review where judgment or authorization matters.

**CALL-E handles the conversation. The application owns the rules. Humans remain available for exceptions.**

## Documentation

Additional planning and hackathon notes are available in [`docs/`](docs/).

## License

License to be determined.
