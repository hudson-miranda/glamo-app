'use client';

import { useState } from 'react';
import { usePageData } from '@/hooks';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Bell, 
  Check,
  X,
  Calendar,
  User,
  DollarSign,
  AlertTriangle,
  Gift,
  MessageSquare,
  Settings,
  Trash2,
  CheckCheck
} from 'lucide-react';
import { 
  Button,
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle,
  StaggerContainer, 
  StaggerItem,
  Skeleton,
  SkeletonList,
} from '@/components/ui';

// Tipo para notificações
interface Notification {
  id: string;
  type: 'appointment' | 'payment' | 'customer' | 'alert' | 'promotion' | 'review';
  title: string;
  message: string;
  time: string;
  read: boolean;
  icon: typeof Calendar;
}

// Mock data
const mockNotifications: Notification[] = [
  {
    id: '1',
    type: 'appointment',
    title: 'Novo agendamento',
    message: 'Maria Silva agendou Corte + Escova para amanhã às 14:00',
    time: '5 min atrás',
    read: false,
    icon: Calendar
  },
  {
    id: '2',
    type: 'payment',
    title: 'Pagamento recebido',
    message: 'Você recebeu R$ 250,00 de Ana Oliveira via PIX',
    time: '15 min atrás',
    read: false,
    icon: DollarSign
  },
  {
    id: '3',
    type: 'customer',
    title: 'Novo cliente',
    message: 'Pedro Santos criou uma conta e agendou sua primeira visita',
    time: '1 hora atrás',
    read: false,
    icon: User
  },
  {
    id: '4',
    type: 'alert',
    title: 'Estoque baixo',
    message: 'O produto "Tintura 60ml - Castanho" está com estoque abaixo do mínimo',
    time: '2 horas atrás',
    read: true,
    icon: AlertTriangle
  },
  {
    id: '5',
    type: 'promotion',
    title: 'Campanha finalizada',
    message: 'A campanha "Promoção de Janeiro" foi concluída com 45 conversões',
    time: '3 horas atrás',
    read: true,
    icon: Gift
  },
  {
    id: '6',
    type: 'review',
    title: 'Nova avaliação',
    message: 'Carla Mendes deixou uma avaliação 5 estrelas',
    time: '5 horas atrás',
    read: true,
    icon: MessageSquare
  },
];

const typeColors = {
  appointment: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400',
  payment: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400',
  customer: 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400',
  alert: 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400',
  promotion: 'bg-pink-100 dark:bg-pink-900/30 text-pink-600 dark:text-pink-400',
  review: 'bg-ruby-100 dark:bg-ruby-900/30 text-ruby-600 dark:text-ruby-400',
};

// Função para buscar notificações - substituir por API real
const fetchNotifications = async (): Promise<Notification[]> => {
  // TODO: Substituir por chamada real à API
  await new Promise(resolve => setTimeout(resolve, 100));
  return mockNotifications;
};

export default function NotificationsPage() {
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  
  // Hook de dados assíncronos com cache
  const { data: initialNotifications = [], isLoading } = usePageData(
    fetchNotifications,
    { cacheKey: 'notifications-list', initialData: mockNotifications }
  );

  const [notificationList, setNotificationList] = useState(initialNotifications);
  
  // Atualiza a lista quando os dados iniciais mudam
  useState(() => {
    if (initialNotifications.length > 0) {
      setNotificationList(initialNotifications);
    }
  });

  const unreadCount = notificationList.filter(n => !n.read).length;

  const filteredNotifications = filter === 'all' 
    ? notificationList 
    : notificationList.filter(n => !n.read);

  const markAsRead = (id: string) => {
    setNotificationList(prev => 
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    );
  };

  const markAllAsRead = () => {
    setNotificationList(prev => 
      prev.map(n => ({ ...n, read: true }))
    );
  };

  const deleteNotification = (id: string) => {
    setNotificationList(prev => prev.filter(n => n.id !== id));
  };

  if (isLoading) {
    return (
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="space-y-6"
      >
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <Skeleton className="h-8 w-36" />
            <Skeleton className="h-4 w-56" />
          </div>
          <Skeleton className="h-11 w-48 rounded-xl" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-10 w-24 rounded-xl" />
          <Skeleton className="h-10 w-32 rounded-xl" />
        </div>
        <SkeletonList rows={6} />
      </motion.div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="space-y-6"
    >
      {/* Header */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
      >
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
            <Bell className="w-7 h-7 text-ruby-500" />
            Notificações
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            {unreadCount > 0 ? `${unreadCount} notificação(ões) não lida(s)` : 'Todas as notificações lidas'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <Button variant="outline" onClick={markAllAsRead} className="gap-2 rounded-xl">
              <CheckCheck className="h-4 w-4" />
              Marcar todas como lidas
            </Button>
          )}
          <Button variant="ghost" size="icon">
            <Settings className="h-5 w-5" />
          </Button>
        </div>
      </motion.div>

      {/* Filter */}
      <div className="flex gap-2">
        <Button
          variant={filter === 'all' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilter('all')}
        >
          Todas ({notificationList.length})
        </Button>
        <Button
          variant={filter === 'unread' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilter('unread')}
        >
          Não lidas ({unreadCount})
        </Button>
      </div>

      {/* Notifications List */}
      <Card>
        <CardContent className="p-0">
          <AnimatePresence mode="popLayout">
            {filteredNotifications.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center justify-center py-12 text-center"
              >
                <div className="p-4 bg-gray-100 dark:bg-gray-800 rounded-full mb-4">
                  <Bell className="h-8 w-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                  Nenhuma notificação
                </h3>
                <p className="text-gray-500 dark:text-gray-400">
                  {filter === 'unread' ? 'Todas as notificações foram lidas' : 'Você não tem notificações'}
                </p>
              </motion.div>
            ) : (
              filteredNotifications.map((notification) => (
                <motion.div
                  key={notification.id}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -100 }}
                  className={`flex items-start gap-4 p-4 border-b border-gray-100 dark:border-gray-800 last:border-0 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors ${
                    !notification.read ? 'bg-ruby-50/50 dark:bg-ruby-950/20' : ''
                  }`}
                >
                  <div className={`p-2.5 rounded-xl ${typeColors[notification.type as keyof typeof typeColors]}`}>
                    <notification.icon className="h-5 w-5" />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="font-semibold text-gray-900 dark:text-white">
                          {notification.title}
                          {!notification.read && (
                            <span className="ml-2 inline-block w-2 h-2 bg-ruby-500 rounded-full" />
                          )}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-0.5">
                          {notification.message}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">{notification.time}</p>
                      </div>
                      
                      <div className="flex items-center gap-1 flex-shrink-0">
                        {!notification.read && (
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8"
                            onClick={() => markAsRead(notification.id)}
                          >
                            <Check className="h-4 w-4" />
                          </Button>
                        )}
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 text-gray-400 hover:text-red-500"
                          onClick={() => deleteNotification(notification.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))
            )}
          </AnimatePresence>
        </CardContent>
      </Card>
    </motion.div>
  );
}
