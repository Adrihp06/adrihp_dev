import cvData from '../data/cv.json';

export interface CVItem {
  role: string;
  company: string;
  date: string;
  description: string;
}

export async function getCV(): Promise<CVItem[]> {
  return cvData;
}
