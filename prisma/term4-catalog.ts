/**
 * IIM Kozhikode PGP Term IV elective catalog (bidding sheet), grouped by area.
 * Each section is a selectable option with its own timings, seats, and professor.
 * Used to seed the course picker so students get real, categorized choices.
 */

export interface CatalogSection {
  code: string; // "A" | "B" | "C"
  timings: string;
  totalSeats: number;
  remainingSeats: number;
  professor: string;
}

export interface CatalogCourse {
  area: string; // ECO, OBHR, FAC, HLAM, IS, DSOM, MM, SM
  abbr: string; // course code, e.g. "PG2E-005"
  name: string;
  credits: number;
  sections: CatalogSection[];
}

export const TERM4_CATALOG: CatalogCourse[] = [
  // ---------------- ECO ----------------
  {
    area: "ECO",
    abbr: "PG2E-005",
    name: "Game Theory",
    credits: 3,
    sections: [
      { code: "A", timings: "MON(1045-1200), TUE(1045-1200), FRI(1045-1200)", totalSeats: 60, remainingSeats: 0, professor: "Prof. Anirban Ghatak" },
      { code: "B", timings: "MON(1215-1330), TUE(1215-1330), FRI(1215-1330)", totalSeats: 60, remainingSeats: 0, professor: "Prof. Anirban Ghatak" },
      { code: "C", timings: "MON(1430-1545), TUE(1430-1545), FRI(1430-1545)", totalSeats: 60, remainingSeats: 0, professor: "Prof. Anirban Ghatak" },
    ],
  },
  {
    area: "ECO",
    abbr: "PG2E-021",
    name: "Financial Crisis",
    credits: 3,
    sections: [
      { code: "A", timings: "MON(915-1030), WED(915-1030), THU(915-1030)", totalSeats: 60, remainingSeats: 0, professor: "Prof. Mridul Kumar Saggar" },
    ],
  },
  {
    area: "ECO",
    abbr: "PG2E-024",
    name: "Economics of Market Power and Competition",
    credits: 3,
    sections: [
      { code: "A", timings: "MON(1730-1845), WED(1730-1845), FRI(1730-1845)", totalSeats: 60, remainingSeats: 23, professor: "Prof. Varun Yadav" },
    ],
  },

  // ---------------- OBHR ----------------
  {
    area: "OBHR",
    abbr: "PG2OBHR-041",
    name: "Labour Law & IR",
    credits: 3,
    sections: [
      { code: "A", timings: "TUE(915-1030), THU(1045-1200), FRI(915-1030)", totalSeats: 60, remainingSeats: 0, professor: "Prof. Manoranjan Dhal" },
    ],
  },
  {
    area: "OBHR",
    abbr: "MD-PG2OBHR-002",
    name: "Negotiation & Conflict Management",
    credits: 3,
    sections: [
      { code: "A", timings: "MON(1600-1715), WED(1600-1715), FRI(1730-1845)", totalSeats: 60, remainingSeats: 0, professor: "Prof. Manoranjan Dhal" },
      { code: "B", timings: "MON(1730-1845), WED(1730-1845), FRI(1900-2015)", totalSeats: 60, remainingSeats: 0, professor: "Prof. Manoranjan Dhal" },
    ],
  },
  {
    area: "OBHR",
    abbr: "PG2OBHR-009",
    name: "Leadership: Inspiration, Dilemmas & Action",
    credits: 3,
    sections: [
      { code: "A", timings: "MON(1730-1845), TUE(1730-1845), THU(1730-1845)", totalSeats: 60, remainingSeats: 4, professor: "Prof. Unnikrishnan Nair" },
    ],
  },
  {
    area: "OBHR",
    abbr: "PG2OBHR-051",
    name: "Managing from the Inside Out: A Journey of Action & Reflection",
    credits: 3,
    sections: [
      { code: "A", timings: "TUE(1215-1330), WED(1215-1330), FRI(1215-1330)", totalSeats: 60, remainingSeats: 0, professor: "Prof. Ankur Jain" },
    ],
  },

  // ---------------- FAC ----------------
  {
    area: "FAC",
    abbr: "PG2F-033",
    name: "Commercial Bank Management",
    credits: 3,
    sections: [
      { code: "A", timings: "TUE(1900-2015), WED(1730-1845), FRI(1900-2015)", totalSeats: 60, remainingSeats: 0, professor: "Prof. Pankaj Kumar Baag" },
    ],
  },
  {
    area: "FAC",
    abbr: "PG2F-005",
    name: "Financial Derivatives",
    credits: 3,
    sections: [
      { code: "A", timings: "MON(1900-2015), WED(1900-2015), THU(1900-2015)", totalSeats: 60, remainingSeats: 0, professor: "Prof. SSS Kumar" },
    ],
  },
  {
    area: "FAC",
    abbr: "PG2F-015",
    name: "Fixed Income Securities",
    credits: 3,
    sections: [
      { code: "A", timings: "MON(1430-1545), TUE(1600-1715), FRI(1600-1715)", totalSeats: 60, remainingSeats: 0, professor: "Prof. Abhinav Anand" },
    ],
  },
  {
    area: "FAC",
    abbr: "PG2F-035",
    name: "Corporate Valuation",
    credits: 3,
    sections: [
      { code: "A", timings: "MON(1045-1200), TUE(1045-1200), FRI(1045-1200)", totalSeats: 60, remainingSeats: 0, professor: "Prof. Abhilash S Nair" },
    ],
  },
  {
    area: "FAC",
    abbr: "PG2F-031",
    name: "Investment Analysis and Portfolio Management",
    credits: 3,
    sections: [
      { code: "A", timings: "MON(1045-1200), TUE(1045-1200), FRI(1045-1200)", totalSeats: 60, remainingSeats: 0, professor: "Prof. Aravind Sampath" },
      { code: "B", timings: "MON(1215-1330), TUE(1215-1330), FRI(1215-1330)", totalSeats: 60, remainingSeats: 1, professor: "Prof. Aravind Sampath" },
    ],
  },

  // ---------------- HLAM ----------------
  {
    area: "HLAM",
    abbr: "PG2HLAM-028",
    name: "Politics of Food",
    credits: 3,
    sections: [
      { code: "A", timings: "MON(915-1030), WED(915-1030), THU(915-1030)", totalSeats: 60, remainingSeats: 29, professor: "Prof. Salamah Ansari & Prof. Suraj Gogoi" },
    ],
  },
  {
    area: "HLAM",
    abbr: "PG2GM-001",
    name: "Globalisation and Culture",
    credits: 3,
    sections: [
      { code: "A", timings: "TUE(1430-1545), WED(1430-1545), FRI(1430-1545)", totalSeats: 60, remainingSeats: 0, professor: "Prof. A.F Mathew" },
      { code: "B", timings: "TUE(1600-1715), WED(1600-1715), FRI(1600-1715)", totalSeats: 60, remainingSeats: 0, professor: "Prof. A.F Mathew" },
      { code: "C", timings: "TUE(1730-1845), WED(1730-1845), FRI(1730-1845)", totalSeats: 60, remainingSeats: 0, professor: "Prof. A.F Mathew" },
    ],
  },
  {
    area: "HLAM",
    abbr: "PG2HLAM-012",
    name: "Intellectual Property Rights",
    credits: 3,
    sections: [
      { code: "A", timings: "MON(1215-1330), WED(1045-1200), THU(1215-1330)", totalSeats: 60, remainingSeats: 22, professor: "Prof. Deva Prasad M" },
    ],
  },
  {
    area: "HLAM",
    abbr: "PG2HLAM-014",
    name: "Law, Management and Entrepreneurship",
    credits: 3,
    sections: [
      { code: "A", timings: "MON(1900-2015), WED(1900-2015), THU(1900-2015)", totalSeats: 60, remainingSeats: 0, professor: "Prof. Shannu Narayan" },
    ],
  },
  {
    area: "HLAM",
    abbr: "PG2HLAM-029",
    name: "Women in Indian Society: A Sociological Overview",
    credits: 3,
    sections: [
      { code: "A", timings: "TUE(1900-2015), WED(1730-1845), FRI(1900-2015)", totalSeats: 60, remainingSeats: 0, professor: "Prof. Irfanullah Farooqi" },
      { code: "B", timings: "TUE(2030-2145), WED(1900-2015), FRI(2030-2145)", totalSeats: 60, remainingSeats: 13, professor: "Prof. Irfanullah Farooqi" },
    ],
  },
  {
    area: "HLAM",
    abbr: "PG2HLAM-030",
    name: "Intimacy, Love, and the Market: A Sociological Overview",
    credits: 3,
    sections: [
      { code: "A", timings: "MON(1600-1715), THU(1900-2015), FRI(1730-1845)", totalSeats: 60, remainingSeats: 0, professor: "Prof. Irfanullah Farooqi" },
      { code: "B", timings: "MON(2030-2145), WED(1600-1715), THU(2030-2145)", totalSeats: 60, remainingSeats: 0, professor: "Prof. Irfanullah Farooqi" },
    ],
  },
  {
    area: "HLAM",
    abbr: "PG2HLAM-031",
    name: "Visual Culture: Understanding Images",
    credits: 3,
    sections: [
      { code: "A", timings: "TUE(1430-1545), WED(1215-1330), FRI(1430-1545)", totalSeats: 60, remainingSeats: 38, professor: "Prof. Anisa Bhutia" },
    ],
  },
  {
    area: "HLAM",
    abbr: "PG2HLAM-032",
    name: "Yoga and Mindfulness for Mental Health Champions",
    credits: 3,
    sections: [
      { code: "A", timings: "MON(1730-1845), TUE(1730-1845), THU(1730-1845)", totalSeats: 60, remainingSeats: 0, professor: "Prof. Judu Ilavarasu & Prof. Vipin P Veetil" },
    ],
  },

  // ---------------- IS ----------------
  {
    area: "IS",
    abbr: "PG2IT-041",
    name: "Artificial Intelligence for Business",
    credits: 3,
    sections: [
      { code: "A", timings: "MON(1600-1715), WED(1600-1715), FRI(1730-1845)", totalSeats: 60, remainingSeats: 1, professor: "Prof. MP Sebastian" },
    ],
  },
  {
    area: "IS",
    abbr: "PG2IT-049",
    name: "Cyber Security",
    credits: 3,
    sections: [
      { code: "A", timings: "TUE(1430-1545), WED(1430-1545), FRI(1430-1545)", totalSeats: 60, remainingSeats: 0, professor: "Prof. A Sreejith" },
    ],
  },
  {
    area: "IS",
    abbr: "PG2IT-034",
    name: "Digital Advertising",
    credits: 3,
    sections: [
      { code: "A", timings: "MON(1600-1715), TUE(1045-1200), FRI(1045-1200)", totalSeats: 60, remainingSeats: 17, professor: "Prof. Mohammed Shahid Abdulla" },
    ],
  },
  {
    area: "IS",
    abbr: "PG2IT-039",
    name: "E-Commerce",
    credits: 3,
    sections: [
      { code: "A", timings: "MON(1430-1545), TUE(1600-1715), FRI(1600-1715)", totalSeats: 60, remainingSeats: 43, professor: "Prof. Anindita Paul" },
    ],
  },
  {
    area: "IS",
    abbr: "PG2IT-031",
    name: "Management of IT Products and Services",
    credits: 3,
    sections: [
      { code: "A", timings: "MON(915-1030), WED(915-1030), THU(915-1030)", totalSeats: 60, remainingSeats: 0, professor: "Prof. Mohammed Shahid Abdulla" },
    ],
  },
  {
    area: "IS",
    abbr: "PG2IT-035",
    name: "Social Media Analytics",
    credits: 3,
    sections: [
      { code: "A", timings: "MON(1430-1545), WED(1430-1545), THU(1730-1845)", totalSeats: 60, remainingSeats: 32, professor: "Prof. Satish Krishnan" },
      { code: "B", timings: "MON(1600-1715), WED(1600-1715), THU(1900-2015)", totalSeats: 60, remainingSeats: 20, professor: "Prof. Satish Krishnan" },
    ],
  },
  {
    area: "IS",
    abbr: "PG2IT-052",
    name: "Good Data, Bad Data",
    credits: 3,
    sections: [
      { code: "A", timings: "TUE(1730-1845), WED(1215-1330), FRI(1215-1330)", totalSeats: 60, remainingSeats: 1, professor: "Prof. Kalpit Sharma" },
    ],
  },
  {
    area: "IS",
    abbr: "PG2IT-053",
    name: "Decoding Web 3.0",
    credits: 3,
    sections: [
      { code: "A", timings: "MON(1430-1545), TUE(1600-1715), FRI(1600-1715)", totalSeats: 60, remainingSeats: 10, professor: "Prof. Kalpit Sharma" },
    ],
  },
  {
    area: "IS",
    abbr: "PG2IT-050",
    name: "Enterprise IT Risk Management",
    credits: 3,
    sections: [
      { code: "A", timings: "TUE(1430-1545), WED(1430-1545), FRI(1430-1545)", totalSeats: 60, remainingSeats: 26, professor: "Prof. Kalpit Sharma" },
    ],
  },
  {
    area: "IS",
    abbr: "PG2IT-054",
    name: "Managing Business with Generative and Agentic AI",
    credits: 3,
    sections: [
      { code: "A", timings: "MON(1430-1545), TUE(1600-1715), FRI(1600-1715)", totalSeats: 60, remainingSeats: 0, professor: "Prof. Swati Jain" },
    ],
  },

  // ---------------- DSOM ----------------
  {
    area: "DSOM",
    abbr: "PGPLSM-QM-002",
    name: "Humanitarian Supply Chain Management",
    credits: 3,
    sections: [
      { code: "A", timings: "MON(1215-1330), WED(1045-1200), THU(1215-1330)", totalSeats: 50, remainingSeats: 48, professor: "Prof. G Anand" },
    ],
  },
  {
    area: "DSOM",
    abbr: "PG2QM-019",
    name: "Data Analytics Using R",
    credits: 3,
    sections: [
      { code: "A", timings: "MON(1900-2015), WED(1900-2015), THU(1900-2015)", totalSeats: 60, remainingSeats: 40, professor: "Prof. Soumya Roy" },
    ],
  },
  {
    area: "DSOM",
    abbr: "PG2QM-006",
    name: "Service Operations Management",
    credits: 3,
    sections: [
      { code: "A", timings: "TUE(1215-1330), WED(1215-1330), FRI(1215-1330)", totalSeats: 60, remainingSeats: 28, professor: "Prof. G Anand" },
    ],
  },
  {
    area: "DSOM",
    abbr: "PG2QM-001",
    name: "Supply Chain Management",
    credits: 3,
    sections: [
      { code: "A", timings: "MON(1430-1545), TUE(1600-1715), FRI(1600-1715)", totalSeats: 60, remainingSeats: 29, professor: "Prof. Arnab Adhikari" },
    ],
  },
  {
    area: "DSOM",
    abbr: "PG2QM-002",
    name: "Project Management",
    credits: 3,
    sections: [
      { code: "A", timings: "MON(1045-1200), TUE(1045-1200), FRI(1045-1200)", totalSeats: 60, remainingSeats: 0, professor: "Prof. G Thangamani" },
    ],
  },

  // ---------------- MM ----------------
  {
    area: "MM",
    abbr: "PG2M-039",
    name: "Marketing Research for BDM",
    credits: 3,
    sections: [
      { code: "A", timings: "MON(915-1030), WED(915-1030), THU(915-1030)", totalSeats: 60, remainingSeats: 1, professor: "Prof. Sreejesh S" },
    ],
  },
  {
    area: "MM",
    abbr: "PG2M-011",
    name: "Consumer Behaviour",
    credits: 3,
    sections: [
      { code: "A", timings: "MON(1215-1330), WED(1045-1200), THU(1215-1330)", totalSeats: 60, remainingSeats: 0, professor: "Prof. Geetha M" },
    ],
  },
  {
    area: "MM",
    abbr: "PG2M-029",
    name: "Retail Management",
    credits: 3,
    sections: [
      { code: "A", timings: "TUE(1215-1330), WED(1215-1330), FRI(1215-1330)", totalSeats: 60, remainingSeats: 7, professor: "Prof. Geetha M" },
    ],
  },
  {
    area: "MM",
    abbr: "PG2M-035",
    name: "Managing Business Markets",
    credits: 3,
    sections: [
      { code: "A", timings: "MON(1900-2015), WED(1900-2015), THU(1900-2015)", totalSeats: 60, remainingSeats: 35, professor: "Prof. Joffi Thomas" },
    ],
  },
  {
    area: "MM",
    abbr: "PG2M-042",
    name: "The CMO's Playbook",
    credits: 3,
    sections: [
      { code: "A", timings: "TUE(1430-1545), WED(1430-1545), FRI(1430-1545)", totalSeats: 60, remainingSeats: 0, professor: "Prof. Priya Narayanan" },
    ],
  },
  {
    area: "MM",
    abbr: "PG2M-038",
    name: "Customer Analytics",
    credits: 3,
    sections: [
      { code: "A", timings: "MON(1215-1330), WED(1045-1200), THU(1215-1330)", totalSeats: 60, remainingSeats: 0, professor: "Prof. Sreejesh S" },
    ],
  },
  {
    area: "MM",
    abbr: "PG2M-005",
    name: "Sales and Distribution Management",
    credits: 3,
    sections: [
      { code: "A", timings: "TUE(915-1030), THU(1045-1200), FRI(915-1030)", totalSeats: 60, remainingSeats: 0, professor: "Prof. G. Sridhar & Prof. Ashwin Baliga" },
    ],
  },
  {
    area: "MM",
    abbr: "PG2M-050",
    name: "Marketing Automation & Agentic Systems",
    credits: 3,
    sections: [
      { code: "A", timings: "MON(1215-1330), WED(1045-1200), THU(1215-1330)", totalSeats: 60, remainingSeats: 6, professor: "Prof. Dharun Kasilingam & Prof. Omkumar Krishnan" },
    ],
  },

  // ---------------- SM ----------------
  {
    area: "SM",
    abbr: "PG2S-031",
    name: "Global Business Strategy",
    credits: 3,
    sections: [
      { code: "A", timings: "TUE(915-1030), WED(915-1030), THU(915-1030)", totalSeats: 60, remainingSeats: 0, professor: "Prof. Venkataraman S" },
      { code: "B", timings: "TUE(1045-1200), WED(1045-1200), THU(1045-1200)", totalSeats: 60, remainingSeats: 0, professor: "Prof. Venkataraman S" },
    ],
  },
  {
    area: "SM",
    abbr: "PG2S-033",
    name: "Patterns of Strategy and Sports",
    credits: 3,
    sections: [
      { code: "A", timings: "TUE(1430-1545), WED(1430-1545), FRI(1430-1545)", totalSeats: 60, remainingSeats: 0, professor: "Prof. Deepak Dhayanithy" },
    ],
  },
  {
    area: "SM",
    abbr: "PG2S-029",
    name: "Strategic Business and Risk Analysis",
    credits: 3,
    sections: [
      { code: "A", timings: "TUE(1215-1330), WED(1215-1330), THU(1215-1330)", totalSeats: 60, remainingSeats: 5, professor: "Prof. Venkataraman S" },
    ],
  },
  {
    area: "SM",
    abbr: "PG2S-021",
    name: "Corporate Governance",
    credits: 3,
    sections: [
      { code: "A", timings: "MON(1045-1200), TUE(915-1030), FRI(1045-1200)", totalSeats: 60, remainingSeats: 20, professor: "Prof. S Subramanian" },
    ],
  },
  {
    area: "SM",
    abbr: "PG2S-037",
    name: "Consulting",
    credits: 3,
    sections: [
      { code: "A", timings: "TUE(915-1030), THU(1045-1200), FRI(915-1030)", totalSeats: 60, remainingSeats: 1, professor: "Prof. Rajesh Upadhyayula" },
    ],
  },
];

export interface ShuttleSeed {
  sequence: number;
  departTime: string;
  fromStop: string;
  toStop: string;
  finalStop?: string;
  extendedToMainGate?: boolean;
}

/** Students Bus Timings w.e.f. 09.06.2026 (Phase V campus shuttle). */
export const SHUTTLE_SCHEDULE: ShuttleSeed[] = [
  { sequence: 1, departTime: "08:55", fromStop: "C&D Housing", toStop: "Phase V Campus", finalStop: "PGP Auditorium" },
  { sequence: 2, departTime: "09:05", fromStop: "PGP Auditorium", toStop: "Phase V Campus", finalStop: "C&D Housing" },
  { sequence: 3, departTime: "10:25", fromStop: "C&D Housing", toStop: "Phase V Campus", finalStop: "C&D Housing" },
  { sequence: 4, departTime: "10:35", fromStop: "PGP Auditorium", toStop: "Phase V Campus", finalStop: "C&D Housing" },
  { sequence: 5, departTime: "10:37", fromStop: "C&D Housing", toStop: "Phase V Campus", finalStop: "PGP Auditorium" },
  { sequence: 6, departTime: "11:00", fromStop: "PGP Auditorium", toStop: "Phase V Campus", finalStop: "C&D Housing", extendedToMainGate: true },
  { sequence: 7, departTime: "11:45", fromStop: "Maingate", toStop: "C&D Housing", finalStop: "PGP Auditorium" },
  { sequence: 8, departTime: "12:05", fromStop: "C&D Housing", toStop: "Phase V Campus", finalStop: "C&D Housing" },
  { sequence: 9, departTime: "12:07", fromStop: "PGP Auditorium", toStop: "Phase V Campus", finalStop: "PGP Auditorium" },
  { sequence: 10, departTime: "13:35", fromStop: "C&D Housing", toStop: "Phase V Campus", finalStop: "C&D Housing" },
  { sequence: 11, departTime: "13:38", fromStop: "PGP Auditorium", toStop: "Phase V Campus", finalStop: "PGP Auditorium" },
  { sequence: 12, departTime: "13:45", fromStop: "C&D Housing", toStop: "Phase V Campus", finalStop: "C&D Housing", extendedToMainGate: true },
  { sequence: 13, departTime: "14:05", fromStop: "Maingate", toStop: "C&D Housing", finalStop: "PGP Auditorium" },
  { sequence: 14, departTime: "14:15", fromStop: "C&D Housing", toStop: "Phase V Campus", finalStop: "C&D Housing" },
  { sequence: 15, departTime: "14:17", fromStop: "PGP Auditorium", toStop: "Phase V Campus", finalStop: "PGP Auditorium" },
  { sequence: 16, departTime: "15:00", fromStop: "C&D Housing", toStop: "Phase V Campus", finalStop: "C&D Housing", extendedToMainGate: true },
  { sequence: 17, departTime: "15:30", fromStop: "Maingate", toStop: "C&D Housing", finalStop: "PGP Auditorium" },
  { sequence: 18, departTime: "15:50", fromStop: "C&D Housing", toStop: "Phase V Campus", finalStop: "C&D Housing" },
  { sequence: 19, departTime: "15:52", fromStop: "PGP Auditorium", toStop: "Phase V Campus", finalStop: "PGP Auditorium" },
  { sequence: 20, departTime: "16:15", fromStop: "C&D Housing", toStop: "Phase V Campus", finalStop: "C&D Housing", extendedToMainGate: true },
  { sequence: 21, departTime: "17:00", fromStop: "Maingate", toStop: "C&D Housing", finalStop: "PGP Auditorium" },
  { sequence: 22, departTime: "17:20", fromStop: "C&D Housing", toStop: "Phase V Campus", finalStop: "PGP Auditorium" },
  { sequence: 23, departTime: "17:22", fromStop: "PGP Auditorium", toStop: "Phase V Campus", finalStop: "PGP Auditorium" },
  { sequence: 24, departTime: "18:00", fromStop: "C&D Housing", toStop: "Phase V Campus", finalStop: "C&D Housing", extendedToMainGate: true },
  { sequence: 25, departTime: "18:20", fromStop: "Maingate", toStop: "C&D Housing", finalStop: "PGP Auditorium" },
  { sequence: 26, departTime: "18:50", fromStop: "C&D Housing", toStop: "Phase V Campus", finalStop: "C&D Housing" },
  { sequence: 27, departTime: "18:52", fromStop: "PGP Auditorium", toStop: "Phase V Campus", finalStop: "PGP Auditorium" },
  { sequence: 28, departTime: "19:00", fromStop: "C&D Housing", toStop: "Phase V Campus", finalStop: "C&D Housing", extendedToMainGate: true },
  { sequence: 29, departTime: "20:00", fromStop: "Maingate", toStop: "C&D Housing", finalStop: "Phase V Campus" },
  { sequence: 30, departTime: "20:10", fromStop: "PGP Auditorium", toStop: "Phase V Campus", finalStop: "PGP Auditorium" },
  { sequence: 31, departTime: "20:15", fromStop: "C&D Housing", toStop: "Phase V Campus", finalStop: "PGP Auditorium" },
  { sequence: 32, departTime: "20:28", fromStop: "PGP Auditorium", toStop: "Phase V Campus", finalStop: "C&D Housing", extendedToMainGate: true },
  { sequence: 33, departTime: "21:00", fromStop: "Maingate", toStop: "C&D Housing", finalStop: "Phase V Campus" },
  { sequence: 34, departTime: "21:50", fromStop: "PGP Auditorium", toStop: "Phase V Campus", finalStop: "C&D Housing & Return to PGP" },
  { sequence: 35, departTime: "21:50", fromStop: "PGP Auditorium", toStop: "Phase V Campus", finalStop: "C&D Housing", extendedToMainGate: true },
  { sequence: 36, departTime: "22:20", fromStop: "Maingate", toStop: "C&D Housing", finalStop: "PGP Auditorium", extendedToMainGate: true },
  { sequence: 37, departTime: "22:40", fromStop: "PGP Auditorium", toStop: "Phase V Campus", finalStop: "C&D Housing", extendedToMainGate: true },
  { sequence: 38, departTime: "23:00", fromStop: "Maingate", toStop: "C&D Housing", finalStop: "PGP Auditorium" },
  { sequence: 39, departTime: "23:20", fromStop: "PGP Auditorium", toStop: "Phase V Campus", finalStop: "C&D Housing & Return to PGP" },
  { sequence: 40, departTime: "23:40", fromStop: "Maingate", toStop: "C&D Housing", finalStop: "PGP Auditorium", extendedToMainGate: true },
  { sequence: 41, departTime: "00:00", fromStop: "Maingate", toStop: "Phase V Campus", finalStop: "PGP Auditorium" },
];
