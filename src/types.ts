export type ServiceType = string;

export interface Question {
  id: string;
  text: string;
  type: 'rating' | 'text' | 'date';
  options?: string[];
}

export interface ModuleConfig {
  id: string;
  name: string;
  questions: Question[];
  periodicity?: string;
}

export interface ProjectInfo {
  area: string;
  projectName: string;
}

export interface ClientConfig {
  id: string;
  companyName: string;
  services: ServiceType[];
  activeModules: string[];
  evaluationRange?: {
    start: string;
    end: string;
  };
  evaluationHistory?: {
    start: string;
    end: string;
  }[];
  customQuestions?: Question[];
  lastSurveyDate?: string;
  logoUrl?: string;
  logoFileId?: string;
  projects?: ProjectInfo[];
}

export interface SurveyResponse {
  id: string;
  clientId: string;
  date: string;
  evaluationRange?: {
    start: string;
    end: string;
  };
  answers: {
    questionId: string;
    value: string | number;
  }[];
}
