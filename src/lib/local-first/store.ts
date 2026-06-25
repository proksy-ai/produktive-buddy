"use client";

import type { AttendanceMark } from "@/lib/attendance";

const DB_NAME = "produktive-buddy-local-first";
const DB_VERSION = 1;
const ATTENDANCE_STORE = "attendance_drafts";
const NOTE_STORE = "note_drafts";
const COURSE_COLOR_STORE = "course_color_prefs";

export type AttendanceDraftStatus = AttendanceMark | "CLEAR";

export interface AttendanceDraft {
  sessionId: string;
  status: AttendanceDraftStatus;
  pending: boolean;
  updatedAt: number;
}

export interface NoteDraft {
  sessionId: string;
  body: string;
  pending: boolean;
  updatedAt: number;
}

export interface CourseColorDraft {
  courseId: string;
  colorKey: string;
  updatedAt: number;
}

let openDbPromise: Promise<IDBDatabase> | null = null;

function canUseIndexedDb() {
  return typeof window !== "undefined" && typeof window.indexedDB !== "undefined";
}

function requestToPromise<T>(request: IDBRequest<T>) {
  return new Promise<T>((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function transactionToPromise(transaction: IDBTransaction) {
  return new Promise<void>((resolve, reject) => {
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
    transaction.onabort = () => reject(transaction.error);
  });
}

async function openDb() {
  if (!canUseIndexedDb()) {
    throw new Error("IndexedDB unavailable.");
  }
  if (openDbPromise) return openDbPromise;

  openDbPromise = new Promise<IDBDatabase>((resolve, reject) => {
    const request = window.indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(ATTENDANCE_STORE)) {
        db.createObjectStore(ATTENDANCE_STORE, { keyPath: "sessionId" });
      }
      if (!db.objectStoreNames.contains(NOTE_STORE)) {
        db.createObjectStore(NOTE_STORE, { keyPath: "sessionId" });
      }
      if (!db.objectStoreNames.contains(COURSE_COLOR_STORE)) {
        db.createObjectStore(COURSE_COLOR_STORE, { keyPath: "courseId" });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });

  return openDbPromise;
}

async function put<T>(storeName: string, value: T) {
  const db = await openDb();
  const tx = db.transaction(storeName, "readwrite");
  tx.objectStore(storeName).put(value);
  await transactionToPromise(tx);
}

async function remove(storeName: string, key: IDBValidKey) {
  const db = await openDb();
  const tx = db.transaction(storeName, "readwrite");
  tx.objectStore(storeName).delete(key);
  await transactionToPromise(tx);
}

async function get<T>(storeName: string, key: IDBValidKey): Promise<T | null> {
  const db = await openDb();
  const tx = db.transaction(storeName, "readonly");
  const value = await requestToPromise(tx.objectStore(storeName).get(key));
  await transactionToPromise(tx);
  return (value as T | undefined) ?? null;
}

async function getAll<T>(storeName: string): Promise<T[]> {
  const db = await openDb();
  const tx = db.transaction(storeName, "readonly");
  const values = await requestToPromise(tx.objectStore(storeName).getAll());
  await transactionToPromise(tx);
  return values as T[];
}

export async function saveAttendanceDraft(
  sessionId: string,
  status: AttendanceDraftStatus,
) {
  await put<AttendanceDraft>(ATTENDANCE_STORE, {
    sessionId,
    status,
    pending: true,
    updatedAt: Date.now(),
  });
}

export async function attendanceMarksFromLocal() {
  const all = await getAll<AttendanceDraft>(ATTENDANCE_STORE);
  const marks: Record<string, AttendanceMark> = {};
  for (const row of all) {
    if (row.status === "PRESENT" || row.status === "ABSENT") {
      marks[row.sessionId] = row.status;
    }
  }
  return marks;
}

export async function pendingAttendanceDrafts() {
  const all = await getAll<AttendanceDraft>(ATTENDANCE_STORE);
  return all.filter((row) => row.pending);
}

export async function attendanceDraftForSession(sessionId: string) {
  return get<AttendanceDraft>(ATTENDANCE_STORE, sessionId);
}

export async function markAttendanceDraftSynced(
  sessionId: string,
  status: AttendanceDraftStatus,
) {
  if (status === "CLEAR") {
    await remove(ATTENDANCE_STORE, sessionId);
    return;
  }

  await put<AttendanceDraft>(ATTENDANCE_STORE, {
    sessionId,
    status,
    pending: false,
    updatedAt: Date.now(),
  });
}

export async function saveNoteDraft(sessionId: string, body: string) {
  await put<NoteDraft>(NOTE_STORE, {
    sessionId,
    body,
    pending: true,
    updatedAt: Date.now(),
  });
}

export async function noteDraftForSession(sessionId: string) {
  return get<NoteDraft>(NOTE_STORE, sessionId);
}

export async function pendingNoteDrafts() {
  const all = await getAll<NoteDraft>(NOTE_STORE);
  return all.filter((row) => row.pending);
}

export async function markNoteDraftSynced(sessionId: string, body: string) {
  if (!body.trim()) {
    await remove(NOTE_STORE, sessionId);
    return;
  }
  await put<NoteDraft>(NOTE_STORE, {
    sessionId,
    body,
    pending: false,
    updatedAt: Date.now(),
  });
}

export async function saveCourseColorDraft(courseId: string, colorKey: string) {
  await put<CourseColorDraft>(COURSE_COLOR_STORE, {
    courseId,
    colorKey,
    updatedAt: Date.now(),
  });
}

export async function readCourseColorDrafts() {
  const all = await getAll<CourseColorDraft>(COURSE_COLOR_STORE);
  return Object.fromEntries(all.map((row) => [row.courseId, row.colorKey]));
}
