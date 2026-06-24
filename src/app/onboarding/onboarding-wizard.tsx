"use client";

import {
  ArrowLeft,
  ArrowRight,
  Bell,
  Check,
  Loader2,
  Lock,
  Upload,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

import { LockedTermSheet } from "@/components/onboarding/locked-term-sheet";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type {
  OnboardingContextData,
  OnboardingTerm,
} from "@/lib/onboarding";
import { BRAND } from "@/lib/brand";
import { cn } from "@/lib/utils";
import { voice } from "@/lib/voice";

interface CourseMatch {
  courseId: string;
  courseName: string;
  sections: string[];
  needsSectionPick: boolean;
}

interface CatalogCourse {
  id: string;
  name: string;
  sections: string[];
}

type Step =
  | "profile"
  | "confirm"
  | "waiting"
  | "term"
  | "section"
  | "courses"
  | "sections";

function stepsForFlow(
  rollout: OnboardingContextData["rollout"],
  term: OnboardingTerm | undefined,
): Step[] {
  if (rollout === "coming_soon") return ["profile", "confirm", "waiting"];
  const base: Step[] = ["profile", "confirm", "term"];
  if (!term) return base;
  if (term.isElective) return [...base, "courses"];
  if (term.needsSection) return [...base, "section"];
  return base;
}

export function OnboardingWizard({
  initial,
}: {
  initial: OnboardingContextData;
}) {
  const router = useRouter();
  const { program, rollout } = initial;

  const [terms, setTerms] = useState(initial.terms);
  const [step, setStep] = useState<Step>("profile");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lockedTerm, setLockedTerm] = useState<OnboardingTerm | null>(null);

  const [name, setName] = useState(initial.user.name);
  const [rollNumber, setRollNumber] = useState(initial.user.rollNumber);
  const liveDefault =
    initial.terms.find((t) => t.availability === "live")?.id ??
    initial.defaultTermId ??
    "";
  const [termId, setTermId] = useState(liveDefault);
  const [cohortSectionId, setCohortSectionId] = useState("");

  const [pdfParsing, setPdfParsing] = useState(false);
  const [matched, setMatched] = useState<CourseMatch[]>([]);
  const [catalog, setCatalog] = useState<CatalogCourse[]>([]);
  const [selectedCourseIds, setSelectedCourseIds] = useState<Set<string>>(
    new Set(),
  );
  const [sectionByCourse, setSectionByCourse] = useState<
    Record<string, string>
  >({});
  const [useManualPick, setUseManualPick] = useState(false);
  const [batchNotifyRequested, setBatchNotifyRequested] = useState(
    initial.waitlistNotifyRequested,
  );

  const selectedTerm = terms.find((t) => t.id === termId);
  const flowSteps = useMemo(
    () => stepsForFlow(rollout, selectedTerm),
    [rollout, selectedTerm],
  );
  const stepIndex = flowSteps.indexOf(step);

  const displayName = name.trim().split(/\s+/)[0] || "";

  function headline(): string {
    switch (step) {
      case "profile":
        return `Welcome to ${BRAND.name}`;
      case "confirm":
        return displayName ? `Hey, ${displayName} 👋` : "One quick check";
      case "waiting":
        return displayName ? `${displayName}, hang tight` : "Almost showtime";
      case "term":
        return displayName ? `Hi, ${displayName}` : "Pick your term";
      case "section":
        return displayName ? `${displayName}, last one` : "Your section";
      case "courses":
        return displayName ? `Almost there, ${displayName}` : "Your courses";
      case "sections":
        return "Section picks";
      default:
        return BRAND.name;
    }
  }

  function handleNotifyChange(id: string, requested: boolean) {
    setTerms((prev) =>
      prev.map((t) =>
        t.id === id ? { ...t, notifyRequested: requested } : t,
      ),
    );
  }

  async function loadCatalog(id: string) {
    const res = await fetch(`/api/onboarding/courses?termId=${id}`);
    if (!res.ok) return;
    const data = await res.json();
    setCatalog(
      (data.courses ?? []).map(
        (c: { id: string; name: string; sections: string[] }) => ({
          id: c.id,
          name: c.name,
          sections: c.sections,
        }),
      ),
    );
  }

  async function handlePdfUpload(file: File) {
    setPdfParsing(true);
    setError(null);
    setUseManualPick(false);
    try {
      const form = new FormData();
      form.append("file", file);
      form.append("termId", termId);
      const res = await fetch("/api/onboarding/parse-pdf", {
        method: "POST",
        body: form,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Could not read PDF");
      setMatched(
        (data.matched ?? []).map(
          (m: {
            courseId: string;
            courseName: string;
            sections: string[];
            needsSectionPick: boolean;
          }) => ({
            courseId: m.courseId,
            courseName: m.courseName,
            sections: m.sections,
            needsSectionPick: m.needsSectionPick,
          }),
        ),
      );
      const auto: Record<string, string> = {};
      for (const m of data.matched ?? []) {
        if (m.sections?.length === 1) auto[m.courseId] = m.sections[0];
      }
      setSectionByCourse(auto);
    } catch (err) {
      setError(err instanceof Error ? err.message : voice.errors.generic);
    } finally {
      setPdfParsing(false);
    }
  }

  function buildEnrollments() {
    if (!useManualPick && matched.length > 0) {
      return matched.map((m) => ({
        courseId: m.courseId,
        courseSectionCode: sectionByCourse[m.courseId],
      }));
    }
    return [...selectedCourseIds].map((id) => ({
      courseId: id,
      courseSectionCode:
        sectionByCourse[id] ??
        (catalog.find((c) => c.id === id)?.sections.length === 1
          ? catalog.find((c) => c.id === id)!.sections[0]
          : undefined),
    }));
  }

  function needsSectionStep(): boolean {
    return buildEnrollments().some((e) => {
      const course =
        matched.find((m) => m.courseId === e.courseId) ??
        catalog.find((c) => c.id === e.courseId);
      return (
        (course?.sections.length ?? 0) > 1 && !sectionByCourse[e.courseId]
      );
    });
  }

  const multiSectionCourses = buildEnrollments()
    .map((e) => {
      const course =
        matched.find((m) => m.courseId === e.courseId) ??
        catalog.find((c) => c.id === e.courseId);
      if (!course || course.sections.length <= 1) return null;
      return {
        courseId: e.courseId,
        label: "courseName" in course ? course.courseName : course.name,
        sections: course.sections,
      };
    })
    .filter(Boolean) as {
    courseId: string;
    label: string;
    sections: string[];
  }[];

  async function finish() {
    setSubmitting(true);
    setError(null);
    try {
      const body: Record<string, unknown> = {
        name: name.trim(),
        rollNumber: rollNumber.trim() || undefined,
        termId,
      };
      if (selectedTerm?.isElective) {
        body.enrollments = buildEnrollments();
      } else if (selectedTerm?.needsSection) {
        body.cohortSectionId = cohortSectionId;
      }
      const res = await fetch("/api/onboarding/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? voice.errors.saveFailed);
      router.replace("/today");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : voice.errors.saveFailed);
    } finally {
      setSubmitting(false);
    }
  }

  async function requestBatchNotify() {
    const id = initial.waitlistTermId;
    if (!id) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/onboarding/notify-term", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ termId: id }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? voice.termLocked.notifyError);
      }
      setBatchNotifyRequested(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : voice.termLocked.notifyError);
    } finally {
      setSubmitting(false);
    }
  }

  function goNext() {
    setError(null);
    if (step === "profile") {
      if (name.trim().length < 2) {
        setError(voice.onboarding.nameTooShort);
        return;
      }
      setStep("confirm");
      return;
    }
    if (step === "confirm") {
      if (rollout === "coming_soon") {
        setStep("waiting");
      } else {
        setStep("term");
      }
      return;
    }
    if (step === "waiting") return;
    if (step === "term") {
      if (!selectedTerm) {
        setError(voice.onboarding.pickTerm);
        return;
      }
      if (selectedTerm.availability !== "live") {
        setError(voice.onboarding.pickLiveTerm);
        return;
      }
      if (selectedTerm.isElective) {
        void loadCatalog(termId);
        setStep("courses");
      } else if (selectedTerm.needsSection) {
        setStep("section");
      } else {
        void finish();
      }
      return;
    }
    if (step === "section") {
      if (!cohortSectionId) {
        setError(voice.onboarding.pickSection);
        return;
      }
      void finish();
      return;
    }
    if (step === "courses") {
      const count = useManualPick ? selectedCourseIds.size : matched.length;
      if (count === 0) {
        setError(voice.onboarding.addCourses);
        return;
      }
      if (needsSectionStep()) {
        setStep("sections");
        return;
      }
      void finish();
      return;
    }
    if (step === "sections") {
      if (needsSectionStep()) {
        setError(voice.onboarding.pickCourseSections);
        return;
      }
      void finish();
    }
  }

  function goBack() {
    setError(null);
    if (step === "sections") setStep("courses");
    else if (step === "courses") setStep("term");
    else if (step === "section") setStep("term");
    else if (step === "term") setStep("confirm");
    else if (step === "waiting") setStep("confirm");
    else if (step === "confirm") setStep("profile");
  }

  const isLastStep =
    step === "section" ||
    step === "sections" ||
    (step === "term" &&
      selectedTerm &&
      selectedTerm.availability === "live" &&
      !selectedTerm.isElective &&
      !selectedTerm.needsSection) ||
    (step === "courses" &&
      !needsSectionStep() &&
      (matched.length > 0 || selectedCourseIds.size > 0));

  const yearHint =
    program.batchLabel === "PGP29"
      ? voice.onboarding.termYear2Hint
      : voice.onboarding.termYear1Hint;

  return (
    <>
      <div className="mx-auto flex min-h-dvh max-w-md flex-col justify-center px-4 py-10">
        <header className="mb-8 text-center">
          <p className="text-xs font-medium tracking-wide text-primary uppercase">
            {program.name} · {program.session}
          </p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight">
            {headline()}
          </h1>
        </header>

        {flowSteps.length > 2 && step !== "waiting" && (
          <div className="mb-6 flex gap-1">
            {flowSteps.map((s, i) => (
              <div
                key={s}
                className={cn(
                  "h-0.5 flex-1 rounded-full transition-colors",
                  i <= stepIndex ? "bg-primary" : "bg-muted",
                )}
              />
            ))}
          </div>
        )}

        <Card>
          <CardContent className="space-y-5 p-6">
            {step === "profile" && (
              <>
                <p className="text-sm text-muted-foreground">
                  {voice.onboarding.nameAsk}
                </p>
                <p className="text-xs text-muted-foreground">
                  {voice.onboarding.nameHint}
                </p>
                <label className="block space-y-1.5">
                  <span className="text-sm font-medium">Your name</span>
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Piyush"
                    autoFocus
                    className="h-11 w-full rounded-xl border border-input bg-background px-3.5 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  />
                </label>
                <label className="block space-y-1.5">
                  <span className="text-sm font-medium">
                    Roll number{" "}
                    <span className="text-muted-foreground">(optional)</span>
                  </span>
                  <input
                    value={rollNumber}
                    onChange={(e) => setRollNumber(e.target.value)}
                    placeholder="For exam seating later"
                    className="h-11 w-full rounded-xl border border-input bg-background px-3.5 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  />
                </label>
              </>
            )}

            {step === "confirm" && (
              <>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {voice.onboarding.confirmBatch(
                    displayName || "there",
                    `${program.name} (${program.batchLabel})`,
                  )}
                </p>
                <div className="rounded-xl border border-primary/20 bg-primary/5 px-4 py-3">
                  <p className="text-sm font-medium">{program.name}</p>
                  <p className="text-xs text-muted-foreground">
                    Batch {program.batchLabel} · {program.session}
                  </p>
                </div>
              </>
            )}

            {step === "waiting" && (
              <>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {voice.batchComingSoon.body(program.name)}
                </p>
                <Button
                  type="button"
                  className="w-full"
                  variant={batchNotifyRequested ? "outline" : "default"}
                  disabled={submitting || batchNotifyRequested}
                  onClick={() => void requestBatchNotify()}
                >
                  {submitting ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : batchNotifyRequested ? (
                    voice.batchComingSoon.notifyDone
                  ) : (
                    <>
                      <Bell className="size-4" />
                      {voice.batchComingSoon.notifyCta(program.name)}
                    </>
                  )}
                </Button>
              </>
            )}

            {step === "term" && (
              <>
                <p className="text-sm text-muted-foreground">
                  {voice.onboarding.termAsk(displayName || "friend")}
                </p>
                <p className="text-xs text-muted-foreground">{yearHint}</p>
                <div className="grid gap-2">
                  {terms.map((t) => {
                    const locked = t.availability === "locked";
                    const selected = termId === t.id && !locked;
                    return (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => {
                          if (locked) {
                            setLockedTerm(t);
                            return;
                          }
                          setTermId(t.id);
                          setMatched([]);
                          setSelectedCourseIds(new Set());
                          setCohortSectionId("");
                        }}
                        className={cn(
                          "flex items-center justify-between rounded-xl border px-4 py-3.5 text-left transition-colors",
                          locked &&
                            "cursor-pointer border-dashed border-border bg-muted/30 opacity-80",
                          !locked &&
                            selected &&
                            "border-primary bg-primary/5",
                          !locked &&
                            !selected &&
                            "border-border hover:border-primary/30",
                        )}
                      >
                        <span className="flex items-center gap-2">
                          {locked && (
                            <Lock className="size-3.5 shrink-0 text-muted-foreground" />
                          )}
                          <span
                            className={cn(
                              "text-sm font-medium",
                              locked && "text-muted-foreground",
                            )}
                          >
                            {t.name}
                          </span>
                          {locked && t.notifyRequested && (
                            <Bell className="size-3 fill-primary/20 text-primary" />
                          )}
                        </span>
                        {locked ? (
                          <span className="text-xs text-muted-foreground">
                            Soon
                          </span>
                        ) : selected ? (
                          <Check className="size-4 shrink-0 text-primary" />
                        ) : (
                          <span className="text-xs font-medium text-primary">
                            Live
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </>
            )}

            {step === "section" && selectedTerm && (
              <>
                <p className="text-sm text-muted-foreground">
                  {voice.onboarding.sectionAsk(displayName, selectedTerm.name)}
                </p>
                <p className="text-xs text-muted-foreground">
                  {voice.onboarding.sectionHint}
                </p>
                <div className="grid grid-cols-4 gap-2">
                  {selectedTerm.cohortSections.map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => setCohortSectionId(s.id)}
                      className={cn(
                        "aspect-square rounded-xl border text-sm font-semibold transition-colors",
                        cohortSectionId === s.id
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border hover:bg-muted",
                      )}
                    >
                      {s.code}
                    </button>
                  ))}
                </div>
              </>
            )}

            {step === "courses" && (
              <>
                <p className="text-sm text-muted-foreground">
                  {voice.onboarding.coursesHint}
                </p>

                {!useManualPick && matched.length === 0 && (
                  <label className="flex cursor-pointer flex-col items-center gap-2 rounded-xl border border-dashed border-border py-10 transition-colors hover:bg-muted/40">
                    <Upload className="size-7 text-muted-foreground" />
                    <span className="text-sm font-medium">
                      {pdfParsing ? "Reading your PDF…" : "Upload Edtex PDF"}
                    </span>
                    <input
                      type="file"
                      accept="application/pdf"
                      className="hidden"
                      disabled={pdfParsing}
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) void handlePdfUpload(f);
                      }}
                    />
                  </label>
                )}

                {matched.length > 0 && !useManualPick && (
                  <div className="space-y-2">
                    <p className="text-sm font-medium">
                      {voice.onboarding.coursesLoaded(matched.length)}
                    </p>
                    <ul className="max-h-48 space-y-1 overflow-y-auto text-sm text-muted-foreground no-scrollbar">
                      {matched.map((m) => (
                        <li key={m.courseId} className="truncate">
                          {m.courseName}
                        </li>
                      ))}
                    </ul>
                    <button
                      type="button"
                      className="text-xs text-primary hover:underline"
                      onClick={() => {
                        setMatched([]);
                        setUseManualPick(true);
                      }}
                    >
                      Pick manually instead
                    </button>
                  </div>
                )}

                {(useManualPick || (matched.length === 0 && !pdfParsing)) && (
                  <div className="space-y-2">
                    {matched.length === 0 && (
                      <button
                        type="button"
                        className="text-xs text-primary hover:underline"
                        onClick={() => setUseManualPick(false)}
                      >
                        Upload PDF instead
                      </button>
                    )}
                    <div className="max-h-56 space-y-0.5 overflow-y-auto no-scrollbar">
                      {catalog.map((c) => {
                        const on = selectedCourseIds.has(c.id);
                        return (
                          <button
                            key={c.id}
                            type="button"
                            onClick={() => {
                              setSelectedCourseIds((prev) => {
                                const next = new Set(prev);
                                if (next.has(c.id)) next.delete(c.id);
                                else next.add(c.id);
                                return next;
                              });
                            }}
                            className={cn(
                              "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition-colors",
                              on ? "bg-primary/10 font-medium" : "hover:bg-muted",
                            )}
                          >
                            <span
                              className={cn(
                                "flex size-4 shrink-0 items-center justify-center rounded border",
                                on &&
                                  "border-primary bg-primary text-primary-foreground",
                              )}
                            >
                              {on && <Check className="size-3" />}
                            </span>
                            <span className="truncate">{c.name}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </>
            )}

            {step === "sections" && (
              <>
                <p className="text-sm text-muted-foreground">
                  {voice.onboarding.sectionsAsk}
                </p>
                {multiSectionCourses.map((c) => (
                  <div key={c.courseId} className="space-y-2">
                    <p className="text-sm font-medium leading-snug">{c.label}</p>
                    <div className="flex flex-wrap gap-2">
                      {c.sections.map((sec) => (
                        <button
                          key={sec}
                          type="button"
                          onClick={() =>
                            setSectionByCourse((p) => ({
                              ...p,
                              [c.courseId]: sec,
                            }))
                          }
                          className={cn(
                            "min-w-10 rounded-lg border px-3 py-2 text-sm font-medium",
                            sectionByCourse[c.courseId] === sec
                              ? "border-primary bg-primary text-primary-foreground"
                              : "border-border hover:bg-muted",
                          )}
                        >
                          {sec}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </>
            )}

            {error && (
              <p className="text-sm text-destructive" role="alert">
                {error}
              </p>
            )}
          </CardContent>
        </Card>

        {step !== "waiting" && (
          <div className="mt-6 flex gap-3">
            {stepIndex > 0 && (
              <Button type="button" variant="outline" size="lg" onClick={goBack}>
                <ArrowLeft className="size-4" />
              </Button>
            )}
            <Button
              type="button"
              size="lg"
              className="flex-1"
              disabled={submitting || pdfParsing}
              onClick={goNext}
            >
              {submitting ? (
                <Loader2 className="size-4 animate-spin" />
              ) : isLastStep ? (
                voice.onboarding.getStarted
              ) : step === "confirm" ? (
                voice.onboarding.confirmYes
              ) : (
                <>
                  {voice.onboarding.continue}
                  <ArrowRight className="size-4" />
                </>
              )}
            </Button>
          </div>
        )}
      </div>

      {lockedTerm && (
        <LockedTermSheet
          term={lockedTerm}
          onClose={() => setLockedTerm(null)}
          onNotifyChange={handleNotifyChange}
        />
      )}
    </>
  );
}
