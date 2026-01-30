import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import {
  CustomerCreatedEvent,
  CustomerUpdatedEvent,
  CustomerDeletedEvent,
  CustomerLoyaltyPointsAddedEvent,
  CustomerLoyaltyTierChangedEvent,
  CustomersMergedEvent,
  CustomerSegmentsChangedEvent,
} from '../events';

/**
 * Listener para eventos de clientes
 */
@Injectable()
export class CustomersListener {
  private readonly logger = new Logger(CustomersListener.name);

  /**
   * Cliente criado
   */
  @OnEvent('customer.created')
  async handleCustomerCreated(event: CustomerCreatedEvent): Promise<void> {
    this.logger.log(
      `Cliente criado: ${event.customer.name} (${event.customer.id}) - Fonte: ${event.source}`,
    );

    // TODO: Enviar email de boas-vindas se configurado
    if (event.isSelfService()) {
      this.logger.log('Auto-cadastro - enviar email de confirmação');
    }

    // TODO: Se foi indicação, notificar quem indicou
    if (event.isReferral()) {
      this.logger.log(`Cliente indicado por: ${event.referredBy}`);
    }

    // TODO: Integração com outras plataformas (CRM externo, etc.)
  }

  /**
   * Cliente atualizado
   */
  @OnEvent('customer.updated')
  async handleCustomerUpdated(event: CustomerUpdatedEvent): Promise<void> {
    this.logger.log(
      `Cliente atualizado: ${event.customer.name} - Campos: ${event.changedFields.map((f) => f.field).join(', ')}`,
    );

    // Se dados de contato mudaram, pode precisar revalidar
    if (event.hasContactChanged()) {
      this.logger.log('Dados de contato alterados - considerar revalidação');
    }

    // Se preferências de marketing mudaram
    if (event.hasMarketingPreferencesChanged()) {
      this.logger.log('Preferências de marketing alteradas');
      // TODO: Atualizar listas de email marketing
    }
  }

  /**
   * Cliente deletado
   */
  @OnEvent('customer.deleted')
  async handleCustomerDeleted(event: CustomerDeletedEvent): Promise<void> {
    this.logger.log(
      `Cliente deletado: ${event.customer.name} (${event.customer.id})`,
    );

    // TODO: Cancelar agendamentos futuros
    // TODO: Remover de listas de marketing
    // TODO: Notificar administração se necessário
  }

  /**
   * Pontos de fidelidade adicionados
   */
  @OnEvent('customer.loyalty.points_added')
  async handlePointsAdded(event: CustomerLoyaltyPointsAddedEvent): Promise<void> {
    this.logger.log(
      `Pontos adicionados: ${event.points} para ${event.customer.name} - Novo saldo: ${event.newBalance}`,
    );

    // TODO: Enviar notificação ao cliente sobre pontos ganhos
    if (event.points > 0) {
      this.logger.log('Notificar cliente sobre pontos ganhos');
    }
  }

  /**
   * Tier de fidelidade alterado
   */
  @OnEvent('customer.loyalty.tier_changed')
  async handleTierChanged(event: CustomerLoyaltyTierChangedEvent): Promise<void> {
    this.logger.log(
      `Tier alterado: ${event.customer.name} - ${event.previousTier} -> ${event.newTier}`,
    );

    if (event.isPromotion()) {
      // TODO: Enviar parabéns por subir de tier
      this.logger.log('Cliente promovido de tier - enviar congratulações');
    } else if (event.isDemotion()) {
      // TODO: Notificar sobre rebaixamento e como recuperar
      this.logger.log('Cliente rebaixado de tier');
    }
  }

  /**
   * Clientes mesclados
   */
  @OnEvent('customer.merged')
  async handleMerged(event: CustomersMergedEvent): Promise<void> {
    this.logger.log(
      `Clientes mesclados: ${event.mergedCount} clientes -> ${event.customer.id}`,
    );
    this.logger.log(`Agendamentos transferidos: ${event.appointmentsTransferred}`);
    this.logger.log(`Pontos consolidados: ${event.loyaltyPointsConsolidated}`);

    // TODO: Atualizar referências em outros sistemas
    // TODO: Registrar auditoria
  }

  /**
   * Segmentos do cliente alterados
   */
  @OnEvent('customer.segments_changed')
  async handleSegmentsChanged(event: CustomerSegmentsChangedEvent): Promise<void> {
    this.logger.log(
      `Segmentos alterados: ${event.customer.name}`,
    );

    // Segmentos que entrou
    if (event.addedSegments.length > 0) {
      this.logger.log(`Entrou em: ${event.addedSegments.join(', ')}`);

      // Ações específicas por segmento
      if (event.enteredSegment('vip')) {
        // TODO: Enviar boas-vindas VIP
        this.logger.log('Cliente se tornou VIP');
      }

      if (event.enteredSegment('at-risk')) {
        // TODO: Disparar campanha de reativação
        this.logger.log('Cliente em risco - iniciar campanha de retenção');
      }

      if (event.enteredSegment('churned')) {
        // TODO: Adicionar a campanha de win-back
        this.logger.log('Cliente inativo - adicionar a campanha win-back');
      }
    }

    // Segmentos que saiu
    if (event.removedSegments.length > 0) {
      this.logger.log(`Saiu de: ${event.removedSegments.join(', ')}`);

      if (event.leftSegment('at-risk')) {
        // Cliente voltou a visitar
        this.logger.log('Cliente reativado - parar campanha de retenção');
      }
    }
  }
}
