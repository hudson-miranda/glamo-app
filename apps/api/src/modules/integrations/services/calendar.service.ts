import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { IntegrationsRepository } from '../repositories';
import { CreateCalendarEventDto, CalendarConfigDto } from '../dto';
import { CalendarProvider } from '../interfaces';

@Injectable()
export class CalendarService {
  private readonly logger = new Logger(CalendarService.name);

  constructor(
    private readonly repository: IntegrationsRepository,
    private readonly configService: ConfigService,
  ) {}

  async createEvent(integrationId: string, dto: CreateCalendarEventDto): Promise<any> {
    const integration = await this.repository.findIntegrationById(integrationId);
    if (!integration) {
      throw new Error('Integração não encontrada');
    }

    const config = integration.config as any;
    const provider = config.provider as CalendarProvider;

    let externalId: string;

    switch (provider) {
      case CalendarProvider.GOOGLE:
        externalId = await this.createGoogleCalendarEvent(integration, dto);
        break;
      case CalendarProvider.MICROSOFT:
        externalId = await this.createMicrosoftCalendarEvent(integration, dto);
        break;
      default:
        throw new Error(`Provedor ${provider} não suportado`);
    }

    const event = await this.repository.createCalendarEvent({
      externalId,
      title: dto.title,
      description: dto.description,
      location: dto.location,
      startTime: new Date(dto.startTime),
      endTime: new Date(dto.endTime),
      allDay: dto.allDay || false,
      reminders: dto.reminders,
      status: 'confirmed',
      appointmentId: dto.appointmentId,
    });

    return event;
  }

  async updateEvent(eventId: string, dto: Partial<CreateCalendarEventDto>): Promise<any> {
    const event = await this.repository.findCalendarEventById(eventId);
    if (!event) {
      throw new Error('Evento não encontrado');
    }

    // Atualizar no provedor externo
    // ...

    return this.repository.updateCalendarEvent(eventId, {
      title: dto.title,
      description: dto.description,
      location: dto.location,
      startTime: dto.startTime ? new Date(dto.startTime) : undefined,
      endTime: dto.endTime ? new Date(dto.endTime) : undefined,
    });
  }

  async deleteEvent(eventId: string): Promise<void> {
    const event = await this.repository.findCalendarEventById(eventId);
    if (!event) return;

    // Deletar do provedor externo
    // ...

    await this.repository.deleteCalendarEvent(eventId);
  }

  async syncAppointmentToCalendar(appointmentId: string, integrationId: string): Promise<void> {
    // Buscar agendamento e criar/atualizar evento
    const existingEvent = await this.repository.findCalendarEventByAppointmentId(appointmentId);

    if (existingEvent) {
      // Atualizar
      this.logger.log(`Updating calendar event for appointment ${appointmentId}`);
    } else {
      // Criar
      this.logger.log(`Creating calendar event for appointment ${appointmentId}`);
    }
  }

  async syncFromCalendar(integrationId: string): Promise<any> {
    const integration = await this.repository.findIntegrationById(integrationId);
    if (!integration) {
      throw new Error('Integração não encontrada');
    }

    const syncLog = await this.repository.createSyncLog({
      integrationId,
      type: 'import',
      status: 'started',
      recordsProcessed: 0,
      recordsSucceeded: 0,
      recordsFailed: 0,
      errors: [],
      startedAt: new Date(),
    });

    try {
      // Implementar sincronização
      const eventsProcessed = 0;

      await this.repository.updateSyncLog(syncLog.id, {
        status: 'completed',
        recordsProcessed: eventsProcessed,
        recordsSucceeded: eventsProcessed,
        completedAt: new Date(),
      });

      return { syncLogId: syncLog.id, eventsProcessed };
    } catch (error: any) {
      await this.repository.updateSyncLog(syncLog.id, {
        status: 'failed',
        errors: [{ record: 'sync', error: error.message }],
        completedAt: new Date(),
      });
      throw error;
    }
  }

  // ========================
  // GOOGLE CALENDAR
  // ========================

  private async createGoogleCalendarEvent(integration: any, dto: CreateCalendarEventDto): Promise<string> {
    this.logger.log('Creating Google Calendar event');
    // Implementação real com Google Calendar API
    return `google_${Date.now()}`;
  }

  // ========================
  // MICROSOFT CALENDAR
  // ========================

  private async createMicrosoftCalendarEvent(integration: any, dto: CreateCalendarEventDto): Promise<string> {
    this.logger.log('Creating Microsoft Calendar event');
    // Implementação real com Microsoft Graph API
    return `microsoft_${Date.now()}`;
  }

  // ========================
  // OAUTH
  // ========================

  async getAuthUrl(provider: CalendarProvider, redirectUri: string): Promise<string> {
    switch (provider) {
      case CalendarProvider.GOOGLE:
        return this.getGoogleAuthUrl(redirectUri);
      case CalendarProvider.MICROSOFT:
        return this.getMicrosoftAuthUrl(redirectUri);
      default:
        throw new Error(`Provedor ${provider} não suportado`);
    }
  }

  private getGoogleAuthUrl(redirectUri: string): string {
    const clientId = this.configService.get('GOOGLE_CLIENT_ID');
    const scopes = encodeURIComponent('https://www.googleapis.com/auth/calendar');
    return `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=code&scope=${scopes}&access_type=offline`;
  }

  private getMicrosoftAuthUrl(redirectUri: string): string {
    const clientId = this.configService.get('MICROSOFT_CLIENT_ID');
    const scopes = encodeURIComponent('Calendars.ReadWrite offline_access');
    return `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=code&scope=${scopes}`;
  }
}
