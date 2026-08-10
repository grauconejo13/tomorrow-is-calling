import type { CallOutcome, CallTask, TransportOperation, TransportRequest } from "../types/transport";
import type { ResolutionReport } from "../types/report";

export const demoRequest: TransportRequest = {
  reference: "AT-4821",
  customer: { fullName: "Maya Chen", phone: "(213) 555-0148", email: "maya.chen@example.test" },
  vehicle: { year: "2022", make: "Toyota", model: "Camry" },
  pickup: { address: "1180 S Hope St, Los Angeles, CA", preferredWindow: "Tuesday 2–5 PM", presence: "alternate", alternateContact: { fullName: "Ana Chen", phone: "(213) 555-0182", relationship: "Sister", authorized: false } },
  delivery: { address: "221 W Commerce St, San Antonio, TX", preferredWindow: "Thursday 10 AM–2 PM", presence: "customer", usePickupAlternate: false },
  status: "follow_up_required",
  specialInstructions: "Customer requests a text before driver arrival.",
  consentToContact: true,
  serviceAuthorizationComplete: false,
};

export const demoForm = demoRequest;
export const demoCallTask: CallTask = { id: "call-4821-follow-up", type: "customer-follow-up", requestReference: "AT-4821", recipient: demoRequest.customer, recipientRole: "customer", reason: "Authorization form incomplete", goal: "Confirm the customer received the secure form and determine whether they can complete it.", topics: ["Form received", "Customer questions", "Completion timing", "Alternate pickup contact", "Human assistance requested"] };

export const demoOperations: TransportOperation[] = [
  { id: "AT-4821", reference: "AT-4821", customer: "Maya Chen", vehicle: "2022 Toyota Camry", route: "Los Angeles, CA → San Antonio, TX", status: "follow_up_required", nextAction: "Customer follow-up call", isInteractive: true, isSample: false },
  { id: "AT-5179", reference: "AT-5179", customer: "Darius Hill", vehicle: "2021 Ford Bronco", route: "Phoenix, AZ → Denver, CO", status: "searching_driver", nextAction: "Driver availability", isInteractive: false, isSample: true },
  { id: "AT-3904", reference: "AT-3904", customer: "Sofia Ramirez", vehicle: "2023 Subaru Outback", route: "Austin, TX → Nashville, TN", status: "pickup_approaching", nextAction: "Pickup confirmation", isInteractive: false, isSample: true },
  { id: "AT-2918", reference: "AT-2918", customer: "Elliot Brooks", vehicle: "2019 BMW X3", route: "Tampa, FL → Raleigh, NC", status: "completed", nextAction: "Delivery recorded", isInteractive: false, isSample: true },
];

export const demoOutcome: CallOutcome = { callType: "customer-follow-up", reached: true, confirmedInformation: ["Customer reached: Yes", "Secure form received: Yes", "Expected completion: Before 4 PM", "Alternate pickup contact mentioned: Yes"], unresolvedItems: ["Alternate contact verified: No", "Pickup release authorization is pending"], nextAction: "Send the customer to the secure form and review authorization after completion.", humanEscalation: true, notes: "Customer says sister Ana may handle pickup and requests assistance if authorization cannot be completed." };

export const demoReport: ResolutionReport = { outcome: { confirmed: demoOutcome.confirmedInformation.map((value) => ({ label: value.split(":")[0], value: value.split(":").slice(1).join(":").trim(), tone: "confirmed" })), unresolved: demoOutcome.unresolvedItems.map((value) => ({ label: value.split(":")[0], value: value.split(":").slice(1).join(":").trim(), tone: "unresolved" })), nextAction: demoOutcome.nextAction, humanEscalation: demoOutcome.humanEscalation, notes: demoOutcome.notes } };
