export type CvWeakness = {
  weakness: string;
  howToAddress: string;
};

export type PrepData = {
  summary: string;
  keywords: string[];
  location: string | null;
  website: string | null;
  company: {
    name: string | null;
    summary: string;
  };
  expectations: string;
  technicalQuestions: string[];
  behavioralQuestions: string[];
  questionsToAsk: string[];
  cvWeaknesses: CvWeakness[];
};