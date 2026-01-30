'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  ChevronRight,
  Home,
  ArrowLeft,
  Save,
  Bell,
  Mail,
  MessageSquare,
  Calendar,
  DollarSign,
  Users,
  AlertCircle,
  Smartphone,
} from 'lucide-react';

// Breadcrumb component
function Breadcrumb() {
  return (
    <nav className="flex items-center space-x-2 text-sm text-gray-500 mb-6">
      <Link href="/dashboard" className="hover:text-gray-700 flex items-center">
        <Home className="h-4 w-4" />
      </Link>
      <ChevronRight className="h-4 w-4" />
      <Link href="/dashboard/settings" className="hover:text-gray-700">
        Configurações
      </Link>
      <ChevronRight className="h-4 w-4" />
      <span className="text-gray-900 font-medium">Notificações</span>
    </nav>
  );
}

export default function NotificationsSettingsPage() {
  const [notifications, setNotifications] = useState({
    // Email notifications
    emailNewAppointment: true,
    emailCancellation: true,
    emailReminder: true,
    emailDailyReport: false,
    emailWeeklyReport: true,
    // SMS notifications
    smsNewAppointment: false,
    smsCancellation: true,
    smsReminder: true,
    // Push notifications
    pushNewAppointment: true,
    pushCancellation: true,
    pushReminder: true,
    pushLowStock: true,
    pushNewReview: true,
    // Client notifications
    clientReminder24h: true,
    clientReminder2h: true,
    clientConfirmation: true,
  });

  const handleToggle = (key: keyof typeof notifications) => {
    setNotifications((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  return (
    <div className="p-6 space-y-6">
      <Breadcrumb />

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/settings">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Notificações</h1>
            <p className="text-gray-500 mt-1">Configure alertas e lembretes</p>
          </div>
        </div>
        <Button className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700">
          <Save className="h-4 w-4 mr-2" />
          Salvar Preferências
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Email Notifications */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5 text-purple-600" />
              Notificações por E-mail
            </CardTitle>
            <CardDescription>
              Escolha quais e-mails deseja receber
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <Label>Novo Agendamento</Label>
                <p className="text-sm text-gray-500">Receber e-mail quando um cliente agendar</p>
              </div>
              <Switch
                checked={notifications.emailNewAppointment}
                onCheckedChange={() => handleToggle('emailNewAppointment')}
              />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <Label>Cancelamento</Label>
                <p className="text-sm text-gray-500">Receber e-mail quando um cliente cancelar</p>
              </div>
              <Switch
                checked={notifications.emailCancellation}
                onCheckedChange={() => handleToggle('emailCancellation')}
              />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <Label>Lembretes</Label>
                <p className="text-sm text-gray-500">Lembrete dos agendamentos do dia</p>
              </div>
              <Switch
                checked={notifications.emailReminder}
                onCheckedChange={() => handleToggle('emailReminder')}
              />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <Label>Relatório Diário</Label>
                <p className="text-sm text-gray-500">Resumo do dia anterior</p>
              </div>
              <Switch
                checked={notifications.emailDailyReport}
                onCheckedChange={() => handleToggle('emailDailyReport')}
              />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <Label>Relatório Semanal</Label>
                <p className="text-sm text-gray-500">Resumo da semana toda segunda</p>
              </div>
              <Switch
                checked={notifications.emailWeeklyReport}
                onCheckedChange={() => handleToggle('emailWeeklyReport')}
              />
            </div>
          </CardContent>
        </Card>

        {/* Push Notifications */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-purple-600" />
              Notificações Push
            </CardTitle>
            <CardDescription>
              Alertas em tempo real no navegador
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <Label>Novo Agendamento</Label>
                <p className="text-sm text-gray-500">Alerta quando um cliente agendar</p>
              </div>
              <Switch
                checked={notifications.pushNewAppointment}
                onCheckedChange={() => handleToggle('pushNewAppointment')}
              />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <Label>Cancelamento</Label>
                <p className="text-sm text-gray-500">Alerta quando um cliente cancelar</p>
              </div>
              <Switch
                checked={notifications.pushCancellation}
                onCheckedChange={() => handleToggle('pushCancellation')}
              />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <Label>Lembrete de Horário</Label>
                <p className="text-sm text-gray-500">Lembrete 15min antes do atendimento</p>
              </div>
              <Switch
                checked={notifications.pushReminder}
                onCheckedChange={() => handleToggle('pushReminder')}
              />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <Label>Estoque Baixo</Label>
                <p className="text-sm text-gray-500">Alerta quando produto atingir mínimo</p>
              </div>
              <Switch
                checked={notifications.pushLowStock}
                onCheckedChange={() => handleToggle('pushLowStock')}
              />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <Label>Nova Avaliação</Label>
                <p className="text-sm text-gray-500">Alerta quando cliente avaliar</p>
              </div>
              <Switch
                checked={notifications.pushNewReview}
                onCheckedChange={() => handleToggle('pushNewReview')}
              />
            </div>
          </CardContent>
        </Card>

        {/* SMS Notifications */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-purple-600" />
              Notificações por SMS
            </CardTitle>
            <CardDescription>
              Alertas importantes por mensagem de texto
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="p-4 bg-yellow-50 rounded-lg flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-yellow-800">SMS tem custo adicional</p>
                <p className="text-xs text-yellow-700">Cada SMS enviado será cobrado do seu saldo</p>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label>Novo Agendamento</Label>
                <p className="text-sm text-gray-500">SMS quando um cliente agendar</p>
              </div>
              <Switch
                checked={notifications.smsNewAppointment}
                onCheckedChange={() => handleToggle('smsNewAppointment')}
              />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <Label>Cancelamento</Label>
                <p className="text-sm text-gray-500">SMS quando um cliente cancelar</p>
              </div>
              <Switch
                checked={notifications.smsCancellation}
                onCheckedChange={() => handleToggle('smsCancellation')}
              />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <Label>Lembrete</Label>
                <p className="text-sm text-gray-500">SMS lembrete antes do horário</p>
              </div>
              <Switch
                checked={notifications.smsReminder}
                onCheckedChange={() => handleToggle('smsReminder')}
              />
            </div>
          </CardContent>
        </Card>

        {/* Client Notifications */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-purple-600" />
              Notificações para Clientes
            </CardTitle>
            <CardDescription>
              Lembretes automáticos para seus clientes
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <Label>Confirmação de Agendamento</Label>
                <p className="text-sm text-gray-500">Enviar confirmação ao agendar</p>
              </div>
              <Switch
                checked={notifications.clientConfirmation}
                onCheckedChange={() => handleToggle('clientConfirmation')}
              />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <Label>Lembrete 24h antes</Label>
                <p className="text-sm text-gray-500">Lembrar cliente um dia antes</p>
              </div>
              <Switch
                checked={notifications.clientReminder24h}
                onCheckedChange={() => handleToggle('clientReminder24h')}
              />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <Label>Lembrete 2h antes</Label>
                <p className="text-sm text-gray-500">Lembrar cliente 2 horas antes</p>
              </div>
              <Switch
                checked={notifications.clientReminder2h}
                onCheckedChange={() => handleToggle('clientReminder2h')}
              />
            </div>

            <div className="space-y-2 pt-4">
              <Label>Canal de Notificação do Cliente</Label>
              <Select defaultValue="whatsapp">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="whatsapp">WhatsApp</SelectItem>
                  <SelectItem value="sms">SMS</SelectItem>
                  <SelectItem value="email">E-mail</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
