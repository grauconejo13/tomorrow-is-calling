import type { ReadinessReport } from "../types/report";
import type { ReadinessCheckForm, Shipment } from "../types/shipment";

export const demoShipment: Shipment = { reference: "SH-2048", cargo: "Temperature-sensitive diagnostic equipment", origin: "San Antonio Distribution Center", destination: "Houston Medical Receiving Hub", carrier: "Northline Express", cutoffDate: "2026-07-28", cutoffTime: "18:30", contact: "Maya Chen", phone: "(210) 555-0148", priority: "Critical", concerns: ["Carrier pickup is not confirmed", "Receiving contact has not acknowledged the delivery window", "No backup carrier is assigned"] };

export const demoForm: ReadinessCheckForm = { ...demoShipment, concerns: demoShipment.concerns.join("\n"), callTiming: "now", consent: false };

export const demoReport: ReadinessReport = { readiness: 72, preventionWindow: "2 hours 14 minutes", risks: [
  { title: "Carrier pickup has not been confirmed.", severity: "High", impact: "The shipment may miss the dispatch window if carrier confirmation is not received before escalation time." },
  { title: "Receiving contact has not acknowledged the delivery window.", severity: "Moderate" },
  { title: "Backup carrier has not been assigned.", severity: "Moderate" },
  { title: "Final shipping document review has no confirmed owner.", severity: "Moderate" },
], actions: [
  { action: "Confirm pickup with Northline Express by 4:45 PM.", owner: "Operations coordinator" },
  { action: "Assign and contact a backup carrier.", owner: "Dispatch" },
  { action: "Obtain receiving acknowledgment from the Houston hub.", owner: "Maya Chen" },
  { action: "Assign a final shipping-document reviewer.", owner: "Operations lead" },
] };
