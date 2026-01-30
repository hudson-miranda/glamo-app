'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Building2,
  MapPin,
  Clock,
  Phone,
  Globe,
  Instagram,
  ArrowRight,
  ArrowLeft,
  Loader2,
  Check,
  Sparkles,
  Scissors,
  Store,
} from 'lucide-react';

const businessTypes = [
  { value: 'salon', label: 'Salão de Beleza', icon: Scissors },
  { value: 'barbershop', label: 'Barbearia', icon: Scissors },
  { value: 'clinic', label: 'Clínica de Estética', icon: Sparkles },
  { value: 'spa', label: 'Spa / Day Spa', icon: Sparkles },
  { value: 'nails', label: 'Esmalteria / Nail Designer', icon: Sparkles },
  { value: 'makeup', label: 'Studio de Maquiagem', icon: Sparkles },
  { value: 'tattoo', label: 'Estúdio de Tatuagem', icon: Store },
  { value: 'other', label: 'Outro', icon: Store },
];

const defaultSchedule = {
  monday: { open: '09:00', close: '18:00', enabled: true },
  tuesday: { open: '09:00', close: '18:00', enabled: true },
  wednesday: { open: '09:00', close: '18:00', enabled: true },
  thursday: { open: '09:00', close: '18:00', enabled: true },
  friday: { open: '09:00', close: '18:00', enabled: true },
  saturday: { open: '09:00', close: '14:00', enabled: true },
  sunday: { open: '09:00', close: '14:00', enabled: false },
};

const dayNames: Record<string, string> = {
  monday: 'Segunda-feira',
  tuesday: 'Terça-feira',
  wednesday: 'Quarta-feira',
  thursday: 'Quinta-feira',
  friday: 'Sexta-feira',
  saturday: 'Sábado',
  sunday: 'Domingo',
};

export default function CreateBusinessPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    // Step 1: Informações básicas
    businessName: '',
    businessType: '',
    description: '',
    // Step 2: Contato e localização
    phone: '',
    whatsapp: '',
    email: '',
    website: '',
    instagram: '',
    // Step 3: Endereço
    zipCode: '',
    street: '',
    number: '',
    complement: '',
    neighborhood: '',
    city: '',
    state: '',
    // Step 4: Horários
    schedule: defaultSchedule,
  });

  const totalSteps = 4;

  useEffect(() => {
    // Verificar autenticação
    const token = localStorage.getItem('accessToken');
    if (!token) {
      router.push('/login');
    }
  }, [router]);

  const formatPhone = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 11) {
      return numbers.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
    }
    return value;
  };

  const handleZipCodeChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '');
    const formatted = value.replace(/(\d{5})(\d{3})/, '$1-$2');
    setFormData({ ...formData, zipCode: formatted });

    // Buscar endereço via CEP
    if (value.length === 8) {
      try {
        const response = await fetch(`https://viacep.com.br/ws/${value}/json/`);
        const data = await response.json();
        if (!data.erro) {
          setFormData(prev => ({
            ...prev,
            street: data.logradouro || '',
            neighborhood: data.bairro || '',
            city: data.localidade || '',
            state: data.uf || '',
          }));
        }
      } catch (err) {
        console.error('Erro ao buscar CEP:', err);
      }
    }
  };

  const handleScheduleChange = (day: string, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      schedule: {
        ...prev.schedule,
        [day]: {
          ...prev.schedule[day as keyof typeof prev.schedule],
          [field]: value,
        },
      },
    }));
  };

  const handleSubmit = async () => {
    setIsLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3333/api/v1'}/tenants`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            name: formData.businessName,
            businessType: formData.businessType,
            description: formData.description,
            phone: formData.phone.replace(/\D/g, ''),
            whatsapp: formData.whatsapp.replace(/\D/g, ''),
            email: formData.email,
            website: formData.website,
            instagram: formData.instagram,
            address: {
              zipCode: formData.zipCode.replace(/\D/g, ''),
              street: formData.street,
              number: formData.number,
              complement: formData.complement,
              neighborhood: formData.neighborhood,
              city: formData.city,
              state: formData.state,
            },
            schedule: formData.schedule,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Erro ao criar estabelecimento');
      }

      // Redirecionar para o dashboard
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Erro ao criar estabelecimento');
    } finally {
      setIsLoading(false);
    }
  };

  const canContinue = () => {
    switch (step) {
      case 1:
        return formData.businessName && formData.businessType;
      case 2:
        return formData.phone;
      case 3:
        return formData.city && formData.state;
      case 4:
        return true;
      default:
        return false;
    }
  };

  const handleNext = () => {
    if (step < totalSteps) {
      setStep(step + 1);
    } else {
      handleSubmit();
    }
  };

  const inputClass = "w-full px-4 py-3 border border-gray-200 rounded-xl bg-white text-gray-900 placeholder:text-gray-400 focus:ring-2 focus:ring-ruby-500/20 focus:border-ruby-500 transition-all outline-none";

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <Link href="/onboarding" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 font-medium transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Voltar
          </Link>
          <Link href="/" className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-ruby-500 to-ruby-700 flex items-center justify-center shadow-lg shadow-ruby-500/25">
              <span className="text-white font-bold text-lg">G</span>
            </div>
          </Link>
        </div>

        {/* Progress */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">Passo {step} de {totalSteps}</span>
            <span className="text-sm text-gray-500">{Math.round((step / totalSteps) * 100)}%</span>
          </div>
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-ruby-500 to-ruby-600 transition-all duration-300"
              style={{ width: `${(step / totalSteps) * 100}%` }}
            />
          </div>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-xl shadow-gray-900/5 border border-gray-100 p-8">
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-100 text-red-600 rounded-xl text-sm">
              {error}
            </div>
          )}

          {/* Step 1: Informações básicas */}
          {step === 1 && (
            <div className="space-y-6">
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-ruby-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Building2 className="w-8 h-8 text-ruby-600" />
                </div>
                <h1 className="text-2xl font-bold text-gray-900 mb-2">
                  Sobre seu estabelecimento
                </h1>
                <p className="text-gray-500">
                  Conte-nos sobre seu negócio
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nome do Estabelecimento *
                </label>
                <input
                  type="text"
                  value={formData.businessName}
                  onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                  className={inputClass}
                  placeholder="Ex: Studio Maria Beauty"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Tipo de Negócio *
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {businessTypes.map((type) => {
                    const Icon = type.icon;
                    return (
                      <button
                        key={type.value}
                        type="button"
                        onClick={() => setFormData({ ...formData, businessType: type.value })}
                        className={`p-4 rounded-xl border-2 text-left transition-all ${
                          formData.businessType === type.value
                            ? 'border-ruby-500 bg-ruby-50'
                            : 'border-gray-200 hover:border-ruby-300'
                        }`}
                      >
                        <Icon className={`w-5 h-5 mb-2 ${
                          formData.businessType === type.value ? 'text-ruby-600' : 'text-gray-400'
                        }`} />
                        <span className={`text-sm font-medium ${
                          formData.businessType === type.value ? 'text-ruby-900' : 'text-gray-700'
                        }`}>
                          {type.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Descrição (opcional)
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className={`${inputClass} resize-none`}
                  placeholder="Conte um pouco sobre seu estabelecimento..."
                />
              </div>
            </div>
          )}

          {/* Step 2: Contato */}
          {step === 2 && (
            <div className="space-y-6">
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-ruby-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Phone className="w-8 h-8 text-ruby-600" />
                </div>
                <h1 className="text-2xl font-bold text-gray-900 mb-2">
                  Contato e redes sociais
                </h1>
                <p className="text-gray-500">
                  Como seus clientes podem te encontrar?
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Telefone *
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: formatPhone(e.target.value) })}
                    className={inputClass}
                    placeholder="(11) 99999-9999"
                    maxLength={15}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    WhatsApp
                  </label>
                  <input
                    type="tel"
                    value={formData.whatsapp}
                    onChange={(e) => setFormData({ ...formData, whatsapp: formatPhone(e.target.value) })}
                    className={inputClass}
                    placeholder="(11) 99999-9999"
                    maxLength={15}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email do estabelecimento
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className={inputClass}
                  placeholder="contato@seuestablecimento.com"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Globe className="w-4 h-4 inline mr-1" />
                    Website
                  </label>
                  <input
                    type="url"
                    value={formData.website}
                    onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                    className={inputClass}
                    placeholder="www.seusite.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Instagram className="w-4 h-4 inline mr-1" />
                    Instagram
                  </label>
                  <input
                    type="text"
                    value={formData.instagram}
                    onChange={(e) => setFormData({ ...formData, instagram: e.target.value })}
                    className={inputClass}
                    placeholder="@seuinstagram"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Endereço */}
          {step === 3 && (
            <div className="space-y-6">
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-ruby-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <MapPin className="w-8 h-8 text-ruby-600" />
                </div>
                <h1 className="text-2xl font-bold text-gray-900 mb-2">
                  Endereço
                </h1>
                <p className="text-gray-500">
                  Onde seu estabelecimento está localizado?
                </p>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    CEP
                  </label>
                  <input
                    type="text"
                    value={formData.zipCode}
                    onChange={handleZipCodeChange}
                    className={inputClass}
                    placeholder="00000-000"
                    maxLength={9}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Rua / Logradouro
                </label>
                <input
                  type="text"
                  value={formData.street}
                  onChange={(e) => setFormData({ ...formData, street: e.target.value })}
                  className={inputClass}
                  placeholder="Nome da rua"
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Número
                  </label>
                  <input
                    type="text"
                    value={formData.number}
                    onChange={(e) => setFormData({ ...formData, number: e.target.value })}
                    className={inputClass}
                    placeholder="123"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Complemento
                  </label>
                  <input
                    type="text"
                    value={formData.complement}
                    onChange={(e) => setFormData({ ...formData, complement: e.target.value })}
                    className={inputClass}
                    placeholder="Sala 1, Bloco A..."
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Bairro
                </label>
                <input
                  type="text"
                  value={formData.neighborhood}
                  onChange={(e) => setFormData({ ...formData, neighborhood: e.target.value })}
                  className={inputClass}
                  placeholder="Nome do bairro"
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Cidade *
                  </label>
                  <input
                    type="text"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    className={inputClass}
                    placeholder="São Paulo"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Estado *
                  </label>
                  <input
                    type="text"
                    value={formData.state}
                    onChange={(e) => setFormData({ ...formData, state: e.target.value.toUpperCase() })}
                    className={inputClass}
                    placeholder="SP"
                    maxLength={2}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Horários */}
          {step === 4 && (
            <div className="space-y-6">
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-ruby-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Clock className="w-8 h-8 text-ruby-600" />
                </div>
                <h1 className="text-2xl font-bold text-gray-900 mb-2">
                  Horário de funcionamento
                </h1>
                <p className="text-gray-500">
                  Defina os horários em que você atende
                </p>
              </div>

              <div className="space-y-3">
                {Object.entries(formData.schedule).map(([day, schedule]) => (
                  <div key={day} className="flex items-center gap-4 p-3 rounded-xl bg-gray-50 border border-gray-100">
                    <label className="flex items-center gap-2 w-36">
                      <input
                        type="checkbox"
                        checked={schedule.enabled}
                        onChange={(e) => handleScheduleChange(day, 'enabled', e.target.checked)}
                        className="w-4 h-4 rounded text-ruby-600 focus:ring-ruby-500 border-gray-300"
                      />
                      <span className={`text-sm font-medium ${schedule.enabled ? 'text-gray-900' : 'text-gray-400'}`}>
                        {dayNames[day]}
                      </span>
                    </label>
                    
                    {schedule.enabled && (
                      <>
                        <input
                          type="time"
                          value={schedule.open}
                          onChange={(e) => handleScheduleChange(day, 'open', e.target.value)}
                          className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-ruby-500/20 focus:border-ruby-500 outline-none"
                        />
                        <span className="text-gray-400">às</span>
                        <input
                          type="time"
                          value={schedule.close}
                          onChange={(e) => handleScheduleChange(day, 'close', e.target.value)}
                          className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-ruby-500/20 focus:border-ruby-500 outline-none"
                        />
                      </>
                    )}
                    
                    {!schedule.enabled && (
                      <span className="text-sm text-gray-400 italic">Fechado</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="flex gap-4 mt-8">
            {step > 1 && (
              <button
                type="button"
                onClick={() => setStep(step - 1)}
                className="flex-1 py-3.5 border border-gray-200 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 hover:border-gray-300 transition-all"
              >
                Voltar
              </button>
            )}
            <button
              type="button"
              onClick={handleNext}
              disabled={!canContinue() || isLoading}
              className="flex-1 py-3.5 bg-gradient-to-r from-ruby-600 to-ruby-700 text-white rounded-xl font-semibold hover:from-ruby-700 hover:to-ruby-800 transition-all shadow-lg shadow-ruby-600/25 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Criando...
                </>
              ) : step === totalSteps ? (
                <>
                  Criar Estabelecimento
                  <Check className="w-5 h-5" />
                </>
              ) : (
                <>
                  Continuar
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
