// mobile/app/lib/deviceService.ts
// Mirrors web: src/services/deviceService.js + activityService.js + detectionService.js

import { get, post, patch, del, unwrapList } from "./api";

// ─── Devices ─────────────────────────────────────────────────────
export interface Device {
  id: number;
  name: string;
  location: string;
  is_active: boolean;
  status: "online" | "offline" | "active";
  owner_name?: string;
  created_at: string;
}

export const getDevices   = ()                          => get("/devices/").then(unwrapList<Device>);
export const getDevice    = (id: number)                => get<Device>(`/devices/${id}/`);
export const createDevice = (data: Partial<Device>)     => post<Device>("/devices/", data);
export const updateDevice = (id: number, fields: Partial<Device>) => patch<Device>(`/devices/${id}/`, fields);
export const deleteDevice = (id: number)                => del(`/devices/${id}/`);

// ─── Bird Detections ─────────────────────────────────────────────
export interface Detection {
  id: number;
  device: number;
  device_name?: string;
  bird_count: number;
  bird_species: string;
  confidence_score: number;
  detected_at: string;
}

export const getDetections   = ()                            => get("/detections/").then(unwrapList<Detection>);
export const createDetection = (data: Partial<Detection>)   => post<Detection>("/detections/", data);
export const deleteDetection = (id: number)                 => del(`/detections/${id}/`);

// ─── Activity Logs ────────────────────────────────────────────────
export interface ActivityLog {
  id: number;
  device: number;
  device_name?: string;
  event_type: "motion" | "bird" | "offline" | "online";
  description: string;
  action?: string;         // used in web for display
  created_at: string;
}

export const getActivities   = ()                           => get("/activities/").then(unwrapList<ActivityLog>);
export const createActivity  = (data: Partial<ActivityLog>) => post<ActivityLog>("/activities/", data);
export const deleteActivity  = (id: number)                 => del(`/activities/${id}/`);