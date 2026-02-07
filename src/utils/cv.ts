import cvData from '../data/cv.json';

export interface Experience {
  role: string;
  company: string;
  start: string;
  end: string | null;
  highlights: string[];
}

export interface Education {
  institution: string;
  degree: string;
  start: string;
  end: string;
}

export interface Certification {
  year: number;
  name: string;
  issuer: string;
}

export interface CVData {
  name: string;
  location: string;
  email: string;
  github: string;
  linkedin: string;
  summary: string;
  experience: Experience[];
  education: Education[];
  skills: Record<string, string>;
  certifications: Certification[];
  languages: { language: string; level: string }[];
}

export function loadCV(): CVData {
  return cvData as CVData;
}

export function getExperienceSorted(): Experience[] {
  return [...cvData.experience].sort((a, b) => {
    return new Date(b.start).getTime() - new Date(a.start).getTime();
  });
}

export function getEducationSorted(): Education[] {
  return [...cvData.education].sort((a, b) => {
    return new Date(b.start).getTime() - new Date(a.start).getTime();
  });
}

export function formatDateRange(start: string, end: string | null): string {
  const formatDate = (d: string) => {
    const date = new Date(d);
    return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  };
  return `${formatDate(start)} — ${end ? formatDate(end) : 'Present'}`;
}
