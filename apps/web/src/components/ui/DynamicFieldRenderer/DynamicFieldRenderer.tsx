/**
 * GLAMO - DynamicFieldRenderer Component
 * Renders segment-specific fields based on business segment
 * 
 * @version 1.0.0
 * @description Handles dynamic field rendering for different business segments (Beleza, Saúde, Pet, etc.)
 */

'use client';

import React, { ReactNode, useMemo, useCallback } from 'react';
import { cn } from '@/lib/utils';
import type { BusinessSegment } from '@/types';

// ============================================================================
// TYPES
// ============================================================================

export type SegmentFieldType =
  | 'text'
  | 'textarea'
  | 'number'
  | 'select'
  | 'multiselect'
  | 'checkbox'
  | 'checkboxGroup'
  | 'radio'
  | 'date'
  | 'scale'
  | 'boolean'
  | 'custom';

export interface SegmentFieldOption {
  value: string;
  label: string;
}

export interface SegmentFieldDefinition {
  /** Field identifier */
  id: string;
  /** Field name */
  name: string;
  /** Field label */
  label: string;
  /** Field type */
  type: SegmentFieldType;
  /** Applicable segments */
  segments: BusinessSegment[];
  /** Field options (for select/radio/checkbox) */
  options?: SegmentFieldOption[];
  /** Whether field is required */
  required?: boolean;
  /** Placeholder text */
  placeholder?: string;
  /** Helper text */
  helperText?: string;
  /** Category/section for grouping */
  category?: string;
  /** Default value */
  defaultValue?: unknown;
  /** Scale range (for scale type) */
  scaleRange?: { min: number; max: number };
  /** Rows (for textarea) */
  rows?: number;
  /** Order for display */
  order?: number;
}

export interface FieldGroup {
  title: string;
  description?: string;
  fields: SegmentFieldDefinition[];
}

export interface DynamicFieldRendererProps {
  /** Business segment */
  segment: BusinessSegment;
  /** Field values */
  values: Record<string, unknown>;
  /** Change handler */
  onChange: (name: string, value: unknown) => void;
  /** Touch handler */
  onBlur?: (name: string) => void;
  /** Errors */
  errors?: Record<string, string>;
  /** Touched fields */
  touched?: Record<string, boolean>;
  /** Whether fields are disabled */
  disabled?: boolean;
  /** Custom field definitions (override defaults) */
  customFields?: SegmentFieldDefinition[];
  /** Fields to exclude */
  excludeFields?: string[];
  /** Custom class */
  className?: string;
  /** Number of columns */
  columns?: number;
  /** Show only fields from specific category */
  category?: string;
}

export interface SegmentFieldProps {
  field: SegmentFieldDefinition;
  value: unknown;
  error?: string;
  touched?: boolean;
  disabled?: boolean;
  onChange: (value: unknown) => void;
  onBlur?: () => void;
}

// ============================================================================
// DEFAULT FIELD DEFINITIONS BY SEGMENT
// ============================================================================

export const ANAMNESIS_FIELDS: SegmentFieldDefinition[] = [
  // Beleza - Beauty
  {
    id: 'skin_type',
    name: 'skinType',
    label: 'Tipo de Pele',
    type: 'select',
    segments: ['BELEZA', 'ESTETICA'],
    options: [
      { value: 'normal', label: 'Normal' },
      { value: 'dry', label: 'Seca' },
      { value: 'oily', label: 'Oleosa' },
      { value: 'mixed', label: 'Mista' },
      { value: 'sensitive', label: 'Sensível' },
    ],
    category: 'skin',
    order: 1,
  },
  {
    id: 'hair_type',
    name: 'hairType',
    label: 'Tipo de Cabelo',
    type: 'select',
    segments: ['BELEZA'],
    options: [
      { value: 'straight', label: 'Liso' },
      { value: 'wavy', label: 'Ondulado' },
      { value: 'curly', label: 'Cacheado' },
      { value: 'coily', label: 'Crespo' },
    ],
    category: 'hair',
    order: 1,
  },
  {
    id: 'hair_condition',
    name: 'hairCondition',
    label: 'Condição do Cabelo',
    type: 'checkboxGroup',
    segments: ['BELEZA'],
    options: [
      { value: 'healthy', label: 'Saudável' },
      { value: 'dry', label: 'Ressecado' },
      { value: 'oily', label: 'Oleoso' },
      { value: 'damaged', label: 'Danificado' },
      { value: 'chemically_treated', label: 'Quimicamente Tratado' },
    ],
    category: 'hair',
    order: 2,
  },
  {
    id: 'allergies_cosmetics',
    name: 'allergiesCosmetics',
    label: 'Alergias a Cosméticos',
    type: 'textarea',
    segments: ['BELEZA', 'ESTETICA'],
    placeholder: 'Descreva alergias conhecidas...',
    category: 'health',
    rows: 2,
    order: 1,
  },

  // Estética - Aesthetics
  {
    id: 'skin_concerns',
    name: 'skinConcerns',
    label: 'Preocupações com a Pele',
    type: 'checkboxGroup',
    segments: ['ESTETICA'],
    options: [
      { value: 'acne', label: 'Acne' },
      { value: 'wrinkles', label: 'Rugas' },
      { value: 'spots', label: 'Manchas' },
      { value: 'sagging', label: 'Flacidez' },
      { value: 'cellulite', label: 'Celulite' },
      { value: 'stretch_marks', label: 'Estrias' },
    ],
    category: 'skin',
    order: 2,
  },
  {
    id: 'aesthetic_treatments',
    name: 'previousTreatments',
    label: 'Tratamentos Estéticos Anteriores',
    type: 'textarea',
    segments: ['ESTETICA'],
    placeholder: 'Liste tratamentos realizados...',
    category: 'history',
    rows: 3,
    order: 1,
  },
  {
    id: 'pacemaker',
    name: 'hasPacemaker',
    label: 'Possui marcapasso?',
    type: 'boolean',
    segments: ['ESTETICA'],
    category: 'contraindications',
    order: 1,
  },
  {
    id: 'pregnancy',
    name: 'isPregnant',
    label: 'Está grávida ou amamentando?',
    type: 'boolean',
    segments: ['ESTETICA', 'SAUDE'],
    category: 'contraindications',
    order: 2,
  },

  // Saúde - Health
  {
    id: 'medical_conditions',
    name: 'medicalConditions',
    label: 'Condições Médicas',
    type: 'checkboxGroup',
    segments: ['SAUDE', 'BEM_ESTAR'],
    options: [
      { value: 'diabetes', label: 'Diabetes' },
      { value: 'hypertension', label: 'Hipertensão' },
      { value: 'heart_disease', label: 'Doença Cardíaca' },
      { value: 'thyroid', label: 'Tireoide' },
      { value: 'arthritis', label: 'Artrite' },
      { value: 'fibromyalgia', label: 'Fibromialgia' },
    ],
    category: 'health',
    order: 1,
  },
  {
    id: 'medications',
    name: 'currentMedications',
    label: 'Medicamentos em Uso',
    type: 'textarea',
    segments: ['SAUDE', 'ESTETICA', 'BEM_ESTAR'],
    placeholder: 'Liste os medicamentos...',
    category: 'health',
    rows: 3,
    order: 2,
  },
  {
    id: 'pain_level',
    name: 'currentPainLevel',
    label: 'Nível de Dor Atual',
    type: 'scale',
    segments: ['SAUDE', 'BEM_ESTAR'],
    scaleRange: { min: 0, max: 10 },
    category: 'assessment',
    order: 1,
  },
  {
    id: 'chief_complaint',
    name: 'chiefComplaint',
    label: 'Queixa Principal',
    type: 'textarea',
    segments: ['SAUDE'],
    placeholder: 'Descreva a queixa principal...',
    required: true,
    category: 'assessment',
    rows: 3,
    order: 2,
  },

  // Bem-Estar - Wellness
  {
    id: 'stress_level',
    name: 'stressLevel',
    label: 'Nível de Estresse',
    type: 'scale',
    segments: ['BEM_ESTAR'],
    scaleRange: { min: 0, max: 10 },
    category: 'lifestyle',
    order: 1,
  },
  {
    id: 'sleep_quality',
    name: 'sleepQuality',
    label: 'Qualidade do Sono',
    type: 'select',
    segments: ['BEM_ESTAR', 'SAUDE'],
    options: [
      { value: 'excellent', label: 'Excelente' },
      { value: 'good', label: 'Boa' },
      { value: 'fair', label: 'Regular' },
      { value: 'poor', label: 'Ruim' },
      { value: 'insomnia', label: 'Insônia' },
    ],
    category: 'lifestyle',
    order: 2,
  },
  {
    id: 'physical_activity',
    name: 'physicalActivity',
    label: 'Atividade Física',
    type: 'select',
    segments: ['BEM_ESTAR', 'SAUDE', 'ESTETICA'],
    options: [
      { value: 'sedentary', label: 'Sedentário' },
      { value: 'light', label: 'Leve (1-2x/semana)' },
      { value: 'moderate', label: 'Moderada (3-4x/semana)' },
      { value: 'intense', label: 'Intensa (5+/semana)' },
    ],
    category: 'lifestyle',
    order: 3,
  },
  {
    id: 'wellness_goals',
    name: 'wellnessGoals',
    label: 'Objetivos de Bem-Estar',
    type: 'checkboxGroup',
    segments: ['BEM_ESTAR'],
    options: [
      { value: 'relax', label: 'Relaxamento' },
      { value: 'pain_relief', label: 'Alívio de Dor' },
      { value: 'energy', label: 'Mais Energia' },
      { value: 'sleep', label: 'Melhorar Sono' },
      { value: 'flexibility', label: 'Flexibilidade' },
      { value: 'posture', label: 'Correção Postural' },
    ],
    category: 'goals',
    order: 1,
  },

  // Tatuagem/Piercing
  {
    id: 'healing_issues',
    name: 'healingIssues',
    label: 'Histórico de Problemas de Cicatrização',
    type: 'boolean',
    segments: ['TATUAGEM_PIERCING'],
    category: 'health',
    order: 1,
  },
  {
    id: 'keloid_history',
    name: 'keloidHistory',
    label: 'Histórico de Quelóide',
    type: 'boolean',
    segments: ['TATUAGEM_PIERCING'],
    category: 'health',
    order: 2,
  },
  {
    id: 'blood_disorders',
    name: 'bloodDisorders',
    label: 'Distúrbios de Coagulação',
    type: 'boolean',
    segments: ['TATUAGEM_PIERCING'],
    category: 'health',
    order: 3,
  },
  {
    id: 'previous_tattoos',
    name: 'previousTattoos',
    label: 'Tatuagens Anteriores',
    type: 'textarea',
    segments: ['TATUAGEM_PIERCING'],
    placeholder: 'Descreva tatuagens/piercings anteriores e experiências...',
    category: 'history',
    rows: 2,
    order: 1,
  },

  // Pet
  {
    id: 'pet_name',
    name: 'petName',
    label: 'Nome do Pet',
    type: 'text',
    segments: ['PET'],
    required: true,
    category: 'pet_info',
    order: 1,
  },
  {
    id: 'pet_species',
    name: 'petSpecies',
    label: 'Espécie',
    type: 'select',
    segments: ['PET'],
    options: [
      { value: 'dog', label: 'Cachorro' },
      { value: 'cat', label: 'Gato' },
      { value: 'bird', label: 'Ave' },
      { value: 'rodent', label: 'Roedor' },
      { value: 'other', label: 'Outro' },
    ],
    required: true,
    category: 'pet_info',
    order: 2,
  },
  {
    id: 'pet_breed',
    name: 'petBreed',
    label: 'Raça',
    type: 'text',
    segments: ['PET'],
    category: 'pet_info',
    order: 3,
  },
  {
    id: 'pet_age',
    name: 'petAge',
    label: 'Idade',
    type: 'text',
    segments: ['PET'],
    placeholder: 'Ex: 3 anos, 6 meses',
    category: 'pet_info',
    order: 4,
  },
  {
    id: 'pet_weight',
    name: 'petWeight',
    label: 'Peso (kg)',
    type: 'number',
    segments: ['PET'],
    category: 'pet_info',
    order: 5,
  },
  {
    id: 'pet_temperament',
    name: 'petTemperament',
    label: 'Temperamento',
    type: 'select',
    segments: ['PET'],
    options: [
      { value: 'calm', label: 'Calmo' },
      { value: 'active', label: 'Ativo' },
      { value: 'anxious', label: 'Ansioso' },
      { value: 'aggressive', label: 'Agressivo (precaução)' },
    ],
    category: 'pet_info',
    order: 6,
  },
  {
    id: 'pet_allergies',
    name: 'petAllergies',
    label: 'Alergias do Pet',
    type: 'textarea',
    segments: ['PET'],
    placeholder: 'Alergias conhecidas...',
    category: 'pet_health',
    rows: 2,
    order: 1,
  },
  {
    id: 'pet_medications',
    name: 'petMedications',
    label: 'Medicamentos do Pet',
    type: 'textarea',
    segments: ['PET'],
    placeholder: 'Medicamentos em uso...',
    category: 'pet_health',
    rows: 2,
    order: 2,
  },
  {
    id: 'pet_vaccinations',
    name: 'petVaccinationsUpToDate',
    label: 'Vacinas em Dia?',
    type: 'boolean',
    segments: ['PET'],
    category: 'pet_health',
    order: 3,
  },

  // Serviços Gerais - General
  {
    id: 'general_notes',
    name: 'generalNotes',
    label: 'Observações Gerais',
    type: 'textarea',
    segments: ['SERVICOS_GERAIS', 'BELEZA', 'ESTETICA', 'SAUDE', 'BEM_ESTAR', 'TATUAGEM_PIERCING', 'PET'],
    placeholder: 'Informações adicionais...',
    category: 'general',
    rows: 3,
    order: 99,
  },
  {
    id: 'preferences',
    name: 'clientPreferences',
    label: 'Preferências do Cliente',
    type: 'textarea',
    segments: ['SERVICOS_GERAIS', 'BELEZA', 'ESTETICA', 'BEM_ESTAR'],
    placeholder: 'Preferências para atendimento...',
    category: 'general',
    rows: 2,
    order: 98,
  },
];

// ============================================================================
// FIELD COMPONENTS
// ============================================================================

function ScaleField({
  field,
  value,
  error,
  disabled,
  onChange,
}: SegmentFieldProps) {
  const range = field.scaleRange || { min: 0, max: 10 };
  const currentValue = (value as number) ?? range.min;

  return (
    <div className="space-y-2">
      <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
        <span>{range.min}</span>
        <span className="font-medium text-lg text-pink-500">{currentValue}</span>
        <span>{range.max}</span>
      </div>
      <input
        type="range"
        min={range.min}
        max={range.max}
        value={currentValue}
        disabled={disabled}
        onChange={(e) => onChange(Number(e.target.value))}
        className={cn(
          'w-full h-2 rounded-lg appearance-none cursor-pointer',
          'bg-gray-200 dark:bg-gray-700',
          'accent-pink-500',
          disabled && 'opacity-50 cursor-not-allowed'
        )}
      />
    </div>
  );
}

function CheckboxGroupField({
  field,
  value,
  error,
  disabled,
  onChange,
}: SegmentFieldProps) {
  const selectedValues = (value as string[]) || [];

  const handleToggle = (optValue: string) => {
    if (selectedValues.includes(optValue)) {
      onChange(selectedValues.filter((v) => v !== optValue));
    } else {
      onChange([...selectedValues, optValue]);
    }
  };

  return (
    <div className="space-y-2">
      {field.options?.map((option) => (
        <label
          key={option.value}
          className={cn(
            'flex items-center gap-2 cursor-pointer',
            disabled && 'opacity-50 cursor-not-allowed'
          )}
        >
          <input
            type="checkbox"
            checked={selectedValues.includes(option.value)}
            disabled={disabled}
            onChange={() => handleToggle(option.value)}
            className={cn(
              'h-4 w-4 rounded',
              'border-gray-300 dark:border-gray-600',
              'text-pink-500 focus:ring-pink-500',
              'bg-white dark:bg-gray-900'
            )}
          />
          <span className="text-sm text-gray-700 dark:text-gray-300">
            {option.label}
          </span>
        </label>
      ))}
    </div>
  );
}

function BooleanField({
  field,
  value,
  error,
  disabled,
  onChange,
}: SegmentFieldProps) {
  return (
    <div className="flex items-center gap-4">
      <label className={cn('flex items-center gap-2 cursor-pointer', disabled && 'opacity-50')}>
        <input
          type="radio"
          name={field.name}
          checked={value === true}
          disabled={disabled}
          onChange={() => onChange(true)}
          className="h-4 w-4 text-pink-500 focus:ring-pink-500"
        />
        <span className="text-sm text-gray-700 dark:text-gray-300">Sim</span>
      </label>
      <label className={cn('flex items-center gap-2 cursor-pointer', disabled && 'opacity-50')}>
        <input
          type="radio"
          name={field.name}
          checked={value === false}
          disabled={disabled}
          onChange={() => onChange(false)}
          className="h-4 w-4 text-pink-500 focus:ring-pink-500"
        />
        <span className="text-sm text-gray-700 dark:text-gray-300">Não</span>
      </label>
    </div>
  );
}

function SegmentField({
  field,
  value,
  error,
  touched,
  disabled,
  onChange,
  onBlur,
}: SegmentFieldProps) {
  const showError = touched && error;

  const renderField = () => {
    switch (field.type) {
      case 'scale':
        return (
          <ScaleField
            field={field}
            value={value}
            error={error}
            touched={touched}
            disabled={disabled}
            onChange={onChange}
            onBlur={onBlur}
          />
        );

      case 'checkboxGroup':
        return (
          <CheckboxGroupField
            field={field}
            value={value}
            error={error}
            touched={touched}
            disabled={disabled}
            onChange={onChange}
            onBlur={onBlur}
          />
        );

      case 'boolean':
        return (
          <BooleanField
            field={field}
            value={value}
            error={error}
            touched={touched}
            disabled={disabled}
            onChange={onChange}
            onBlur={onBlur}
          />
        );

      case 'select':
        return (
          <select
            id={field.name}
            name={field.name}
            value={(value as string) || ''}
            disabled={disabled}
            onChange={(e) => onChange(e.target.value)}
            onBlur={onBlur}
            className={cn(
              'w-full px-3 py-2 rounded-lg border',
              'bg-white dark:bg-gray-900',
              'text-gray-900 dark:text-gray-100',
              !showError && 'border-gray-300 dark:border-gray-600',
              !showError && 'focus:border-pink-500 focus:ring-2 focus:ring-pink-500/20',
              showError && 'border-red-500',
              disabled && 'opacity-50 cursor-not-allowed'
            )}
          >
            <option value="">{field.placeholder || 'Selecione...'}</option>
            {field.options?.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        );

      case 'textarea':
        return (
          <textarea
            id={field.name}
            name={field.name}
            value={(value as string) || ''}
            placeholder={field.placeholder}
            disabled={disabled}
            rows={field.rows || 3}
            onChange={(e) => onChange(e.target.value)}
            onBlur={onBlur}
            className={cn(
              'w-full px-3 py-2 rounded-lg border resize-none',
              'bg-white dark:bg-gray-900',
              'text-gray-900 dark:text-gray-100',
              'placeholder-gray-400 dark:placeholder-gray-500',
              !showError && 'border-gray-300 dark:border-gray-600',
              !showError && 'focus:border-pink-500 focus:ring-2 focus:ring-pink-500/20',
              showError && 'border-red-500',
              disabled && 'opacity-50 cursor-not-allowed'
            )}
          />
        );

      case 'number':
        return (
          <input
            id={field.name}
            name={field.name}
            type="number"
            value={(value as number) ?? ''}
            placeholder={field.placeholder}
            disabled={disabled}
            onChange={(e) => onChange(e.target.value ? Number(e.target.value) : undefined)}
            onBlur={onBlur}
            className={cn(
              'w-full px-3 py-2 rounded-lg border',
              'bg-white dark:bg-gray-900',
              'text-gray-900 dark:text-gray-100',
              'placeholder-gray-400 dark:placeholder-gray-500',
              !showError && 'border-gray-300 dark:border-gray-600',
              !showError && 'focus:border-pink-500 focus:ring-2 focus:ring-pink-500/20',
              showError && 'border-red-500',
              disabled && 'opacity-50 cursor-not-allowed'
            )}
          />
        );

      default:
        return (
          <input
            id={field.name}
            name={field.name}
            type="text"
            value={(value as string) || ''}
            placeholder={field.placeholder}
            disabled={disabled}
            onChange={(e) => onChange(e.target.value)}
            onBlur={onBlur}
            className={cn(
              'w-full px-3 py-2 rounded-lg border',
              'bg-white dark:bg-gray-900',
              'text-gray-900 dark:text-gray-100',
              'placeholder-gray-400 dark:placeholder-gray-500',
              !showError && 'border-gray-300 dark:border-gray-600',
              !showError && 'focus:border-pink-500 focus:ring-2 focus:ring-pink-500/20',
              showError && 'border-red-500',
              disabled && 'opacity-50 cursor-not-allowed'
            )}
          />
        );
    }
  };

  return (
    <div className="space-y-1">
      <label
        htmlFor={field.name}
        className="block text-sm font-medium text-gray-700 dark:text-gray-300"
      >
        {field.label}
        {field.required && <span className="text-red-500 ml-1">*</span>}
      </label>
      {renderField()}
      {showError ? (
        <p className="text-sm text-red-500">{error}</p>
      ) : field.helperText ? (
        <p className="text-sm text-gray-500 dark:text-gray-400">{field.helperText}</p>
      ) : null}
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function DynamicFieldRenderer({
  segment,
  values,
  onChange,
  onBlur,
  errors = {},
  touched = {},
  disabled = false,
  customFields,
  excludeFields = [],
  className,
  columns = 2,
  category: filterCategory,
}: DynamicFieldRendererProps) {
  // Get fields for this segment
  const segmentFields = useMemo(() => {
    const baseFields = customFields || ANAMNESIS_FIELDS;
    
    return baseFields
      .filter((field) => {
        // Check segment
        if (!field.segments.includes(segment)) return false;
        // Check exclusion
        if (excludeFields.includes(field.id)) return false;
        // Check category filter
        if (filterCategory && field.category !== filterCategory) return false;
        return true;
      })
      .sort((a, b) => (a.order || 0) - (b.order || 0));
  }, [segment, customFields, excludeFields, filterCategory]);

  // Group fields by category
  const groupedFields = useMemo(() => {
    const groups: Record<string, SegmentFieldDefinition[]> = {};
    
    for (const field of segmentFields) {
      const cat = field.category || 'general';
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(field);
    }

    return groups;
  }, [segmentFields]);

  // Category labels
  const categoryLabels: Record<string, string> = {
    skin: 'Pele',
    hair: 'Cabelo',
    health: 'Saúde',
    history: 'Histórico',
    contraindications: 'Contraindicações',
    assessment: 'Avaliação',
    lifestyle: 'Estilo de Vida',
    goals: 'Objetivos',
    pet_info: 'Informações do Pet',
    pet_health: 'Saúde do Pet',
    general: 'Geral',
  };

  if (segmentFields.length === 0) {
    return null;
  }

  return (
    <div className={cn('space-y-6', className)}>
      {Object.entries(groupedFields).map(([category, fields]) => (
        <div key={category} className="space-y-4">
          <h4 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
            {categoryLabels[category] || category}
          </h4>
          <div
            className={cn(
              'grid gap-4',
              columns === 1 && 'grid-cols-1',
              columns === 2 && 'grid-cols-1 md:grid-cols-2',
              columns === 3 && 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
            )}
          >
            {fields.map((field) => (
              <SegmentField
                key={field.id}
                field={field}
                value={values[field.name]}
                error={errors[field.name]}
                touched={touched[field.name]}
                disabled={disabled}
                onChange={(value) => onChange(field.name, value)}
                onBlur={onBlur ? () => onBlur(field.name) : undefined}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Get default values for a segment's anamnesis fields
 */
export function getAnamnesisDefaults(segment: BusinessSegment): Record<string, unknown> {
  const fields = ANAMNESIS_FIELDS.filter((f) => f.segments.includes(segment));
  const defaults: Record<string, unknown> = {};
  
  for (const field of fields) {
    if (field.defaultValue !== undefined) {
      defaults[field.name] = field.defaultValue;
    } else if (field.type === 'checkboxGroup' || field.type === 'multiselect') {
      defaults[field.name] = [];
    }
  }
  
  return defaults;
}

/**
 * Get field definitions for a specific segment
 */
export function getFieldsForSegment(segment: BusinessSegment): SegmentFieldDefinition[] {
  return ANAMNESIS_FIELDS
    .filter((f) => f.segments.includes(segment))
    .sort((a, b) => (a.order || 0) - (b.order || 0));
}

/**
 * Validate segment-specific fields
 */
export function validateSegmentFields(
  segment: BusinessSegment,
  values: Record<string, unknown>
): Record<string, string> {
  const errors: Record<string, string> = {};
  const fields = getFieldsForSegment(segment);
  
  for (const field of fields) {
    if (field.required) {
      const value = values[field.name];
      if (value === undefined || value === null || value === '') {
        errors[field.name] = `${field.label} é obrigatório`;
      } else if (Array.isArray(value) && value.length === 0) {
        errors[field.name] = `Selecione pelo menos uma opção`;
      }
    }
  }
  
  return errors;
}

export default DynamicFieldRenderer;
