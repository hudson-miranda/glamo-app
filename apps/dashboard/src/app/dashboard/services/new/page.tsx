'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
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
  Scissors,
  Clock,
  DollarSign,
  Users,
  Loader2,
  Check,
  ImagePlus,
} from 'lucide-react';

// Breadcrumb component
function Breadcrumb() {
  return (
    <nav className="flex items-center space-x-2 text-sm text-gray-500 mb-6">
      <Link href="/dashboard" className="hover:text-gray-700 flex items-center">
        <Home className="h-4 w-4" />
      </Link>
      <ChevronRight className="h-4 w-4" />
      <Link href="/dashboard/services" className="hover:text-gray-700">
        Serviços
      </Link>
      <ChevronRight className="h-4 w-4" />
      <span className="text-gray-900 font-medium">Novo Serviço</span>
    </nav>
  );
}

// Mock professionals
const professionals = [
  { id: '1', name: 'Ana Costa' },
  { id: '2', name: 'Carlos Lima' },
  { id: '3', name: 'Fernanda Souza' },
];

export default function NewServicePage() {
  const [isLoading, setIsLoading] = useState(false);
  const [selectedProfessionals, setSelectedProfessionals] = useState<string[]>([]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    // TODO: Implement create service logic
    setTimeout(() => {
      setIsLoading(false);
    }, 2000);
  };

  const toggleProfessional = (professionalId: string) => {
    setSelectedProfessionals(prev =>
      prev.includes(professionalId)
        ? prev.filter(id => id !== professionalId)
        : [...prev, professionalId]
    );
  };

  return (
    <div className="p-6 space-y-6">
      <Breadcrumb />

      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/dashboard/services">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Novo Serviço</h1>
          <p className="text-gray-500 mt-1">Cadastre um novo serviço no sistema</p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Info */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Scissors className="h-5 w-5 text-purple-600" />
                  Informações Básicas
                </CardTitle>
                <CardDescription>
                  Dados principais do serviço
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome do Serviço *</Label>
                  <Input id="name" placeholder="Ex: Corte Feminino" required />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="category">Categoria *</Label>
                  <Select>
                    <SelectTrigger id="category">
                      <SelectValue placeholder="Selecione uma categoria" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="hair">Cabelo</SelectItem>
                      <SelectItem value="barber">Barbearia</SelectItem>
                      <SelectItem value="nails">Unhas</SelectItem>
                      <SelectItem value="makeup">Maquiagem</SelectItem>
                      <SelectItem value="esthetic">Estética</SelectItem>
                      <SelectItem value="other">Outros</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Descrição</Label>
                  <Textarea
                    id="description"
                    placeholder="Descreva o serviço em detalhes..."
                    rows={4}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Duration & Price */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-purple-600" />
                  Duração e Preço
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="duration">Duração (minutos) *</Label>
                    <div className="relative">
                      <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        id="duration"
                        type="number"
                        placeholder="60"
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="price">Preço (R$) *</Label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        id="price"
                        type="number"
                        step="0.01"
                        placeholder="80.00"
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="bufferTime">Intervalo Entre (minutos)</Label>
                    <Input
                      id="bufferTime"
                      type="number"
                      placeholder="0"
                    />
                    <p className="text-xs text-gray-500">Tempo de preparo entre atendimentos</p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="depositValue">Valor do Sinal (R$)</Label>
                    <Input
                      id="depositValue"
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                    />
                    <p className="text-xs text-gray-500">Valor necessário para confirmar agendamento</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Professionals */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-purple-600" />
                  Profissionais
                </CardTitle>
                <CardDescription>
                  Selecione os profissionais que realizam este serviço
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {professionals.map((professional) => (
                    <div
                      key={professional.id}
                      className="flex items-center space-x-2"
                    >
                      <Checkbox
                        id={professional.id}
                        checked={selectedProfessionals.includes(professional.id)}
                        onCheckedChange={() => toggleProfessional(professional.id)}
                      />
                      <label
                        htmlFor={professional.id}
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        {professional.name}
                      </label>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Image */}
            <Card>
              <CardHeader>
                <CardTitle>Imagem</CardTitle>
                <CardDescription>
                  Adicione uma imagem para o serviço (opcional)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="border-2 border-dashed rounded-lg p-8 text-center">
                  <ImagePlus className="h-10 w-10 text-gray-400 mx-auto mb-4" />
                  <p className="text-sm text-gray-500 mb-2">
                    Arraste uma imagem ou clique para selecionar
                  </p>
                  <Button variant="outline" type="button">
                    Selecionar Imagem
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Publicar</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Ativo</p>
                    <p className="text-sm text-gray-500">
                      Disponível para agendamento
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Mostrar Online</p>
                    <p className="text-sm text-gray-500">
                      Visível no agendamento online
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>

                <Button
                  type="submit"
                  className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Salvando...
                    </>
                  ) : (
                    <>
                      <Check className="mr-2 h-4 w-4" />
                      Salvar Serviço
                    </>
                  )}
                </Button>
                <Link href="/dashboard/services">
                  <Button variant="outline" className="w-full">
                    Cancelar
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* Tips */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Dicas</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="text-sm text-gray-600 space-y-2">
                  <li>• Use nomes claros e descritivos</li>
                  <li>• A duração deve incluir tempo de preparo</li>
                  <li>• Adicione uma descrição detalhada para clientes</li>
                  <li>• Selecione todos os profissionais capacitados</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </form>
    </div>
  );
}
