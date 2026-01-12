export interface IgnitionState {
  phase: number;
  choiceHistory: Choice[];
  hiddenMetrics: HiddenMetrics;
  isLocked: boolean;
  revelationTriggered: boolean;
  startTimestamp: number;
}

export interface Choice {
  phaseId: string;
  optionSelected: string;
  predictedOption: string;
  timestamp: number;
  hesitationMs: number;
  wasCorrectPrediction: boolean;
}

export interface HiddenMetrics {
  predictedOutcomeHash: string;
  emotionalComplianceIndex: number;
  observationDrift: number;
  resistanceAttempts: number;
  patternDeviation: number;
}

export interface PhaseData {
  id: string;
  type: 'narrative' | 'choice' | 'revelation' | 'final';
  content: ContentBlock[];
  choices?: ChoiceOption[];
  systemMessages?: string[];
  delay?: number;
}

export interface ContentBlock {
  type: 'text' | 'system' | 'redacted' | 'warning' | 'anomaly' | 'hollow';
  content: string;
  delay?: number;
  glitch?: boolean;
}

export interface ChoiceOption {
  id: string;
  label: string;
  predictedId: string;
  convergenceText: string;
}

export type PhaseId = 
  | 'initialization'
  | 'briefing'
  | 'observation_1'
  | 'observation_2'
  | 'observation_3'
  | 'deviation_test'
  | 'revelation'
  | 'final';
