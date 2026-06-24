export const ATTENDANCE_THRESHOLD = 0.8;
export const DEFAULT_CLASSES_PER_CREDIT = 8;

export interface AttendancePolicyInput {
  credits: number | null | undefined;
  scheduledSessions: number;
  expectedSessionsOverride?: number | null;
}

export interface AttendancePolicy {
  expectedClasses: number;
  requiredClasses: number;
  allowedAbsences: number;
}

export function attendancePolicy({
  credits,
  scheduledSessions,
  expectedSessionsOverride,
}: AttendancePolicyInput): AttendancePolicy {
  const expectedClasses =
    expectedSessionsOverride ??
    (credits ? Math.round(credits * DEFAULT_CLASSES_PER_CREDIT) : scheduledSessions);
  // IIMK practice rounds 80% to the nearest whole lecture:
  // 24 classes -> 19 required, 16 classes -> 13 required.
  const requiredClasses = Math.round(expectedClasses * ATTENDANCE_THRESHOLD);
  return {
    expectedClasses,
    requiredClasses,
    allowedAbsences: expectedClasses - requiredClasses,
  };
}
