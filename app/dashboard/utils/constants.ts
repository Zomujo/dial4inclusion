export const tabs = [
  { id: "cases", label: "Cases" },
  { id: "monitoring", label: "Monitoring" },
  { id: "ussd", label: "USSD Flow" },
];

export const baseFlow = [
  {
    level: "L0",
    title: "District selection",
    prompt:
      "Welcome to Dial4Inclusion! Select your District:\n1. Ablekuma Central\n2. Obuasi Municipal\n3. Upper Denkyira East",
    userAction: "Input: 2",
    rationale: "Fast routing. User only needs district number.",
  },
  {
    level: "L1",
    title: "Main menu",
    prompt:
      "How can we help PWDs in Obuasi?\n1. Report a problem\n2. Ask for info\n3. Speak to a Navigator",
    userAction: "",
    rationale: "Clear choices, option 3 hands off to human quickly.",
  },
];

export const ussdPaths = {
  report: [
    {
      level: "L2",
      title: "Issue & details",
      prompt:
        "Select the main issue:\n1. Disability Fund Delay\n2. Inaccessible Building\n3. Discrimination / Abuse\n4. Other Service Issue\nThen type brief details (50 chars).",
      userAction: "Input: 2 and detail (e.g., No ramp at health center).",
      rationale:
        "Combines category selection + short context to keep flow efficient.",
    },
    {
      level: "L3",
      title: "Confirmation",
      prompt:
        "Thank you! Report logged (ID: [XXXX]). A Navigator may call you back.",
      userAction: "Session ends",
      rationale: "Positive feedback that report succeeded.",
    },
  ],
  info: [
    {
      level: "L2",
      title: "Select topic",
      prompt:
        "Choose a frequently asked question:\n1. Timeline for resolution\n2. Any fees involved?\n3. Who follows up after I report?",
      userAction: "Input: 1, 2, or 3",
      rationale: "Keeps the info menu short and memorable for USSD users.",
    },
    {
      level: "L3",
      title: "Share answer + next step",
      prompt:
        "Display the answer for the selected topic.\nOffer option: 'Press 1 to speak to a Navigator if you still need help.'",
      userAction: "Input: 1 to connect with Navigator or 0 to end session",
      rationale: "Allows user to transition to human support seamlessly.",
    },
  ],
  navigator: [
    {
      level: "L2",
      title: "Navigator connect",
      prompt:
        "You selected Speak to a Navigator. We will call you back within 15 minutes. Press 1 to confirm.",
      userAction: "Input: 1",
      rationale: "Reduces anxiety; call comes to the user.",
    },
    {
      level: "L3",
      title: "Call-back trigger",
      prompt: "Confirmed! Please ensure your line is open. Thank you.",
      userAction: "Session ends",
      rationale: "Back-end triggers call from local Civic Navigator.",
    },
  ],
};

export const issueTypeOptions = [
  {
    value: "access_healthcare",
    label: "Access to Healthcare",
  },
  {
    value: "access_mental_health",
    label: "Access to Mental Health Support",
  },
  {
    value: "discrimination_stigma",
    label: "Discrimination or Stigma",
  },
  {
    value: "physical_accessibility",
    label: "Physical Accessibility Challenge",
  },
  { value: "education", label: "Education" },
  {
    value: "employment_livelihood",
    label: "Employment / Livelihood",
  },
  {
    value: "social_protection",
    label: "Social Protection (LEAP, Disability Fund)",
  },
  { value: "assistive_device", label: "Assistive Device" },
  { value: "gender_based_violence", label: "Gender-Based Violence" },
  {
    value: "legal_human_rights",
    label: "Legal / Human Rights Issue",
  },
  {
    value: "community_participation",
    label: "Community Participation Barrier",
  },
  {
    value: "lack_documentation",
    label: "Lack of Documentation",
  },
  { value: "other", label: "Other" },
];

export const districtOptions = [
  { value: "ablekuma_central", label: "Ablekuma Central" },
  { value: "obuasi_municipal", label: "Obuasi Municipal" },
  { value: "upper_denkyira_east", label: "Upper Denkyira East" },
];

export const categoryOptions = [
  { value: "visual_impairment", label: "Visual Impairment" },
  { value: "hearing_impairment", label: "Hearing Impairment" },
  { value: "physical_disability", label: "Physical Disability" },
  { value: "intellectual_disability", label: "Intellectual Disability" },
  { value: "psychosocial_disability", label: "Psychosocial Disability" },
  { value: "speech_impairment", label: "Speech Impairment" },
  { value: "multiple_disabilities", label: "Multiple Disabilities" },
  { value: "disability_fund_delay", label: "Disability Fund Delay" },
  { value: "inaccessible_building", label: "Inaccessible Building" },
  { value: "discrimination_abuse", label: "Discrimination / Abuse" },
  { value: "other", label: "Other" },
];

export const assistiveDeviceOptions = [
  { value: "none", label: "None" },
  { value: "white_cane", label: "White Cane" },
  { value: "wheelchair", label: "Wheelchair" },
  { value: "crutches", label: "Crutches" },
  { value: "hearing_aid", label: "Hearing Aid" },
  { value: "braille_device", label: "Braille Device" },
  { value: "other", label: "Other" },
];

export const requestTypeOptions = [
  { value: "assistive_device_support", label: "Assistive Device Support" },
  {
    value: "health_rehabilitation_support",
    label: "Health / Rehabilitation Support",
  },
  { value: "mental_health_counselling", label: "Mental Health Counselling" },
  { value: "financial_assistance", label: "Financial Assistance" },
  {
    value: "legal_social_welfare_support",
    label: "Legal / Social Welfare Support",
  },
  { value: "education_training", label: "Education / Training" },
  { value: "accessibility_improvement", label: "Accessibility Improvement" },
  { value: "employment_skills_support", label: "Employment / Skills Support" },
  { value: "community_inclusion", label: "Community Inclusion" },
  {
    value: "documentation_assistance",
    label: "Documentation Assistance (NHIS, Ghana Card)",
  },
  { value: "transportation_assistance", label: "Transportation Assistance" },
  { value: "other", label: "Other" },
];

export const statusOptions = [
  { value: "pending", label: "Pending" },
  { value: "in_progress", label: "In Progress" },
  { value: "resolved", label: "Resolved" },
  { value: "rejected", label: "Rejected" },
];

export const statusOptionsWithEscalated = [
  { value: "escalated", label: "Escalated" },
  { value: "pending", label: "Pending" },
  { value: "in_progress", label: "In Progress" },
  { value: "resolved", label: "Resolved" },
  { value: "rejected", label: "Rejected" },
];
