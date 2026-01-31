import { prisma } from '@/lib/prisma'

// Types
export type Gender = 'MALE' | 'FEMALE' | 'OTHER' | 'NOT_INFORMED'
export type LoyaltyTier = 'BRONZE' | 'SILVER' | 'GOLD' | 'PLATINUM' | 'DIAMOND'

export interface Customer {
  id: string
  tenantId: string
  userId?: string | null
  externalId?: string | null
  name: string
  email?: string | null
  phone: string
  birthDate?: Date | null
  gender: Gender
  cpf?: string | null
  rg?: string | null
  street?: string | null
  number?: string | null
  complement?: string | null
  neighborhood?: string | null
  city?: string | null
  state?: string | null
  zipCode?: string | null
  notes?: string | null
  tags: string[]
  acceptsMarketing: boolean
  source?: string | null
  referredById?: string | null
  tier: LoyaltyTier
  pointsBalance: number
  totalSpent: any // Decimal
  visitCount: number
  lastVisitAt?: Date | null
  avgTicket: any // Decimal
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}
export interface CustomerListParams {
  tenantId: string
  page?: number
  limit?: number
  search?: string
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
  isActive?: boolean
  gender?: Gender
  tier?: string
  hasEmail?: boolean
  hasPhone?: boolean
}

export interface CustomerListResult {
  customers: Customer[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export interface CustomerCreateInput {
  name: string
  email?: string | null
  phone: string
  birthDate?: Date | null
  gender?: Gender
  cpf?: string | null
  rg?: string | null
  street?: string | null
  number?: string | null
  complement?: string | null
  neighborhood?: string | null
  city?: string | null
  state?: string | null
  zipCode?: string | null
  notes?: string | null
  tags?: string[]
  acceptsMarketing?: boolean
  source?: string | null
}

export interface CustomerUpdateInput extends Partial<CustomerCreateInput> {
  isActive?: boolean
}

export interface CustomerStats {
  total: number
  active: number
  inactive: number
  newThisMonth: number
  withEmail: number
  withPhone: number
  byGender: Record<string, number>
  byTier: Record<string, number>
}

// Service
export class CustomerService {
  /**
   * Lista clientes com paginação e filtros
   */
  async list(params: CustomerListParams): Promise<CustomerListResult> {
    const {
      tenantId,
      page = 1,
      limit = 20,
      search,
      sortBy = 'name',
      sortOrder = 'asc',
      isActive,
      gender,
      tier,
      hasEmail,
      hasPhone,
    } = params

    // Build where clause
    const where: any = {
      tenantId,
    }

    // Active filter
    if (isActive !== undefined) {
      where.isActive = isActive
    }

    // Gender filter
    if (gender) {
      where.gender = gender
    }

    // Tier filter
    if (tier) {
      where.tier = tier
    }

    // Email filter
    if (hasEmail === true) {
      where.NOT = { ...where.NOT, email: null }
    } else if (hasEmail === false) {
      where.email = null
    }

    // Phone filter
    if (hasPhone === true) {
      where.NOT = { ...where.NOT, phone: null }
    } else if (hasPhone === false) {
      where.phone = null
    }

    // Search filter
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
        { cpf: { contains: search, mode: 'insensitive' } },
      ]
    }

    // Build orderBy
    const orderBy: any = {}
    if (sortBy === 'name') {
      orderBy.name = sortOrder
    } else if (sortBy === 'createdAt') {
      orderBy.createdAt = sortOrder
    } else if (sortBy === 'email') {
      orderBy.email = sortOrder
    } else if (sortBy === 'totalSpent') {
      orderBy.totalSpent = sortOrder
    } else if (sortBy === 'visitCount') {
      orderBy.visitCount = sortOrder
    } else if (sortBy === 'lastVisitAt') {
      orderBy.lastVisitAt = sortOrder
    } else {
      orderBy.name = 'asc'
    }

    // Execute queries
    const [customers, total] = await Promise.all([
      prisma.customer.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy,
        include: {
          _count: {
            select: {
              appointments: true,
            },
          },
        },
      }),
      prisma.customer.count({ where }),
    ])

    return {
      customers,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    }
  }

  /**
   * Busca um cliente por ID
   */
  async getById(id: string, tenantId: string): Promise<Customer | null> {
    return prisma.customer.findFirst({
      where: {
        id,
        tenantId,
      },
      include: {
        appointments: {
          take: 10,
          orderBy: { scheduledAt: 'desc' },
        },
        transactions: {
          take: 10,
          orderBy: { createdAt: 'desc' },
        },
        _count: {
          select: {
            appointments: true,
            transactions: true,
          },
        },
      },
    })
  }

  /**
   * Cria um novo cliente
   */
  async create(
    tenantId: string,
    data: CustomerCreateInput
  ): Promise<Customer> {
    // Verificar duplicidade de email
    if (data.email) {
      const existingEmail = await prisma.customer.findFirst({
        where: {
          tenantId,
          email: data.email,
          isActive: true,
        },
      })
      if (existingEmail) {
        throw new Error('Já existe um cliente com este email')
      }
    }

    // Verificar duplicidade de CPF
    if (data.cpf) {
      const existingCpf = await prisma.customer.findFirst({
        where: {
          tenantId,
          cpf: data.cpf,
          isActive: true,
        },
      })
      if (existingCpf) {
        throw new Error('Já existe um cliente com este CPF')
      }
    }

    return prisma.customer.create({
      data: {
        tenantId,
        name: data.name,
        email: data.email,
        phone: data.phone,
        birthDate: data.birthDate,
        gender: data.gender || 'NOT_INFORMED',
        cpf: data.cpf,
        rg: data.rg,
        street: data.street,
        number: data.number,
        complement: data.complement,
        neighborhood: data.neighborhood,
        city: data.city,
        state: data.state,
        zipCode: data.zipCode,
        notes: data.notes,
        tags: data.tags || [],
        acceptsMarketing: data.acceptsMarketing ?? true,
        source: data.source,
        isActive: true,
      },
    })
  }

  /**
   * Atualiza um cliente
   */
  async update(
    id: string,
    tenantId: string,
    data: CustomerUpdateInput
  ): Promise<Customer> {
    // Verificar se o cliente existe
    const existing = await prisma.customer.findFirst({
      where: { id, tenantId },
    })

    if (!existing) {
      throw new Error('Cliente não encontrado')
    }

    // Verificar duplicidade de email
    if (data.email && data.email !== existing.email) {
      const existingEmail = await prisma.customer.findFirst({
        where: {
          tenantId,
          email: data.email,
          id: { not: id },
          isActive: true,
        },
      })
      if (existingEmail) {
        throw new Error('Já existe um cliente com este email')
      }
    }

    // Verificar duplicidade de CPF
    if (data.cpf && data.cpf !== existing.cpf) {
      const existingCpf = await prisma.customer.findFirst({
        where: {
          tenantId,
          cpf: data.cpf,
          id: { not: id },
          isActive: true,
        },
      })
      if (existingCpf) {
        throw new Error('Já existe um cliente com este CPF')
      }
    }

    return prisma.customer.update({
      where: { id },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.email !== undefined && { email: data.email }),
        ...(data.phone !== undefined && { phone: data.phone }),
        ...(data.birthDate !== undefined && { birthDate: data.birthDate }),
        ...(data.gender !== undefined && { gender: data.gender }),
        ...(data.cpf !== undefined && { cpf: data.cpf }),
        ...(data.rg !== undefined && { rg: data.rg }),
        ...(data.street !== undefined && { street: data.street }),
        ...(data.number !== undefined && { number: data.number }),
        ...(data.complement !== undefined && { complement: data.complement }),
        ...(data.neighborhood !== undefined && { neighborhood: data.neighborhood }),
        ...(data.city !== undefined && { city: data.city }),
        ...(data.state !== undefined && { state: data.state }),
        ...(data.zipCode !== undefined && { zipCode: data.zipCode }),
        ...(data.notes !== undefined && { notes: data.notes }),
        ...(data.tags !== undefined && { tags: data.tags }),
        ...(data.acceptsMarketing !== undefined && { acceptsMarketing: data.acceptsMarketing }),
        ...(data.source !== undefined && { source: data.source }),
        ...(data.isActive !== undefined && { isActive: data.isActive }),
      },
    })
  }

  /**
   * Exclui um cliente (soft delete via isActive)
   */
  async delete(id: string, tenantId: string): Promise<Customer> {
    const existing = await prisma.customer.findFirst({
      where: { id, tenantId },
    })

    if (!existing) {
      throw new Error('Cliente não encontrado')
    }

    return prisma.customer.update({
      where: { id },
      data: { isActive: false },
    })
  }

  /**
   * Restaura um cliente excluído
   */
  async restore(id: string, tenantId: string): Promise<Customer> {
    const existing = await prisma.customer.findFirst({
      where: { id, tenantId },
    })

    if (!existing) {
      throw new Error('Cliente não encontrado')
    }

    return prisma.customer.update({
      where: { id },
      data: { isActive: true },
    })
  }

  /**
   * Busca clientes por termo
   */
  async search(
    tenantId: string,
    term: string,
    limit = 10
  ): Promise<Customer[]> {
    return prisma.customer.findMany({
      where: {
        tenantId,
        isActive: true,
        OR: [
          { name: { contains: term, mode: 'insensitive' } },
          { email: { contains: term, mode: 'insensitive' } },
          { phone: { contains: term, mode: 'insensitive' } },
          { cpf: { contains: term, mode: 'insensitive' } },
        ],
      },
      take: limit,
      orderBy: { name: 'asc' },
    })
  }

  /**
   * Retorna estatísticas dos clientes
   */
  async getStats(tenantId: string): Promise<CustomerStats> {
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

    const [
      total,
      active,
      inactive,
      newThisMonth,
      withEmail,
      genderCounts,
      tierCounts,
    ] = await Promise.all([
      // Total
      prisma.customer.count({
        where: { tenantId },
      }),
      // Active
      prisma.customer.count({
        where: { tenantId, isActive: true },
      }),
      // Inactive
      prisma.customer.count({
        where: { tenantId, isActive: false },
      }),
      // New this month
      prisma.customer.count({
        where: {
          tenantId,
          createdAt: { gte: startOfMonth },
        },
      }),
      // With email
      prisma.customer.count({
        where: {
          tenantId,
          isActive: true,
          NOT: { email: null },
        },
      }),
      // By gender
      prisma.customer.groupBy({
        by: ['gender'],
        where: { tenantId, isActive: true },
        _count: true,
      }),
      // By tier
      prisma.customer.groupBy({
        by: ['tier'],
        where: { tenantId, isActive: true },
        _count: true,
      }),
    ])

    const byGender: Record<string, number> = {}
    for (const g of genderCounts) {
      byGender[g.gender] = g._count
    }

    const byTier: Record<string, number> = {}
    for (const t of tierCounts) {
      byTier[t.tier] = t._count
    }

    return {
      total,
      active,
      inactive,
      newThisMonth,
      withEmail,
      withPhone: active, // phone is required, so all active customers have phone
      byGender,
      byTier,
    }
  }

  /**
   * Atualiza pontos do cliente
   */
  async updatePoints(
    id: string,
    tenantId: string,
    points: number,
    reason: string
  ): Promise<Customer> {
    const customer = await prisma.customer.findFirst({
      where: { id, tenantId },
    })

    if (!customer) {
      throw new Error('Cliente não encontrado')
    }

    const newBalance = customer.pointsBalance + points

    // Create points history record
    await prisma.customerPoints.create({
      data: {
        tenantId,
        customerId: id,
        points,
        type: points > 0 ? 'EARNED' : 'SPENT',
        description: reason,
        balance: newBalance,
      },
    })

    return prisma.customer.update({
      where: { id },
      data: { pointsBalance: newBalance },
    })
  }

  /**
   * Atualiza tier do cliente
   */
  async updateTier(id: string, tenantId: string): Promise<Customer> {
    const customer = await prisma.customer.findFirst({
      where: { id, tenantId },
    })

    if (!customer) {
      throw new Error('Cliente não encontrado')
    }

    // Determine tier based on total spent
    const totalSpent = Number(customer.totalSpent)
    let newTier: 'BRONZE' | 'SILVER' | 'GOLD' | 'PLATINUM' | 'DIAMOND' = 'BRONZE'

    if (totalSpent >= 10000) {
      newTier = 'DIAMOND'
    } else if (totalSpent >= 5000) {
      newTier = 'PLATINUM'
    } else if (totalSpent >= 2500) {
      newTier = 'GOLD'
    } else if (totalSpent >= 1000) {
      newTier = 'SILVER'
    }

    if (newTier !== customer.tier) {
      return prisma.customer.update({
        where: { id },
        data: { tier: newTier },
      })
    }

    return customer
  }

  /**
   * Registra uma visita do cliente
   */
  async recordVisit(id: string, tenantId: string): Promise<Customer> {
    const customer = await prisma.customer.findFirst({
      where: { id, tenantId },
    })

    if (!customer) {
      throw new Error('Cliente não encontrado')
    }

    return prisma.customer.update({
      where: { id },
      data: {
        visitCount: customer.visitCount + 1,
        lastVisitAt: new Date(),
      },
    })
  }

  /**
   * Atualiza estatísticas financeiras do cliente
   */
  async updateFinancials(
    id: string,
    tenantId: string,
    transactionAmount: number
  ): Promise<Customer> {
    const customer = await prisma.customer.findFirst({
      where: { id, tenantId },
    })

    if (!customer) {
      throw new Error('Cliente não encontrado')
    }

    const newTotalSpent = Number(customer.totalSpent) + transactionAmount
    const newVisitCount = customer.visitCount + 1
    const newAvgTicket = newTotalSpent / newVisitCount

    const updated = await prisma.customer.update({
      where: { id },
      data: {
        totalSpent: newTotalSpent,
        visitCount: newVisitCount,
        avgTicket: newAvgTicket,
        lastVisitAt: new Date(),
      },
    })

    // Also update tier
    await this.updateTier(id, tenantId)

    return updated
  }

  /**
   * Busca histórico de pontos
   */
  async getPointsHistory(id: string, tenantId: string, limit = 20) {
    return prisma.customerPoints.findMany({
      where: {
        customerId: id,
        tenantId,
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    })
  }

  /**
   * Busca aniversariantes do período
   */
  async getBirthdays(
    tenantId: string,
    startDate: Date,
    endDate: Date
  ): Promise<Customer[]> {
    const customers = await prisma.customer.findMany({
      where: {
        tenantId,
        isActive: true,
        NOT: { birthDate: null },
      },
    })

    // Filter by birthday range
    const startMonth = startDate.getMonth()
    const startDay = startDate.getDate()
    const endMonth = endDate.getMonth()
    const endDay = endDate.getDate()

    return customers.filter((customer: any) => {
      if (!customer.birthDate) return false
      const birthMonth = customer.birthDate.getMonth()
      const birthDay = customer.birthDate.getDate()

      if (startMonth === endMonth) {
        return birthMonth === startMonth && birthDay >= startDay && birthDay <= endDay
      }

      // Handle period spanning multiple months
      if (birthMonth === startMonth && birthDay >= startDay) return true
      if (birthMonth === endMonth && birthDay <= endDay) return true
      if (birthMonth > startMonth && birthMonth < endMonth) return true

      return false
    })
  }
}

// Export singleton instance
export const customerService = new CustomerService()

// ============================================================================
// TENANT-SCOPED SERVICE FACTORY
// ============================================================================

/**
 * Creates a tenant-scoped customer service instance
 * Used by API routes that have already authenticated and extracted tenantId
 */
export class TenantCustomerService {
  private tenantId: string
  private service: CustomerService

  constructor(tenantId: string) {
    this.tenantId = tenantId
    this.service = new CustomerService()
  }

  async list(params: Omit<CustomerListParams, 'tenantId'> & { filters?: any; includeInactive?: boolean }) {
    const { filters, includeInactive, ...rest } = params
    return this.service.list({
      ...rest,
      tenantId: this.tenantId,
      isActive: includeInactive ? undefined : true,
      gender: filters?.gender,
      hasEmail: filters?.hasEmail,
      hasPhone: filters?.hasPhone,
    })
  }

  async getById(id: string, _includeRelations?: boolean) {
    // includeRelations is handled by the base service - always includes some relations
    return this.service.getById(id, this.tenantId)
  }

  async create(data: CustomerCreateInput) {
    return this.service.create(this.tenantId, data)
  }

  async update(id: string, data: CustomerUpdateInput) {
    return this.service.update(id, this.tenantId, data)
  }

  async delete(id: string) {
    return this.service.delete(id, this.tenantId)
  }

  async restore(id: string) {
    return this.service.restore(id, this.tenantId)
  }

  async search(term: string, limit?: number) {
    return this.service.search(this.tenantId, term, limit)
  }

  async getStats() {
    return this.service.getStats(this.tenantId)
  }

  async bulkDelete(ids: string[]): Promise<number> {
    const result = await prisma.customer.updateMany({
      where: {
        id: { in: ids },
        tenantId: this.tenantId,
      },
      data: { isActive: false },
    })
    return result.count
  }

  async bulkUpdateStatus(ids: string[], status: 'ACTIVE' | 'INACTIVE'): Promise<number> {
    const result = await prisma.customer.updateMany({
      where: {
        id: { in: ids },
        tenantId: this.tenantId,
      },
      data: { isActive: status === 'ACTIVE' },
    })
    return result.count
  }

  async exportToCSV(filters?: { status?: 'ACTIVE' | 'INACTIVE'; gender?: string; tags?: string[] }): Promise<string> {
    const where: any = {
      tenantId: this.tenantId,
    }

    if (filters?.status) {
      where.isActive = filters.status === 'ACTIVE'
    }
    if (filters?.gender) {
      where.gender = filters.gender
    }
    if (filters?.tags?.length) {
      where.tags = { hasSome: filters.tags }
    }

    const customers = await prisma.customer.findMany({
      where,
      orderBy: { name: 'asc' },
    })

    // Build CSV
    const headers = ['Nome', 'Email', 'Telefone', 'CPF', 'Gênero', 'Data Nascimento', 'Cidade', 'Estado', 'Status', 'Criado em']
    const rows = customers.map((c: any) => [
      c.name || '',
      c.email || '',
      c.phone || '',
      c.cpf || '',
      c.gender || '',
      c.birthDate ? new Date(c.birthDate).toLocaleDateString('pt-BR') : '',
      c.city || '',
      c.state || '',
      c.isActive ? 'Ativo' : 'Inativo',
      new Date(c.createdAt).toLocaleDateString('pt-BR'),
    ])

    const csvRows = [headers.join(';'), ...rows.map(row => row.join(';'))]
    return csvRows.join('\n')
  }
}

/**
 * Factory function to create a tenant-scoped customer service
 */
export function createCustomerService(tenantId: string): TenantCustomerService {
  return new TenantCustomerService(tenantId)
}
