/** Witty, student-friendly copy — Duolingo warmth + Zomato cheek. */

export const voice = {
  onboarding: {
    welcome: (brand: string) => `New here? Same. Let's fix that.`,
    nameAsk: "What should we call you?",
    nameHint: "First name works. We won't quiz you on spelling.",
    rollHint: "Roll number — optional, but helps with exam seating later.",
    nameTooShort: "Need at least 2 characters. Even your nickname counts.",
    confirmBatch: (name: string, program: string) =>
      `Hey ${name} 👋 You're in ${program}. That track?`,
    confirmYes: "Yep, that's me",
    confirmWrong: "Wait, that's wrong",
    termAsk: (name: string) => `${name}, which term are you riding right now?`,
    termYear2Hint: "Year 2 crew — pick your term below.",
    termYear1Hint: "Freshman energy — pick your term below.",
    sectionAsk: (name: string, term: string) =>
      `${name}, which section for ${term}?`,
    sectionHint: "Tap your letter. No wrong answers — well, maybe one.",
    coursesAsk: (name: string) => `Last stretch, ${name}.`,
    coursesHint:
      "Drop your Edtex PDF — we'll read it. Or pick courses yourself if you're feeling manual.",
    coursesLoaded: (n: number) =>
      `${n} course${n === 1 ? "" : "s"} locked in. Chef's kiss.`,
    sectionsAsk: "A couple of courses need your section pick.",
    done: (name: string) => `You're in, ${name}. Schedule's warming up.`,
    continue: "On we go",
    getStarted: "Take me to my schedule",
    pickTerm: "Pick a term to continue",
    pickLiveTerm: "Choose an available term first — locked ones are still cooking.",
    pickSection: "Section, please. We're not mind-readers. Yet.",
    addCourses: "Add at least one course. Zero is a bold strategy, not a good one.",
    pickCourseSections: "Pick a section for each course still waiting.",
  },

  termLocked: {
    title: (termName: string) => `${termName} isn't ready yet`,
    body: (termName: string) =>
      `The academic office hasn't dropped the ${termName} schedule link yet. We're as impatient as you are — promise.`,
    notifyCta: "Ping me when it's live",
    notifyDone: "You're on the list ✓",
    notifySub: "We'll nudge you the second the schedule lands. No spam, just schedule.",
    notifyError: "Couldn't save that. Try again?",
    dismiss: "Got it",
  },

  batchComingSoon: {
    title: (program: string) => `${program} — almost there`,
    body: (program: string) =>
      `Your batch schedules aren't live yet. The moment academic office shares the links, we plug them in — you won't need to reinstall anything.`,
    notifyCta: (program: string) => `Notify me when ${program} goes live`,
    notifyDone: "We'll holler when it's ready ✓",
  },

  errors: {
    generic: "Something broke. Not you — us. Try again?",
    saveFailed: "Couldn't save. Give it another shot?",
  },

  today: {
    greeting: (name: string) => `Good day, ${name}`,
    nextUp: "Next up",
    freeRestOfDay: (name: string) =>
      `That's a wrap for today, ${name}. Go touch some grass. 🌿`,
    noClassesToday: (name: string) =>
      `Nothing on the timetable today, ${name}. Suspiciously quiet — enjoy it.`,
    allCancelledToday: "Every class today got axed. The universe says rest.",
    emptyTitle: "No courses yet",
    emptyBody:
      "Add your courses and your daily class timeline shows up right here.",
    addCourses: "Add my courses",
  },

  schedule: {
    subtitle: "Your classes — cancellations and reschedules flagged live.",
    dayTab: "Day",
    weekTab: "Week",
    emptyTitle: "No classes here",
    emptyDay: "Nothing scheduled. Rare W. 🎉",
    emptyBody: "Add your courses to see your timetable in full colour.",
    cancelled: "Cancelled",
    rescheduled: "Rescheduled",
    added: "Added",
    today: "Today",
    prev: "Previous",
    next: "Next",
  },

  courses: {
    subtitle: "Everything you're enrolled in this term.",
    emptyTitle: "No courses loaded",
    emptyBody:
      "Drop your Edtex PDF or pick your courses, and they'll line up here.",
    creditsLabel: (n: number) => `${n} credit${n === 1 ? "" : "s"}`,
    facultyTbd: "Faculty TBA",
    sectionLabel: (code: string) => `Section ${code}`,
  },

  attendance: {
    title: "Attendance",
    overall: "Overall",
    safe: "You're cruising. 😎",
    warning: "Cutting it close. Show up. 👀",
    danger: "Danger zone. Attend or it's debarment o'clock. 🚨",
    bunksLeft: (n: number) =>
      n > 0
        ? `${n} bunk${n === 1 ? "" : "s"} left`
        : n === 0
          ? "No bunks left — attend everything."
          : `${Math.abs(n)} over the limit 😬`,
    held: (a: number, h: number) => `${a}/${h} attended`,
    markHint: "Tap ✓ present or ✗ absent on past classes.",
    none: "Nothing to track yet — your past classes will show up here.",
  },

  notify: {
    termLive: (termName: string) =>
      `${termName} schedule just dropped. Tap in before your batchmates beat you to the good seats.`,
    batchLive: (program: string) =>
      `${program} schedules are live on Kairo. Your campus life just got an upgrade.`,
    termLiveTitle: (termName: string) => `${termName} is live 🎉`,
    cancelledTitle: "Class cancelled ❌",
    rescheduledTitle: "Class rescheduled 🔁",
    roomChangedTitle: "Room changed 📍",
    timeChangedTitle: "Time changed ⏰",
    addedTitle: "New class added ➕",
    changeTitle: "Schedule update 📣",
  },
} as const;
