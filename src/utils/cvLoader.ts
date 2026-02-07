import cvData from '../data/cv.json';

export interface CVItem {
  role: string;
  company: string;
  date: string;
  description: string;
}

export interface EducationItem {
  degree: string;
  institution: string;
  date: string;
  location: string;
}

export interface ProjectItem {
  name: string;
  description: string;
}

export interface CV {
  experience: CVItem[];
  education: EducationItem[];
  projects: ProjectItem[];
  certifications: string[];
  languages: string[];
}

export async function getCV(): Promise<CV> {
  return cvData;
}
