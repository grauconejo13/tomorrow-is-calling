import type { CallOutcome, CallTask, TransportOperation, TransportRequest } from "../types/transport";
import type { ResolutionReport } from "../types/report";

export const demoRequest: TransportRequest = {
  reference: "AT-0000",
  customer: {
    fullName: "Amelia Grey",
    phone: "",
    email: "amelia.grey@example.test",
  },
  vehicle: {
    year: "2011",
    make: "Volvo",
    model: "S40",
  },
  pickup: {
    address: "1180 S Hope St, Los Angeles, CA",
    preferredWindow: "Tuesday 2–5 PM",
    presence: "alternate",
    alternateContact: {
      fullName: "Nora Grey",
      phone: "(213) 555-0182",
      relationship: "Sister",
      authorized: false,
    },
  },
  delivery: {
    address: "221 W Commerce St, San Antonio, TX",
    preferredWindow: "Thursday 10 AM–2 PM",
    presence: "customer",
    usePickupAlternate: false,
  },
  status: "follow_up_required",
  specialInstructions: "Customer requests a call before driver arrival.",
  consentToContact: true,
  serviceAuthorizationComplete: false,
  quote: {
    estimateLow: 1050,
    estimateHigh: 1250,
    confirmedTotal: 1180,
    decision: "pending",
    depositPercent: 50,
    initialPayment: 590,
    remainingBalance: 590,
    paymentStatus: "not_requested",
    supportedPaymentMethods: ["credit_card", "debit_card", "ach"],
    securePaymentLinkSent: false,
  },
};

export const demoForm = demoRequest;

export const demoCallTask: CallTask = {
  id: "call-quote-decision",
  type: "customer-follow-up",
  requestReference: "",
  recipient: demoRequest.customer,
  recipientRole: "customer",
  reason: "Present the confirmed transport quote and capture the customer's decision",
  goal:
    "Verify the customer, present the confirmed transport price and selected payment terms, then record whether the customer accepts, declines, wants time, wants the quote emailed, or has a price objection. Only explicit acceptance can continue to a secure payment link.",
  topics: [
    "Identity confirmation",
    "Confirmed transport price",
    "Earlier estimate range",
    "Initial payment and remaining balance",
    "Customer quote decision",
    "Price objection or request for review",
    "Secure payment link after explicit acceptance",
  ],
};

export const demoOperations: TransportOperation[] = [
  {
    id: "AT-5179",
    reference: "AT-5179",
    customer: "Darius Hill",
    vehicle: "2021 Ford Bronco",
    route: "Phoenix, AZ → Denver, CO",
    status: "searching_driver",
    nextAction: "Driver availability",
    isInteractive: false,
    isSample: true,
  },
  {
    id: "AT-3904",
    reference: "AT-3904",
    customer: "Sofia Ramirez",
    vehicle: "2023 Subaru Outback",
    route: "Austin, TX → Nashville, TN",
    status: "pickup_approaching",
    nextAction: "Pickup confirmation",
    isInteractive: false,
    isSample: true,
  },
  {
    id: "AT-2918",
    reference: "AT-2918",
    customer: "Elliot Brooks",
    vehicle: "2019 BMW X3",
    route: "Tampa, FL → Raleigh, NC",
    status: "completed",
    nextAction: "Delivery recorded",
    isInteractive: false,
    isSample: true,
  },
];

export const demoOutcome: CallOutcome = {
  callType: "customer-follow-up",
  reached: true,
  confirmedInformation: [
    "Customer reached: Yes",
    "Identity confirmed: Yes",
    "Confirmed transport price: $1,180",
    "Initial payment: $590",
    "Remaining balance at delivery: $590",
    "Quote decision: Accepted",
  ],
  unresolvedItems: [
    "Initial payment: Awaiting secure checkout",
    "Alternate pickup contact authorization: Pending",
  ],
  nextAction:
    "Send the secure payment link by email or text. Do not collect card or bank credentials during the CALL-E conversation. After payment confirmation, issue a receipt and mark the request booked.",
  humanEscalation: false,
  notes:
    "If the customer objects to price, CALL-E records the objection and routes it for human review rather than inventing a discount or changing the confirmed price.",
};

export const demoReport: ResolutionReport = {
  outcome: {
    confirmed: demoOutcome.confirmedInformation.map((value) => ({
      label: value.split(":")[0],
      value: value.split(":").slice(1).join(":").trim(),
      tone: "confirmed",
    })),
    unresolved: demoOutcome.unresolvedItems.map((value) => ({
      label: value.split(":")[0],
      value: value.split(":").slice(1).join(":").trim(),
      tone: "unresolved",
    })),
    nextAction: demoOutcome.nextAction,
    humanEscalation: demoOutcome.humanEscalation,
    notes: demoOutcome.notes,
  },
};
