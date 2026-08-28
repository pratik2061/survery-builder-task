export type QuestionType = 'text' | 'single' | 'multiple' | 'rating';

export interface ConditionalLogic {
  dependsOnId: string;
  equalsValue: string;
}

export interface Question {
  id: string;
  type: QuestionType;
  text: string;
  required: boolean;
  options?: string[];
  conditionalLogic?: ConditionalLogic;
}

export interface Survey {
  id: string;
  title: string;
  description?: string;
  questions: Question[];
  createdAt: string;
  updatedAt: string;
}

export interface Response {
  id: string;
  surveyId: string;
  answers: Record<string, any>;
  createdAt: string;
}
