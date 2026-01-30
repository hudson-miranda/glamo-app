import { Injectable, Logger } from '@nestjs/common';
import { NotificationsRepository } from '../repositories';
import { NotificationTemplate, TemplateVariable } from '../interfaces';
import * as Handlebars from 'handlebars';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

@Injectable()
export class TemplateService {
  private readonly logger = new Logger(TemplateService.name);
  private compiledTemplates = new Map<string, HandlebarsTemplateDelegate>();

  constructor(private readonly repository: NotificationsRepository) {
    this.registerHelpers();
  }

  private registerHelpers(): void {
    // Helper para formatar datas
    Handlebars.registerHelper('formatDate', (date: string | Date, formatStr: string) => {
      const d = typeof date === 'string' ? parseISO(date) : date;
      return format(d, formatStr || 'dd/MM/yyyy', { locale: ptBR });
    });

    // Helper para formatar moeda
    Handlebars.registerHelper('formatCurrency', (value: number) => {
      return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
      }).format(value);
    });

    // Helper para formatar número
    Handlebars.registerHelper('formatNumber', (value: number, decimals: number = 2) => {
      return new Intl.NumberFormat('pt-BR', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      }).format(value);
    });

    // Helper condicional
    Handlebars.registerHelper('ifEquals', function(arg1: any, arg2: any, options: any) {
      return arg1 === arg2 ? options.fn(this) : options.inverse(this);
    });

    // Helper para capitalizar
    Handlebars.registerHelper('capitalize', (str: string) => {
      if (!str) return '';
      return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
    });

    // Helper para plural
    Handlebars.registerHelper('plural', (count: number, singular: string, plural: string) => {
      return count === 1 ? singular : plural;
    });
  }

  async render(
    templateId: string,
    variables: Record<string, any>,
  ): Promise<{
    subject?: string;
    email?: { subject: string; html: string; text?: string };
    sms?: { text: string };
    push?: { title: string; body: string; image?: string };
    whatsapp?: { templateName: string; language: string; components?: any[] };
    inApp?: { title: string; body: string; icon?: string };
  }> {
    const template = await this.repository.findTemplateById(templateId);
    if (!template) {
      throw new Error(`Template ${templateId} não encontrado`);
    }

    return this.renderTemplate(template, variables);
  }

  async renderByCode(
    code: string,
    variables: Record<string, any>,
  ): Promise<any> {
    const template = await this.repository.findTemplateByCode(code);
    if (!template) {
      throw new Error(`Template com código ${code} não encontrado`);
    }

    return this.renderTemplate(template, variables);
  }

  private renderTemplate(
    template: NotificationTemplate,
    variables: Record<string, any>,
  ): any {
    const result: any = {};

    // Validar variáveis obrigatórias
    this.validateVariables(template.variables, variables);

    // Preparar variáveis com valores padrão
    const preparedVars = this.prepareVariables(template.variables, variables);

    // Renderizar cada canal
    if (template.content.email) {
      result.email = {
        subject: this.compile(template.content.email.subject, preparedVars),
        html: this.compile(template.content.email.html, preparedVars),
        text: template.content.email.text
          ? this.compile(template.content.email.text, preparedVars)
          : undefined,
      };
    }

    if (template.content.sms) {
      result.sms = {
        text: this.compile(template.content.sms.text, preparedVars),
      };
    }

    if (template.content.push) {
      result.push = {
        title: this.compile(template.content.push.title, preparedVars),
        body: this.compile(template.content.push.body, preparedVars),
        image: template.content.push.image,
      };
    }

    if (template.content.whatsapp) {
      result.whatsapp = {
        templateName: template.content.whatsapp.templateName,
        language: template.content.whatsapp.language,
        components: this.renderWhatsAppComponents(
          template.content.whatsapp.components,
          preparedVars,
        ),
      };
    }

    if (template.content.inApp) {
      result.inApp = {
        title: this.compile(template.content.inApp.title, preparedVars),
        body: this.compile(template.content.inApp.body, preparedVars),
        icon: template.content.inApp.icon,
      };
    }

    return result;
  }

  private compile(template: string, variables: Record<string, any>): string {
    const cacheKey = template;
    
    if (!this.compiledTemplates.has(cacheKey)) {
      this.compiledTemplates.set(cacheKey, Handlebars.compile(template));
    }

    const compiled = this.compiledTemplates.get(cacheKey)!;
    return compiled(variables);
  }

  private validateVariables(
    templateVars: TemplateVariable[],
    providedVars: Record<string, any>,
  ): void {
    const missingVars: string[] = [];

    for (const v of templateVars) {
      if (v.required && !(v.name in providedVars)) {
        missingVars.push(v.name);
      }
    }

    if (missingVars.length > 0) {
      throw new Error(`Variáveis obrigatórias não fornecidas: ${missingVars.join(', ')}`);
    }
  }

  private prepareVariables(
    templateVars: TemplateVariable[],
    providedVars: Record<string, any>,
  ): Record<string, any> {
    const result = { ...providedVars };

    for (const v of templateVars) {
      if (!(v.name in result) && v.defaultValue !== undefined) {
        result[v.name] = v.defaultValue;
      }
    }

    return result;
  }

  private renderWhatsAppComponents(
    components: any[] | undefined,
    variables: Record<string, any>,
  ): any[] | undefined {
    if (!components) return undefined;

    return components.map((comp) => {
      if (comp.type === 'body' && comp.parameters) {
        return {
          ...comp,
          parameters: comp.parameters.map((param: any) => ({
            ...param,
            text: param.text ? this.compile(param.text, variables) : param.text,
          })),
        };
      }
      return comp;
    });
  }

  // Preview de template sem salvar
  preview(
    content: string,
    variables: Record<string, any>,
  ): string {
    return this.compile(content, variables);
  }

  // Extrair variáveis de um template
  extractVariables(template: string): string[] {
    const regex = /\{\{([^}]+)\}\}/g;
    const variables: string[] = [];
    let match;

    while ((match = regex.exec(template)) !== null) {
      const varName = match[1].trim().split(' ')[0]; // Remove helpers
      if (!varName.startsWith('#') && !varName.startsWith('/') && !varName.startsWith('else')) {
        variables.push(varName);
      }
    }

    return [...new Set(variables)];
  }
}
