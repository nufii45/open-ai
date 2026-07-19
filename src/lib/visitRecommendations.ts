import type { CareJourneyId } from '@/lib/careJourneys';

export type VisitRecommendation = {
  id: string;
  label: string;
  title: string;
  description: string;
  actions: readonly string[];
  question: string;
};

export const VISIT_RECOMMENDATIONS: Partial<Record<CareJourneyId, readonly VisitRecommendation[]>> =
  {
    clinic: [
      {
        id: 'appointment-ready',
        label: 'Before the appointment',
        title: 'Arrive with a short, focused agenda',
        description:
          'Keep the conversation practical so it is easier to cover what matters to you.',
        actions: [
          'Confirm the appointment time, clinic location, and any check-in requirement.',
          'Write down up to three things you want clarified during the visit.',
          'Bring documents only when the clinic asked you to bring them.',
        ],
        question: 'What is the most important thing for me to understand before I leave today?',
      },
      {
        id: 'after-appointment',
        label: 'Before you leave',
        title: 'Leave with a clear follow-up path',
        description:
          'Turn instructions into a practical next conversation, not a self-directed plan.',
        actions: [
          'Ask which instruction should be followed first.',
          'Confirm when and where any follow-up is arranged.',
          'Ask who to contact if an instruction is unclear later.',
        ],
        question: 'Who should I contact if I need an instruction clarified after this appointment?',
      },
    ],
    laboratory: [
      {
        id: 'lab-ready',
        label: 'Before the laboratory',
        title: 'Confirm preparation with the laboratory',
        description:
          'Preparation can vary by test, so the laboratory is the source to confirm it with.',
        actions: [
          'Keep the test request and a valid ID together.',
          'Confirm any preparation requirements directly with the laboratory.',
          'Ask what time you should arrive and how long the process may take.',
        ],
        question: 'Can you confirm the preparation requirements for the test on my request?',
      },
      {
        id: 'lab-results',
        label: 'Getting results',
        title: 'Know the result handoff before you go',
        description: 'A clear release plan helps you avoid guessing about what happens next.',
        actions: [
          'Ask when and how the result will be released.',
          'Confirm who should receive or explain the result.',
          'Keep the release reference or contact details if they provide one.',
        ],
        question: 'When and how will my results be available, and who should explain them to me?',
      },
    ],
    discharge: [
      {
        id: 'leave-ready',
        label: 'Before leaving',
        title: 'Use the care team to clarify the handoff',
        description:
          'This is about understanding the instructions you were given, not changing them on your own.',
        actions: [
          'Keep the discharge papers and contact information together.',
          'Ask the care team to explain any instruction you do not understand.',
          'Confirm which contact is appropriate for non-emergency questions.',
        ],
        question: 'What should I make sure I understand before I leave today?',
      },
      {
        id: 'follow-up-ready',
        label: 'Follow-up plan',
        title: 'Leave with one clear next contact',
        description:
          'A simple follow-up path helps caregivers support the handoff without guessing.',
        actions: [
          'Confirm any planned follow-up date, location, or contact method.',
          'Write down who to call if a non-emergency instruction is unclear.',
          'Share the practical handoff card with the caregiver if needed.',
        ],
        question: 'When is my follow-up, and who should I contact if I need clarification?',
      },
    ],
  };
