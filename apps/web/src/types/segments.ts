/**
 * GLAMO - Business Segment Types
 * Segment-specific field definitions for multi-business support
 * 
 * @version 1.0.0
 * @description Supports: Beauty, Aesthetics, Health, Wellness, Tattoo/Piercing, Pet, General
 */

import { UUID, ISODate, Decimal } from './base';

// ============================================================================
// SEGMENT: BEAUTY (Salões de Beleza)
// ============================================================================

/** Hair type classification */
export type HairType = 'straight' | 'wavy' | 'curly' | 'coily';

/** Hair texture */
export type HairTexture = 'fine' | 'medium' | 'thick';

/** Scalp condition */
export type ScalpCondition = 'normal' | 'dry' | 'oily' | 'sensitive' | 'dandruff';

/** Beauty segment customer fields */
export interface BeautyCustomerFields {
  hairType?: HairType;
  hairTexture?: HairTexture;
  hairColor?: string;
  naturalHairColor?: string;
  scalpCondition?: ScalpCondition;
  hairLength?: 'short' | 'medium' | 'long' | 'very_long';
  lastColorFormula?: string;
  lastColorDate?: ISODate;
  previousChemicalTreatments?: {
    type: string;
    date: ISODate;
    notes?: string;
  }[];
  allergies?: string[];
  preferredProducts?: string[];
}

/** Beauty segment service fields */
export interface BeautyServiceFields {
  requiresTest?: boolean; // Patch test for chemicals
  testValidityDays?: number;
  chemicalCategory?: 'none' | 'low' | 'medium' | 'high';
  hairLengthPricing?: {
    short: Decimal;
    medium: Decimal;
    long: Decimal;
    veryLong: Decimal;
  };
}

// ============================================================================
// SEGMENT: AESTHETICS (Clínicas de Estética)
// ============================================================================

/** Skin type classification */
export type SkinType = 'normal' | 'dry' | 'oily' | 'combination' | 'sensitive';

/** Fitzpatrick skin phototype */
export type SkinPhototype = 'I' | 'II' | 'III' | 'IV' | 'V' | 'VI';

/** Aesthetics segment customer fields */
export interface AestheticsCustomerFields {
  skinType?: SkinType;
  skinPhototype?: SkinPhototype;
  skinConcerns?: string[];
  allergies?: string[];
  currentSkincare?: string;
  sunExposure?: 'low' | 'moderate' | 'high';
  smokingStatus?: 'never' | 'former' | 'current';
  medications?: string[];
  previousTreatments?: {
    type: string;
    date: ISODate;
    location: string;
    results?: string;
  }[];
  contraindications?: string[];
  pregnancyStatus?: 'not_pregnant' | 'pregnant' | 'breastfeeding' | 'trying';
  menstrualCycleInfo?: string;
}

/** Aesthetics segment service fields */
export interface AestheticsServiceFields {
  requiresConsultation?: boolean;
  consultationDurationMinutes?: number;
  contraindications?: string[];
  postCareInstructions?: string;
  sessionCount?: number; // Number of sessions for protocols
  intervalDays?: number; // Days between sessions
  requiredEquipment?: string[];
  requiresNursing?: boolean;
  requiresDoctor?: boolean;
}

// ============================================================================
// SEGMENT: HEALTH (Clínicas de Saúde)
// ============================================================================

/** Blood type */
export type BloodType = 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-';

/** Health segment customer fields (Patient) */
export interface HealthCustomerFields {
  // Insurance
  healthInsurance?: string;
  insuranceNumber?: string;
  insuranceValidity?: ISODate;
  
  // Medical
  bloodType?: BloodType;
  height?: number; // cm
  weight?: number; // kg
  allergies?: string[];
  medications?: {
    name: string;
    dosage: string;
    frequency: string;
    startDate?: ISODate;
  }[];
  chronicConditions?: string[];
  surgicalHistory?: {
    procedure: string;
    date: ISODate;
    hospital?: string;
  }[];
  familyHistory?: string[];
  
  // Emergency
  emergencyContact: {
    name: string;
    phone: string;
    relationship: string;
  };
  
  // Professional
  primaryPhysician?: {
    name: string;
    specialty: string;
    phone?: string;
    crm?: string;
  };
}

/** Health segment service fields */
export interface HealthServiceFields {
  requiresPrescription?: boolean;
  requiresFasting?: boolean;
  fastingHours?: number;
  cid10Codes?: string[];
  tussCode?: string;
  procedureCode?: string;
  coverageType?: 'private' | 'insurance' | 'both';
  requiredDocuments?: string[];
  preInstructions?: string;
  postInstructions?: string;
}

// ============================================================================
// SEGMENT: WELLNESS (Spas e Bem-Estar)
// ============================================================================

/** Wellness segment customer fields */
export interface WellnessCustomerFields {
  fitnessLevel?: 'beginner' | 'intermediate' | 'advanced';
  preferredActivities?: string[];
  healthGoals?: string[];
  stressLevel?: 'low' | 'moderate' | 'high';
  sleepQuality?: 'poor' | 'fair' | 'good' | 'excellent';
  dietaryRestrictions?: string[];
  allergies?: string[];
  injuries?: string[];
  bloodPressure?: {
    systolic: number;
    diastolic: number;
    lastMeasured: ISODate;
  };
  pregnancyStatus?: 'not_pregnant' | 'pregnant' | 'postpartum';
  contraindications?: string[];
  aromatherapyPreferences?: string[];
  massagePressure?: 'light' | 'medium' | 'firm' | 'deep';
}

/** Wellness segment service fields */
export interface WellnessServiceFields {
  contraindications?: string[];
  ambiance?: string[];
  includesAmenities?: string[];
  aromatherapyOptions?: string[];
  musicOptions?: string[];
  temperaturePreference?: 'warm' | 'neutral' | 'cool';
}

// ============================================================================
// SEGMENT: TATTOO/PIERCING
// ============================================================================

/** Tattoo/Piercing segment customer fields */
export interface TattooCustomerFields {
  existingTattoos?: {
    location: string;
    size: string;
    date?: ISODate;
    artist?: string;
  }[];
  existingPiercings?: {
    location: string;
    date?: ISODate;
    jewelry?: string;
  }[];
  allergies?: string[];
  metalAllergies?: string[];
  skinConditions?: string[];
  healingHistory?: 'excellent' | 'good' | 'fair' | 'poor';
  bloodThinnersUse?: boolean;
  diabetic?: boolean;
  immunocompromised?: boolean;
  pregnancyStatus?: 'not_pregnant' | 'pregnant' | 'breastfeeding';
  ageVerified?: boolean;
  idType?: string;
  idNumber?: string;
  portfolioConsent?: boolean;
  photographyConsent?: boolean;
}

/** Tattoo/Piercing segment service fields */
export interface TattooServiceFields {
  category?: 'tattoo' | 'piercing' | 'cover_up' | 'touch_up' | 'removal';
  bodyPart?: string;
  estimatedSize?: string;
  style?: string;
  needleTypes?: string[];
  inkColors?: string[];
  jewelryOptions?: {
    material: string;
    gauge: string;
    price: Decimal;
  }[];
  healingTime?: string;
  aftercareInstructions?: string;
  minimumAge?: number;
  requiresDeposit?: boolean;
  depositAmount?: Decimal;
}

// ============================================================================
// SEGMENT: PET (Pet Shops e Veterinárias)
// ============================================================================

/** Pet species */
export type PetSpecies = 'dog' | 'cat' | 'bird' | 'rabbit' | 'hamster' | 'fish' | 'reptile' | 'other';

/** Pet size */
export type PetSize = 'tiny' | 'small' | 'medium' | 'large' | 'giant';

/** Pet coat type */
export type PetCoatType = 'short' | 'medium' | 'long' | 'wire' | 'curly' | 'hairless' | 'double';

/** Pet (the animal) fields */
export interface PetFields {
  name: string;
  species: PetSpecies;
  breed?: string;
  size: PetSize;
  birthDate?: ISODate;
  gender: 'male' | 'female' | 'unknown';
  weight?: number; // kg
  coatType?: PetCoatType;
  coatColor?: string;
  microchipNumber?: string;
  registrationNumber?: string;
  neutered?: boolean;
  temperament?: 'calm' | 'friendly' | 'nervous' | 'aggressive' | 'shy';
  allergies?: string[];
  medications?: {
    name: string;
    dosage: string;
    frequency: string;
  }[];
  specialNeeds?: string;
  dietaryRestrictions?: string[];
  preferredFood?: string;
  vaccinations?: {
    name: string;
    date: ISODate;
    expiryDate?: ISODate;
    veterinarian?: string;
  }[];
  medicalHistory?: {
    condition: string;
    date: ISODate;
    treatment?: string;
    resolved: boolean;
  }[];
  photo?: string;
}

/** Pet segment customer fields (Pet Owner) */
export interface PetCustomerFields {
  pets: PetFields[];
  preferredVeterinarian?: {
    name: string;
    clinic: string;
    phone: string;
    crmv?: string;
  };
  emergencyAuthorization?: boolean;
  pickupAuthorizedPersons?: {
    name: string;
    phone: string;
    relationship: string;
    idNumber?: string;
  }[];
}

/** Pet segment service fields */
export interface PetServiceFields {
  applicableSpecies?: PetSpecies[];
  applicableSizes?: PetSize[];
  sizeBasedPricing?: {
    size: PetSize;
    price: Decimal;
    duration: number;
  }[];
  requiresVaccination?: string[];
  vaccinationValidityDays?: number;
  coatTypeApplicable?: PetCoatType[];
  ageRestrictions?: {
    minMonths?: number;
    maxYears?: number;
  };
  specialEquipment?: string[];
  includesProducts?: string[];
}

// ============================================================================
// SEGMENT: GENERAL (Serviços Gerais)
// ============================================================================

/** General segment uses only dynamic custom fields */
export interface GeneralCustomerFields {
  // Uses only custom fields defined by tenant
  customFields: Record<string, unknown>;
}

/** General segment service fields */
export interface GeneralServiceFields {
  // Uses only custom fields defined by tenant
  customFields: Record<string, unknown>;
}

// ============================================================================
// UNIFIED SEGMENT FIELDS TYPE
// ============================================================================

/** All customer segment fields */
export type SegmentCustomerFields = 
  | BeautyCustomerFields
  | AestheticsCustomerFields
  | HealthCustomerFields
  | WellnessCustomerFields
  | TattooCustomerFields
  | PetCustomerFields
  | GeneralCustomerFields;

/** All service segment fields */
export type SegmentServiceFields =
  | BeautyServiceFields
  | AestheticsServiceFields
  | HealthServiceFields
  | WellnessServiceFields
  | TattooServiceFields
  | PetServiceFields
  | GeneralServiceFields;

// ============================================================================
// SEGMENT CONFIGURATION
// ============================================================================

/** Segment display configuration */
export interface SegmentConfig {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  customerFieldsSchema: Record<string, unknown>;
  serviceFieldsSchema: Record<string, unknown>;
  professionalFieldsSchema: Record<string, unknown>;
  defaultCategories: string[];
  requiredAnamnesis: string[];
  features: {
    pets: boolean;
    medicalRecords: boolean;
    prescriptions: boolean;
    insurance: boolean;
    portfolio: boolean;
    beforeAfter: boolean;
  };
}

/** Segment configurations map */
export const SEGMENT_CONFIGS: Record<string, SegmentConfig> = {
  beauty: {
    id: 'beauty',
    name: 'Beleza',
    description: 'Salões de beleza, barbearias, nail designers',
    icon: 'Scissors',
    color: '#FF69B4',
    customerFieldsSchema: {},
    serviceFieldsSchema: {},
    professionalFieldsSchema: {},
    defaultCategories: ['Cabelo', 'Unhas', 'Maquiagem', 'Sobrancelhas', 'Barba'],
    requiredAnamnesis: ['hair'],
    features: {
      pets: false,
      medicalRecords: false,
      prescriptions: false,
      insurance: false,
      portfolio: true,
      beforeAfter: true,
    },
  },
  aesthetics: {
    id: 'aesthetics',
    name: 'Estética',
    description: 'Clínicas de estética, dermatologia cosmética',
    icon: 'Sparkles',
    color: '#9B59B6',
    customerFieldsSchema: {},
    serviceFieldsSchema: {},
    professionalFieldsSchema: {},
    defaultCategories: ['Facial', 'Corporal', 'Laser', 'Injetáveis', 'Peelings'],
    requiredAnamnesis: ['skin', 'health'],
    features: {
      pets: false,
      medicalRecords: true,
      prescriptions: false,
      insurance: false,
      portfolio: true,
      beforeAfter: true,
    },
  },
  health: {
    id: 'health',
    name: 'Saúde',
    description: 'Clínicas médicas, consultórios, fisioterapia',
    icon: 'Heart',
    color: '#E74C3C',
    customerFieldsSchema: {},
    serviceFieldsSchema: {},
    professionalFieldsSchema: {},
    defaultCategories: ['Consultas', 'Exames', 'Procedimentos', 'Terapias', 'Retornos'],
    requiredAnamnesis: ['health', 'medications', 'allergies'],
    features: {
      pets: false,
      medicalRecords: true,
      prescriptions: true,
      insurance: true,
      portfolio: false,
      beforeAfter: false,
    },
  },
  wellness: {
    id: 'wellness',
    name: 'Bem-Estar',
    description: 'Spas, massoterapia, yoga, meditação',
    icon: 'Flower2',
    color: '#27AE60',
    customerFieldsSchema: {},
    serviceFieldsSchema: {},
    professionalFieldsSchema: {},
    defaultCategories: ['Massagens', 'Terapias', 'Meditação', 'Yoga', 'Day Spa'],
    requiredAnamnesis: ['wellness', 'health'],
    features: {
      pets: false,
      medicalRecords: false,
      prescriptions: false,
      insurance: false,
      portfolio: true,
      beforeAfter: false,
    },
  },
  tattoo: {
    id: 'tattoo',
    name: 'Tatuagem & Piercing',
    description: 'Estúdios de tatuagem, piercing, body art',
    icon: 'Palette',
    color: '#2C3E50',
    customerFieldsSchema: {},
    serviceFieldsSchema: {},
    professionalFieldsSchema: {},
    defaultCategories: ['Tatuagem', 'Piercing', 'Cover-up', 'Retoque', 'Remoção'],
    requiredAnamnesis: ['tattoo', 'health'],
    features: {
      pets: false,
      medicalRecords: false,
      prescriptions: false,
      insurance: false,
      portfolio: true,
      beforeAfter: true,
    },
  },
  pet: {
    id: 'pet',
    name: 'Pet',
    description: 'Pet shops, veterinárias, banho e tosa',
    icon: 'Dog',
    color: '#F39C12',
    customerFieldsSchema: {},
    serviceFieldsSchema: {},
    professionalFieldsSchema: {},
    defaultCategories: ['Banho', 'Tosa', 'Consulta', 'Vacinas', 'Hospedagem'],
    requiredAnamnesis: ['pet'],
    features: {
      pets: true,
      medicalRecords: true,
      prescriptions: true,
      insurance: false,
      portfolio: true,
      beforeAfter: true,
    },
  },
  general: {
    id: 'general',
    name: 'Serviços Gerais',
    description: 'Outros tipos de serviços',
    icon: 'Briefcase',
    color: '#3498DB',
    customerFieldsSchema: {},
    serviceFieldsSchema: {},
    professionalFieldsSchema: {},
    defaultCategories: ['Serviços', 'Consultorias', 'Outros'],
    requiredAnamnesis: [],
    features: {
      pets: false,
      medicalRecords: false,
      prescriptions: false,
      insurance: false,
      portfolio: false,
      beforeAfter: false,
    },
  },
};
