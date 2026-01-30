import { Injectable } from '@nestjs/common';
import { AsyncLocalStorage } from 'async_hooks';

/**
 * Interface do contexto do tenant
 */
export interface TenantContext {
  tenantId: string;
  slug?: string;
  planType?: string;
  features?: string[];
}

/**
 * Serviço para gerenciar o contexto do tenant usando AsyncLocalStorage
 * Permite acesso ao tenantId em qualquer ponto da aplicação sem prop drilling
 */
@Injectable()
export class TenantContextService {
  private static storage = new AsyncLocalStorage<TenantContext>();

  /**
   * Executa uma função dentro de um contexto de tenant
   */
  static run<T>(context: TenantContext, fn: () => T): T {
    return this.storage.run(context, fn);
  }

  /**
   * Executa uma função async dentro de um contexto de tenant
   */
  static async runAsync<T>(context: TenantContext, fn: () => Promise<T>): Promise<T> {
    return this.storage.run(context, fn);
  }

  /**
   * Obtém o contexto completo do tenant atual
   */
  static getStore(): TenantContext | undefined {
    return this.storage.getStore();
  }

  /**
   * Obtém o ID do tenant atual
   */
  static getCurrentTenantId(): string | undefined {
    return this.storage.getStore()?.tenantId;
  }

  /**
   * Obtém o slug do tenant atual
   */
  static getCurrentTenantSlug(): string | undefined {
    return this.storage.getStore()?.slug;
  }

  /**
   * Obtém o tipo de plano do tenant atual
   */
  static getCurrentPlanType(): string | undefined {
    return this.storage.getStore()?.planType;
  }

  /**
   * Obtém as features habilitadas do tenant atual
   */
  static getCurrentFeatures(): string[] {
    return this.storage.getStore()?.features || [];
  }

  /**
   * Verifica se uma feature está habilitada para o tenant atual
   */
  static hasFeature(feature: string): boolean {
    const features = this.getCurrentFeatures();
    return features.includes(feature);
  }

  /**
   * Verifica se há um contexto de tenant ativo
   */
  static hasTenantContext(): boolean {
    return !!this.storage.getStore()?.tenantId;
  }

  // Métodos de instância para injeção de dependência
  run<T>(context: TenantContext, fn: () => T): T {
    return TenantContextService.run(context, fn);
  }

  runAsync<T>(context: TenantContext, fn: () => Promise<T>): Promise<T> {
    return TenantContextService.runAsync(context, fn);
  }

  getStore(): TenantContext | undefined {
    return TenantContextService.getStore();
  }

  getCurrentTenantId(): string | undefined {
    return TenantContextService.getCurrentTenantId();
  }

  getCurrentTenantSlug(): string | undefined {
    return TenantContextService.getCurrentTenantSlug();
  }

  getCurrentPlanType(): string | undefined {
    return TenantContextService.getCurrentPlanType();
  }

  getCurrentFeatures(): string[] {
    return TenantContextService.getCurrentFeatures();
  }

  hasFeature(feature: string): boolean {
    return TenantContextService.hasFeature(feature);
  }

  hasTenantContext(): boolean {
    return TenantContextService.hasTenantContext();
  }
}
