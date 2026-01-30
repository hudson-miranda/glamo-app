/**
 * Operadores para regras de segmentação
 */
export type SegmentOperator =
  | 'eq'      // igual
  | 'neq'     // diferente
  | 'gt'      // maior que
  | 'gte'     // maior ou igual
  | 'lt'      // menor que
  | 'lte'     // menor ou igual
  | 'in'      // está em (array)
  | 'nin'     // não está em (array)
  | 'contains' // contém (string/array)
  | 'startsWith'
  | 'endsWith'
  | 'between' // entre dois valores
  | 'isNull'
  | 'isNotNull';

/**
 * Valor especial para datas relativas
 */
export type RelativeDateValue =
  | 'today'
  | 'yesterday'
  | 'last7days'
  | 'last30days'
  | 'last60days'
  | 'last90days'
  | 'last120days'
  | 'thisMonth'
  | 'lastMonth'
  | 'thisYear';

/**
 * Regra individual de segmentação
 */
export interface SegmentRule {
  field: string;
  operator: SegmentOperator;
  value: any;
}

/**
 * Grupo de regras (AND)
 */
export interface SegmentRuleGroup {
  operator: 'AND' | 'OR';
  rules: (SegmentRule | SegmentRuleGroup)[];
}

/**
 * Tipo de segmento
 */
export enum SegmentType {
  AUTOMATIC = 'AUTOMATIC',  // Calculado automaticamente
  MANUAL = 'MANUAL',        // Clientes adicionados manualmente
  SMART = 'SMART',          // Baseado em regras
}

/**
 * Definição de segmento
 */
export interface CustomerSegment {
  id: string;
  tenantId: string;
  name: string;
  slug: string;
  description?: string;
  type: SegmentType;
  color?: string;
  icon?: string;
  rules?: SegmentRuleGroup;
  isSystem: boolean; // Segmentos do sistema não podem ser deletados
  customerCount: number;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Segmentos automáticos do sistema
 */
export const SYSTEM_SEGMENTS: Omit<CustomerSegment, 'id' | 'tenantId' | 'customerCount' | 'createdAt' | 'updatedAt'>[] = [
  {
    name: 'VIP',
    slug: 'vip',
    description: 'Clientes com alto valor e frequência',
    type: SegmentType.AUTOMATIC,
    color: '#FFD700',
    icon: 'star',
    isSystem: true,
    rules: {
      operator: 'AND',
      rules: [
        { field: 'metrics.totalSpent', operator: 'gte', value: 5000 },
        { field: 'metrics.totalAppointments', operator: 'gte', value: 20 },
      ],
    },
  },
  {
    name: 'Em Risco',
    slug: 'at-risk',
    description: 'Clientes que não visitam há mais de 60 dias',
    type: SegmentType.AUTOMATIC,
    color: '#FF6B6B',
    icon: 'alert-triangle',
    isSystem: true,
    rules: {
      operator: 'AND',
      rules: [
        { field: 'metrics.lastVisitDaysAgo', operator: 'gte', value: 60 },
        { field: 'metrics.totalAppointments', operator: 'gte', value: 3 },
      ],
    },
  },
  {
    name: 'Novos',
    slug: 'new',
    description: 'Clientes recém-cadastrados',
    type: SegmentType.AUTOMATIC,
    color: '#4ECDC4',
    icon: 'user-plus',
    isSystem: true,
    rules: {
      operator: 'AND',
      rules: [
        { field: 'metrics.totalAppointments', operator: 'lte', value: 1 },
        { field: 'createdAt', operator: 'gte', value: 'last30days' },
      ],
    },
  },
  {
    name: 'Frequentes',
    slug: 'frequent',
    description: 'Clientes que visitam a cada 3 semanas ou menos',
    type: SegmentType.AUTOMATIC,
    color: '#45B7D1',
    icon: 'repeat',
    isSystem: true,
    rules: {
      operator: 'AND',
      rules: [
        { field: 'metrics.visitFrequency', operator: 'lte', value: 21 },
        { field: 'metrics.totalAppointments', operator: 'gte', value: 3 },
      ],
    },
  },
  {
    name: 'Inativos',
    slug: 'churned',
    description: 'Clientes que não visitam há mais de 120 dias',
    type: SegmentType.AUTOMATIC,
    color: '#95A5A6',
    icon: 'user-x',
    isSystem: true,
    rules: {
      operator: 'AND',
      rules: [
        { field: 'metrics.lastVisitDaysAgo', operator: 'gte', value: 120 },
      ],
    },
  },
  {
    name: 'Aniversariantes do Mês',
    slug: 'birthday-month',
    description: 'Clientes que fazem aniversário no mês atual',
    type: SegmentType.AUTOMATIC,
    color: '#E056FD',
    icon: 'gift',
    isSystem: true,
    rules: {
      operator: 'AND',
      rules: [
        { field: 'birthMonth', operator: 'eq', value: 'currentMonth' },
      ],
    },
  },
  {
    name: 'Alto Ticket',
    slug: 'high-ticket',
    description: 'Clientes com ticket médio acima de R$ 200',
    type: SegmentType.AUTOMATIC,
    color: '#2ECC71',
    icon: 'trending-up',
    isSystem: true,
    rules: {
      operator: 'AND',
      rules: [
        { field: 'metrics.averageTicket', operator: 'gte', value: 200 },
        { field: 'metrics.totalAppointments', operator: 'gte', value: 5 },
      ],
    },
  },
];

/**
 * Resultado de avaliação de segmento
 */
export interface SegmentEvaluationResult {
  segmentId: string;
  segmentName: string;
  matches: boolean;
  matchedRules: string[];
  failedRules: string[];
}
