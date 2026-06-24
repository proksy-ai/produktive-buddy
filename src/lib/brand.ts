/**
 * Central brand config. Change these to rebrand or white-label per college.
 */
export const BRAND = {
  name: "Produktive Buddy",
  shortName: "Produktive Buddy",
  description:
    "Your personalized campus schedule - classes, changes, attendance, and notices in one calm, fast place.",
  // First college this instance serves. The data model supports many.
  college: "IIM Kozhikode",
  themeColor: "#6366f1",
  backgroundColor: "#ffffff",
} as const;

export type Brand = typeof BRAND;
