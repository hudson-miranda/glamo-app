import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import {
  AppointmentCreatedEvent,
  AppointmentConfirmedEvent,
  AppointmentCancelledEvent,
  AppointmentCompletedEvent,
  AppointmentRescheduledEvent,
  AppointmentReminderEvent,
  AppointmentStatusChangedEvent,
} from '../events';

/**
 * Listener para eventos de agendamentos
 * Centraliza as reações a eventos do módulo de agendamentos
 */
@Injectable()
export class AppointmentsListener {
  private readonly logger = new Logger(AppointmentsListener.name);

  /**
   * Handler para evento de agendamento criado
   */
  @OnEvent(AppointmentCreatedEvent.eventName)
  async handleAppointmentCreated(event: AppointmentCreatedEvent): Promise<void> {
    this.logger.log(
      `Appointment created: ${event.appointmentId} for tenant ${event.tenantId}`,
    );

    try {
      // Aqui podemos adicionar lógica como:
      // - Enviar notificação ao cliente
      // - Enviar notificação ao profissional
      // - Registrar em analytics
      // - Atualizar dashboard em tempo real

      if (event.data.client?.email) {
        // TODO: Integrar com serviço de email
        this.logger.debug(
          `Would send confirmation email to ${event.data.client.email}`,
        );
      }

      if (event.isRecurring) {
        this.logger.debug(
          `Appointment is part of recurrence group: ${event.data.recurrenceGroupId}`,
        );
      }
    } catch (error) {
      this.logger.error(
        `Error handling appointment created event: ${error.message}`,
        error.stack,
      );
    }
  }

  /**
   * Handler para evento de agendamento confirmado
   */
  @OnEvent(AppointmentConfirmedEvent.eventName)
  async handleAppointmentConfirmed(event: AppointmentConfirmedEvent): Promise<void> {
    this.logger.log(
      `Appointment confirmed: ${event.appointmentId} by ${event.confirmedBy}`,
    );

    try {
      // Notificar cliente sobre confirmação
      if (event.data.client?.email) {
        // TODO: Enviar email de confirmação
        this.logger.debug(
          `Would send confirmation notification to ${event.data.client.email}`,
        );
      }

      // Notificar via WhatsApp/SMS se configurado
      if (event.data.client?.phone) {
        // TODO: Integrar com serviço de SMS/WhatsApp
        this.logger.debug(
          `Would send SMS/WhatsApp to ${event.data.client.phone}`,
        );
      }
    } catch (error) {
      this.logger.error(
        `Error handling appointment confirmed event: ${error.message}`,
        error.stack,
      );
    }
  }

  /**
   * Handler para evento de agendamento cancelado
   */
  @OnEvent(AppointmentCancelledEvent.eventName)
  async handleAppointmentCancelled(event: AppointmentCancelledEvent): Promise<void> {
    this.logger.log(
      `Appointment cancelled: ${event.appointmentId} - reason: ${event.reason}`,
    );

    try {
      // Notificar cliente
      if (event.data.client?.email) {
        // TODO: Enviar email de cancelamento
        this.logger.debug(
          `Would send cancellation email to ${event.data.client.email}`,
        );
      }

      // Notificar profissional
      if (event.data.professional?.email) {
        // TODO: Enviar notificação ao profissional
        this.logger.debug(
          `Would notify professional ${event.data.professional.email}`,
        );
      }

      // Registrar cancelamento tardio para análise
      if (event.isLateCancellation(24)) {
        this.logger.warn(
          `Late cancellation detected: ${event.appointmentId} (${event.data.hoursBeforeScheduled}h before)`,
        );
        // TODO: Registrar para possível política de cancelamento
      }
    } catch (error) {
      this.logger.error(
        `Error handling appointment cancelled event: ${error.message}`,
        error.stack,
      );
    }
  }

  /**
   * Handler para evento de agendamento concluído
   */
  @OnEvent(AppointmentCompletedEvent.eventName)
  async handleAppointmentCompleted(event: AppointmentCompletedEvent): Promise<void> {
    this.logger.log(`Appointment completed: ${event.appointmentId}`);

    try {
      // Enviar pesquisa de satisfação
      if (event.data.client?.email) {
        // TODO: Agendar envio de pesquisa de satisfação
        this.logger.debug(
          `Would schedule satisfaction survey for ${event.data.client.email}`,
        );
      }

      // Atualizar estatísticas do profissional
      // TODO: Incrementar contador de atendimentos

      // Verificar se deve sugerir próximo agendamento
      // TODO: Lógica de fidelização
    } catch (error) {
      this.logger.error(
        `Error handling appointment completed event: ${error.message}`,
        error.stack,
      );
    }
  }

  /**
   * Handler para evento de agendamento reagendado
   */
  @OnEvent(AppointmentRescheduledEvent.eventName)
  async handleAppointmentRescheduled(event: AppointmentRescheduledEvent): Promise<void> {
    this.logger.log(
      `Appointment rescheduled: ${event.appointmentId} from ${event.previousScheduledAt} to ${event.data.scheduledAt}`,
    );

    try {
      // Notificar cliente sobre reagendamento
      if (event.data.client?.email) {
        // TODO: Enviar email sobre novo horário
        this.logger.debug(
          `Would send reschedule notification to ${event.data.client.email}`,
        );
      }

      // Notificar profissional se mudou
      if (event.wasChangedProfessional && event.data.professional?.email) {
        // TODO: Notificar novo profissional
        this.logger.debug(
          `Would notify new professional ${event.data.professional.email}`,
        );
      }
    } catch (error) {
      this.logger.error(
        `Error handling appointment rescheduled event: ${error.message}`,
        error.stack,
      );
    }
  }

  /**
   * Handler para evento de lembrete
   */
  @OnEvent(AppointmentReminderEvent.eventName)
  async handleAppointmentReminder(event: AppointmentReminderEvent): Promise<void> {
    this.logger.log(
      `Sending ${event.reminderType} reminder for appointment ${event.appointmentId}`,
    );

    try {
      const { channels, data } = event;

      for (const channel of channels) {
        switch (channel) {
          case 'EMAIL':
            if (data.client?.email) {
              // TODO: Integrar com serviço de email
              this.logger.debug(`Would send email reminder to ${data.client.email}`);
            }
            break;

          case 'SMS':
            if (data.client?.phone) {
              // TODO: Integrar com serviço de SMS
              this.logger.debug(`Would send SMS reminder to ${data.client.phone}`);
            }
            break;

          case 'WHATSAPP':
            if (data.client?.phone) {
              // TODO: Integrar com serviço de WhatsApp
              this.logger.debug(`Would send WhatsApp reminder to ${data.client.phone}`);
            }
            break;

          case 'PUSH':
            // TODO: Integrar com serviço de push notifications
            this.logger.debug(`Would send push notification for appointment`);
            break;
        }
      }
    } catch (error) {
      this.logger.error(
        `Error handling appointment reminder event: ${error.message}`,
        error.stack,
      );
    }
  }

  /**
   * Handler para evento de mudança de status
   */
  @OnEvent(AppointmentStatusChangedEvent.eventName)
  async handleStatusChanged(event: AppointmentStatusChangedEvent): Promise<void> {
    this.logger.debug(
      `Appointment ${event.appointmentId} status changed: ${event.previousStatus} -> ${event.newStatus}`,
    );

    // Evento genérico de mudança de status
    // Útil para logs de auditoria e atualização em tempo real

    try {
      // TODO: Emitir para WebSocket para atualização em tempo real
      // TODO: Registrar em log de auditoria
    } catch (error) {
      this.logger.error(
        `Error handling status changed event: ${error.message}`,
        error.stack,
      );
    }
  }
}
