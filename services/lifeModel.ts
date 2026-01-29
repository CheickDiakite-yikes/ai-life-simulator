import { CareerStatus, EducationStatus, LifeStage, OpportunitySystems, RelationshipStatus } from '../types';

const clamp = (value: number): number => Math.max(0, Math.min(100, Math.round(value)));

export const getLifeStage = (age: number): LifeStage => {
  if (age <= 1) return 'Infancy';
  if (age <= 12) return 'Childhood';
  if (age <= 18) return 'Adolescence';
  if (age <= 35) return 'YoungAdult';
  if (age <= 60) return 'Midlife';
  return 'Elderhood';
};

export const normalizeSystems = (systems?: OpportunitySystems): OpportunitySystems => {
  return {
    healthcareAccess: clamp(systems?.healthcareAccess ?? 50),
    schoolQuality: clamp(systems?.schoolQuality ?? 50),
    laborMarket: clamp(systems?.laborMarket ?? 50),
    safety: clamp(systems?.safety ?? 50),
    discrimination: clamp(systems?.discrimination ?? 30),
    socialCapital: clamp(systems?.socialCapital ?? 50),
    migrationPolicy: clamp(systems?.migrationPolicy ?? 50),
    housingStability: clamp(systems?.housingStability ?? 50)
  };
};

export const normalizeEducation = (education?: EducationStatus, age?: number): EducationStatus => {
  const stage = getLifeStage(age ?? 0);
  if (!education) {
    return {
      level: stage === 'YoungAdult' || stage === 'Midlife' || stage === 'Elderhood' ? 'Secondary' : 'Primary',
      enrolled: stage === 'Childhood' || stage === 'Adolescence'
    };
  }

  if (age !== undefined && age < 5) {
    return { ...education, level: 'None', enrolled: false };
  }

  return {
    level: education.level || 'Primary',
    enrolled: education.enrolled ?? (stage === 'Childhood' || stage === 'Adolescence')
  };
};

export const normalizeCareer = (career?: CareerStatus, age?: number): CareerStatus => {
  const stage = getLifeStage(age ?? 0);
  if (!career) {
    if (stage === 'Childhood' || stage === 'Adolescence') {
      return { status: 'Student', stability: 40 };
    }
    if (stage === 'Elderhood') {
      return { status: 'Retired', stability: 60 };
    }
    return { status: 'Unemployed', stability: 40 };
  }

  if (age !== undefined && age < 14) {
    return { status: 'Student', stability: career.stability ?? 40 };
  }

  return {
    status: career.status || 'Unemployed',
    sector: career.sector,
    stability: career.stability ? clamp(career.stability) : career.stability
  };
};

export const normalizeRelationship = (relationship?: RelationshipStatus, age?: number): RelationshipStatus => {
  const stage = getLifeStage(age ?? 0);
  if (!relationship) {
    if (stage === 'Childhood' || stage === 'Adolescence') {
      return { status: 'Single', dependents: 0, caregiverLoad: 10 };
    }
    return { status: 'Single', dependents: 0, caregiverLoad: 20 };
  }

  if (age !== undefined && age < 16) {
    return { status: 'Single', dependents: 0, caregiverLoad: relationship.caregiverLoad ?? 10 };
  }

  return {
    status: relationship.status || 'Single',
    dependents: relationship.dependents ?? 0,
    caregiverLoad: relationship.caregiverLoad ? clamp(relationship.caregiverLoad) : relationship.caregiverLoad
  };
};
