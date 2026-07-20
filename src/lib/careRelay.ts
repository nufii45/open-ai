import type { CareJourney, CareJourneyId } from './careJourneys';
import type { RelayAudience, RelayLanguage } from './careBrief';

export type CareRelayDraft = {
  audience: RelayAudience;
  language: RelayLanguage;
  clinicVisit: 'new' | 'follow-up';
  clinicReason:
    'new concern' | 'follow-up concern' | 'results discussion' | 'paperwork or referral';
  hasLaboratoryRequest: boolean;
  laboratoryRelease: 'ask at the laboratory' | 'collect in person' | 'send to my clinic';
  dischargeSupport: 'I am leaving on my own' | 'A family member or caregiver is helping';
  paperworkHolder: 'I will keep the paperwork' | 'My helper will keep the paperwork';
  followUpStatus: 'I will confirm the follow-up details' | 'I have the follow-up details';
};

export const CARE_RELAY_STORAGE_KEY = 'healthbridge:care-relay.v1';

export const CARE_RELAY_PRIVACY_NOTICE =
  'HealthBridge keeps this relay on this device. Do not enter names, IDs, prescription images, laboratory results, or other personal documents.';

export const CARE_RELAY_SAFETY_LIMITS =
  'HealthBridge cannot diagnose, interpret laboratory results, decide whether care is urgent, prescribe, or tell you to change treatment.';

export const DEFAULT_CARE_RELAY_DRAFT: CareRelayDraft = {
  audience: 'self',
  language: 'en',
  clinicVisit: 'new',
  clinicReason: 'new concern',
  hasLaboratoryRequest: false,
  laboratoryRelease: 'ask at the laboratory',
  dischargeSupport: 'I am leaving on my own',
  paperworkHolder: 'I will keep the paperwork',
  followUpStatus: 'I will confirm the follow-up details',
};

const FILIPINO_QUESTIONS: Record<Exclude<CareJourneyId, 'pharmacy'>, readonly string[]> = {
  clinic: [
    'Ano ang pinakamahalagang susunod na hakbang pagkatapos ng pagbisitang ito?',
    'Ano ang kailangan kong isulat o dalhin bago ako umalis?',
    'Sino ang maaari kong kontakin kung kailangan ko ng paglilinaw?',
  ],
  laboratory: [
    'Maaari po bang kumpirmahin ang paghahandang kailangan para sa test na ito?',
    'Kailan at paano magiging available ang resulta?',
    'Sino ang dapat magpaliwanag ng resulta o susunod na hakbang?',
  ],
  discharge: [
    'Ano ang pinakamahalagang dapat kong maintindihan bago umalis?',
    'Kailan at saan ang follow-up, at sino ang kokontakin kung may paglilinaw?',
    'Aling mga papel at tagubilin ang dapat kong dalhin o itabi?',
  ],
};

export function careRelayQuestions(
  journey: CareJourney,
  language: RelayLanguage,
): readonly string[] {
  if (language === 'fil' && journey.id !== 'pharmacy') return FILIPINO_QUESTIONS[journey.id];
  if (journey.id === 'discharge') {
    return [
      'What is the most important instruction to understand before I leave?',
      'When and where is the follow-up, and who should I contact for clarification?',
      'Which papers and instructions should I keep together?',
    ];
  }
  return journey.questions;
}

export function careRelayOpeningLine(journey: CareJourney, draft: CareRelayDraft): string {
  const helping = draft.audience === 'caregiver';
  if (draft.language === 'fil') {
    if (journey.id === 'clinic')
      return helping
        ? 'Magandang araw po. Tinutulungan ko po ang isang kapamilya para sa appointment. Maaari po ba nating kumpirmahin ang pinakamahalagang dapat naming pag-usapan?'
        : 'Magandang araw po. Para sa appointment ko, maaari po ba nating kumpirmahin ang pinakamahalagang dapat kong pag-usapan?';
    if (journey.id === 'laboratory')
      return helping
        ? 'Magandang araw po. Tinutulungan ko po ang isang kapamilya para sa laboratory visit. Maaari po ba nating kumpirmahin ang mga kailangang ihanda?'
        : 'Magandang araw po. Para sa laboratory visit ko, maaari po ba nating kumpirmahin ang mga kailangang ihanda?';
    return helping
      ? 'Magandang araw po. Tinutulungan ko po ang isang kapamilya bago umalis ng ospital. Ano po ang pinakamahalagang dapat naming kumpirmahin?'
      : 'Magandang araw po. Bago ako umalis ng ospital, ano po ang pinakamahalagang dapat kong kumpirmahin?';
  }
  const person = helping ? 'a family member' : 'myself';
  if (journey.id === 'clinic')
    return `Hello. I am preparing a ${draft.clinicVisit} clinic visit for ${person}. Could we confirm the most important things to discuss today?`;
  if (journey.id === 'laboratory')
    return `Hello. I am preparing a laboratory visit for ${person}. Could you help us confirm the preparation and result-release details?`;
  return `Hello. I am preparing to leave the hospital with ${person}. Could we confirm the most important instructions and follow-up details before leaving?`;
}

export function careRelayChecklist(journey: CareJourney, draft: CareRelayDraft): readonly string[] {
  const shared = [...journey.preparation];
  if (journey.id === 'clinic') {
    return [
      ...shared,
      `Visit type: ${draft.clinicVisit === 'new' ? 'new appointment' : 'follow-up appointment'}.`,
      `Focus: ${draft.clinicReason}.`,
    ];
  }
  if (journey.id === 'laboratory') {
    return [
      `Test request or order: ${draft.hasLaboratoryRequest ? 'ready to bring' : 'confirm with the laboratory first'}.`,
      ...shared,
      `Results plan: ${draft.laboratoryRelease}.`,
    ];
  }
  return [
    ...shared,
    `Support: ${draft.dischargeSupport}.`,
    `Paperwork: ${draft.paperworkHolder}.`,
    `Follow-up: ${draft.followUpStatus}.`,
  ];
}

export function readCareRelayDraft(value: unknown): CareRelayDraft {
  if (!value || typeof value !== 'object') return DEFAULT_CARE_RELAY_DRAFT;
  const candidate = value as Partial<CareRelayDraft>;
  return {
    audience: candidate.audience === 'caregiver' ? 'caregiver' : 'self',
    language: candidate.language === 'fil' ? 'fil' : 'en',
    clinicVisit: candidate.clinicVisit === 'follow-up' ? 'follow-up' : 'new',
    clinicReason:
      candidate.clinicReason === 'follow-up concern' ||
      candidate.clinicReason === 'results discussion' ||
      candidate.clinicReason === 'paperwork or referral'
        ? candidate.clinicReason
        : 'new concern',
    hasLaboratoryRequest: candidate.hasLaboratoryRequest === true,
    laboratoryRelease:
      candidate.laboratoryRelease === 'collect in person' ||
      candidate.laboratoryRelease === 'send to my clinic'
        ? candidate.laboratoryRelease
        : 'ask at the laboratory',
    dischargeSupport:
      candidate.dischargeSupport === 'A family member or caregiver is helping'
        ? candidate.dischargeSupport
        : 'I am leaving on my own',
    paperworkHolder:
      candidate.paperworkHolder === 'My helper will keep the paperwork'
        ? candidate.paperworkHolder
        : 'I will keep the paperwork',
    followUpStatus:
      candidate.followUpStatus === 'I have the follow-up details'
        ? candidate.followUpStatus
        : 'I will confirm the follow-up details',
  };
}
