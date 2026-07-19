export type CareJourneyId = 'pharmacy' | 'clinic' | 'laboratory' | 'discharge';

export type CareJourney = {
  id: CareJourneyId;
  title: string;
  shortTitle: string;
  description: string;
  locationCategory: 'pharmacy' | 'clinic' | 'laboratory' | 'hospital';
  preparation: readonly string[];
  questions: readonly string[];
};

export const CARE_JOURNEYS: readonly CareJourney[] = [
  {
    id: 'pharmacy',
    title: 'Pharmacy visit',
    shortTitle: 'Pharmacy',
    description: 'Prepare a clear, like-for-like conversation before you buy or refill medicine.',
    locationCategory: 'pharmacy',
    preparation: ['Bring your prescription or current medicine pack if you have one.', 'Write down the exact product name and pack size you need.', 'Ask the pharmacist to confirm what is available before you purchase.'],
    questions: ['Can you help me confirm the ingredient, strength, form, and pack?', 'Is this the same product format as the one I currently use?', 'What should I confirm with my prescriber before changing anything?'],
  },
  {
    id: 'clinic',
    title: 'Clinic appointment',
    shortTitle: 'Clinic',
    description: 'Arrive prepared with a focused agenda and a record of the questions you want answered.',
    locationCategory: 'clinic',
    preparation: ['Bring a government ID, appointment details, and any clinic requirements.', 'Keep a short written list of concerns you want to discuss.', 'Bring prior instructions or records only if the clinic asked for them.'],
    questions: ['What is the most important next step after today’s visit?', 'Which instructions should I write down before I leave?', 'Who should I contact if I need to clarify an instruction?'],
  },
  {
    id: 'laboratory',
    title: 'Laboratory visit',
    shortTitle: 'Laboratory',
    description: 'Keep your test request, preparation requirements, and follow-up plan in one simple checklist.',
    locationCategory: 'laboratory',
    preparation: ['Bring the test request and a valid ID.', 'Confirm any preparation instructions directly with the laboratory.', 'Ask how and when results will be released.'],
    questions: ['Can you confirm the preparation requirements for this test?', 'When and how will my results be available?', 'Who should explain the results or next steps to me?'],
  },
  {
    id: 'discharge',
    title: 'Hospital discharge',
    shortTitle: 'Discharge',
    description: 'Leave with practical follow-up questions and a clear way to contact the care team.',
    locationCategory: 'hospital',
    preparation: ['Keep the discharge papers and follow-up contact details together.', 'Ask which instructions need to be followed first.', 'Confirm where to direct non-emergency follow-up questions.'],
    questions: ['What should I make sure I understand before I leave?', 'When and where is my follow-up arranged?', 'Who should I contact if I cannot understand an instruction?'],
  },
];

export function findCareJourney(id: unknown): CareJourney | null {
  return CARE_JOURNEYS.find((journey) => journey.id === id) ?? null;
}
