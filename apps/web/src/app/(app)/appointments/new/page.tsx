'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { 
  Calendar, 
  ArrowLeft, 
  Clock,
  User,
  Scissors,
  UserCog,
  CalendarDays,
  Search,
  Check
} from 'lucide-react';
import { 
  Button,
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle,
  AnimatedCard,
  Skeleton,
  SkeletonCard,
} from '@/components/ui';

// Mock data
const customers = [
  { id: '1', name: 'Maria Silva', phone: '(11) 99999-1234' },
  { id: '2', name: 'Ana Santos', phone: '(11) 99999-5678' },
  { id: '3', name: 'Julia Costa', phone: '(11) 99999-9012' },
  { id: '4', name: 'Carla Oliveira', phone: '(11) 99999-3456' },
];

const services = [
  { id: '1', name: 'Corte Feminino', duration: 45, price: 80 },
  { id: '2', name: 'Escova', duration: 30, price: 50 },
  { id: '3', name: 'Coloração', duration: 120, price: 180 },
  { id: '4', name: 'Manicure', duration: 40, price: 35 },
  { id: '5', name: 'Pedicure', duration: 50, price: 45 },
];

const professionals = [
  { id: '1', name: 'Ana Paula', available: true },
  { id: '2', name: 'Carla Souza', available: true },
  { id: '3', name: 'Fernanda Lima', available: false },
  { id: '4', name: 'Juliana Martins', available: true },
];

const timeSlots = [
  '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
  '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00', '17:30'
];

export default function NewAppointmentPage() {
  const router = useRouter();
  const [pageLoading, setPageLoading] = useState(true);
  const [step, setStep] = useState(1);
  const [selectedCustomer, setSelectedCustomer] = useState<string | null>(null);
  const [selectedService, setSelectedService] = useState<string | null>(null);
  const [selectedProfessional, setSelectedProfessional] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [searchCustomer, setSearchCustomer] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => setPageLoading(false), 300);
    return () => clearTimeout(timer);
  }, []);

  const filteredCustomers = customers.filter(c => 
    c.name.toLowerCase().includes(searchCustomer.toLowerCase()) ||
    c.phone.includes(searchCustomer)
  );

  const handleSubmit = () => {
    // Aqui faria a criação do agendamento
    router.push('/appointments');
  };

  if (pageLoading) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="space-y-6"
      >
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10 rounded-lg" />
          <div className="space-y-2">
            <Skeleton className="h-7 w-48" />
            <Skeleton className="h-4 w-24" />
          </div>
        </div>
        <div className="flex gap-2">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-2 flex-1 rounded-full" />)}
        </div>
        <SkeletonCard className="h-72" />
        <div className="flex justify-between">
          <Skeleton className="h-10 w-24" />
          <Skeleton className="h-10 w-24" />
        </div>
      </motion.div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-4"
      >
        <Button 
          variant="ghost" 
          size="icon"
          onClick={() => router.back()}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Novo Agendamento</h1>
          <p className="text-gray-500 dark:text-gray-400">
            Passo {step} de 4
          </p>
        </div>
      </motion.div>

      {/* Progress */}
      <div className="flex gap-2">
        {[1, 2, 3, 4].map((s) => (
          <div 
            key={s}
            className={`flex-1 h-2 rounded-full transition-colors ${
              s <= step ? 'bg-ruby-500' : 'bg-gray-200 dark:bg-gray-700'
            }`}
          />
        ))}
      </div>

      {/* Step 1: Select Customer */}
      {step === 1 && (
        <AnimatedCard>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5 text-ruby-500" />
              Selecione o Cliente
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar cliente..."
                value={searchCustomer}
                onChange={(e) => setSearchCustomer(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-ruby-500"
              />
            </div>

            <div className="space-y-2">
              {filteredCustomers.map((customer) => (
                <motion.button
                  key={customer.id}
                  whileHover={{ scale: 1.01 }}
                  onClick={() => setSelectedCustomer(customer.id)}
                  className={`w-full p-4 rounded-xl border-2 transition-colors flex items-center justify-between ${
                    selectedCustomer === customer.id
                      ? 'border-ruby-500 bg-ruby-50 dark:bg-ruby-950/30'
                      : 'border-gray-200 dark:border-gray-700 hover:border-ruby-300'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-ruby-100 dark:bg-ruby-900/30 flex items-center justify-center">
                      <span className="text-sm font-medium text-ruby-600">
                        {customer.name.split(' ').map(n => n[0]).join('')}
                      </span>
                    </div>
                    <div className="text-left">
                      <p className="font-medium text-gray-900 dark:text-white">{customer.name}</p>
                      <p className="text-sm text-gray-500">{customer.phone}</p>
                    </div>
                  </div>
                  {selectedCustomer === customer.id && (
                    <Check className="h-5 w-5 text-ruby-500" />
                  )}
                </motion.button>
              ))}
            </div>

            <Button 
              className="w-full bg-ruby-600 hover:bg-ruby-700"
              disabled={!selectedCustomer}
              onClick={() => setStep(2)}
            >
              Continuar
            </Button>
          </CardContent>
        </AnimatedCard>
      )}

      {/* Step 2: Select Service */}
      {step === 2 && (
        <AnimatedCard>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Scissors className="h-5 w-5 text-ruby-500" />
              Selecione o Serviço
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              {services.map((service) => (
                <motion.button
                  key={service.id}
                  whileHover={{ scale: 1.01 }}
                  onClick={() => setSelectedService(service.id)}
                  className={`w-full p-4 rounded-xl border-2 transition-colors flex items-center justify-between ${
                    selectedService === service.id
                      ? 'border-ruby-500 bg-ruby-50 dark:bg-ruby-950/30'
                      : 'border-gray-200 dark:border-gray-700 hover:border-ruby-300'
                  }`}
                >
                  <div className="text-left">
                    <p className="font-medium text-gray-900 dark:text-white">{service.name}</p>
                    <p className="text-sm text-gray-500">{service.duration} min</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-semibold text-gray-900 dark:text-white">
                      R$ {service.price.toFixed(2)}
                    </span>
                    {selectedService === service.id && (
                      <Check className="h-5 w-5 text-ruby-500" />
                    )}
                  </div>
                </motion.button>
              ))}
            </div>

            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStep(1)}>
                Voltar
              </Button>
              <Button 
                className="flex-1 bg-ruby-600 hover:bg-ruby-700"
                disabled={!selectedService}
                onClick={() => setStep(3)}
              >
                Continuar
              </Button>
            </div>
          </CardContent>
        </AnimatedCard>
      )}

      {/* Step 3: Select Professional */}
      {step === 3 && (
        <AnimatedCard>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserCog className="h-5 w-5 text-ruby-500" />
              Selecione o Profissional
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              {professionals.map((prof) => (
                <motion.button
                  key={prof.id}
                  whileHover={{ scale: 1.01 }}
                  onClick={() => prof.available && setSelectedProfessional(prof.id)}
                  disabled={!prof.available}
                  className={`w-full p-4 rounded-xl border-2 transition-colors flex items-center justify-between ${
                    selectedProfessional === prof.id
                      ? 'border-ruby-500 bg-ruby-50 dark:bg-ruby-950/30'
                      : prof.available
                      ? 'border-gray-200 dark:border-gray-700 hover:border-ruby-300'
                      : 'border-gray-200 dark:border-gray-700 opacity-50 cursor-not-allowed'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                      <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
                        {prof.name.split(' ').map(n => n[0]).join('')}
                      </span>
                    </div>
                    <div className="text-left">
                      <p className="font-medium text-gray-900 dark:text-white">{prof.name}</p>
                      <p className={`text-sm ${prof.available ? 'text-emerald-500' : 'text-red-500'}`}>
                        {prof.available ? 'Disponível' : 'Indisponível'}
                      </p>
                    </div>
                  </div>
                  {selectedProfessional === prof.id && (
                    <Check className="h-5 w-5 text-ruby-500" />
                  )}
                </motion.button>
              ))}
            </div>

            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStep(2)}>
                Voltar
              </Button>
              <Button 
                className="flex-1 bg-ruby-600 hover:bg-ruby-700"
                disabled={!selectedProfessional}
                onClick={() => setStep(4)}
              >
                Continuar
              </Button>
            </div>
          </CardContent>
        </AnimatedCard>
      )}

      {/* Step 4: Select Date/Time */}
      {step === 4 && (
        <AnimatedCard>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarDays className="h-5 w-5 text-ruby-500" />
              Selecione Data e Horário
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Data
              </label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-ruby-500"
              />
            </div>

            {selectedDate && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Horário
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {timeSlots.map((time) => (
                    <button
                      key={time}
                      onClick={() => setSelectedTime(time)}
                      className={`p-3 rounded-xl border-2 text-sm font-medium transition-colors ${
                        selectedTime === time
                          ? 'border-ruby-500 bg-ruby-50 dark:bg-ruby-950/30 text-ruby-600'
                          : 'border-gray-200 dark:border-gray-700 hover:border-ruby-300'
                      }`}
                    >
                      {time}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStep(3)}>
                Voltar
              </Button>
              <Button 
                className="flex-1 bg-ruby-600 hover:bg-ruby-700"
                disabled={!selectedDate || !selectedTime}
                onClick={handleSubmit}
              >
                Confirmar Agendamento
              </Button>
            </div>
          </CardContent>
        </AnimatedCard>
      )}
    </div>
  );
}
