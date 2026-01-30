import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  useColorScheme,
} from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Ionicons } from '@expo/vector-icons';
import { notificationsService } from '@/services/notifications';

const notificationIcons: Record<string, string> = {
  appointment: 'calendar-outline',
  payment: 'card-outline',
  marketing: 'megaphone-outline',
  system: 'information-circle-outline',
  reminder: 'alarm-outline',
};

export default function NotificationsScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const queryClient = useQueryClient();

  const {
    data: notifications = [],
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => notificationsService.list({ limit: 50 }),
  });

  const markAsReadMutation = useMutation({
    mutationFn: (id: string) => notificationsService.markAsRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  const markAllAsReadMutation = useMutation({
    mutationFn: () => notificationsService.markAllAsRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  const styles = createStyles(isDark);

  const unreadCount = notifications.filter((n: any) => !n.readAt).length;

  const renderItem = ({ item }: { item: any }) => {
    const iconName = notificationIcons[item.category] || 'notifications-outline';
    const isUnread = !item.readAt;

    return (
      <TouchableOpacity
        style={[styles.card, isUnread && styles.cardUnread]}
        onPress={() => {
          if (isUnread) {
            markAsReadMutation.mutate(item.id);
          }
        }}
      >
        <View
          style={[
            styles.iconContainer,
            isUnread && styles.iconContainerUnread,
          ]}
        >
          <Ionicons
            name={iconName as any}
            size={24}
            color={isUnread ? '#d946ef' : '#6b7280'}
          />
        </View>
        <View style={styles.content}>
          <Text style={[styles.title, isUnread && styles.titleUnread]}>
            {item.title}
          </Text>
          <Text style={styles.body} numberOfLines={2}>
            {item.body}
          </Text>
          <Text style={styles.time}>
            {formatDistanceToNow(new Date(item.createdAt), {
              addSuffix: true,
              locale: ptBR,
            })}
          </Text>
        </View>
        {isUnread && <View style={styles.unreadDot} />}
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {unreadCount > 0 && (
        <View style={styles.header}>
          <Text style={styles.unreadText}>
            {unreadCount} não lida{unreadCount > 1 ? 's' : ''}
          </Text>
          <TouchableOpacity
            onPress={() => markAllAsReadMutation.mutate()}
            disabled={markAllAsReadMutation.isPending}
          >
            <Text style={styles.markAllText}>Marcar todas como lidas</Text>
          </TouchableOpacity>
        </View>
      )}

      <FlatList
        data={notifications}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={refetch}
            tintColor="#d946ef"
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons
              name="notifications-off-outline"
              size={64}
              color={isDark ? '#374151' : '#d1d5db'}
            />
            <Text style={styles.emptyTitle}>Sem notificações</Text>
            <Text style={styles.emptyText}>
              Você não tem nenhuma notificação no momento.
            </Text>
          </View>
        }
      />
    </View>
  );
}

const createStyles = (isDark: boolean) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: isDark ? '#0a0a0a' : '#f9fafb',
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 12,
      backgroundColor: isDark ? '#1a1a1a' : '#ffffff',
      borderBottomWidth: 1,
      borderBottomColor: isDark ? '#374151' : '#e5e7eb',
    },
    unreadText: {
      fontSize: 14,
      color: isDark ? '#d1d5db' : '#4b5563',
    },
    markAllText: {
      fontSize: 14,
      color: '#d946ef',
      fontWeight: '500',
    },
    list: {
      padding: 16,
    },
    card: {
      flexDirection: 'row',
      backgroundColor: isDark ? '#1a1a1a' : '#ffffff',
      borderRadius: 12,
      padding: 16,
      marginBottom: 8,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 2,
      elevation: 2,
    },
    cardUnread: {
      borderLeftWidth: 3,
      borderLeftColor: '#d946ef',
    },
    iconContainer: {
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: isDark ? '#374151' : '#f3f4f6',
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 12,
    },
    iconContainerUnread: {
      backgroundColor: '#fdf4ff',
    },
    content: {
      flex: 1,
    },
    title: {
      fontSize: 16,
      color: isDark ? '#d1d5db' : '#4b5563',
      marginBottom: 4,
    },
    titleUnread: {
      fontWeight: '600',
      color: isDark ? '#ffffff' : '#1f2937',
    },
    body: {
      fontSize: 14,
      color: '#6b7280',
      lineHeight: 20,
      marginBottom: 8,
    },
    time: {
      fontSize: 12,
      color: '#9ca3af',
    },
    unreadDot: {
      width: 10,
      height: 10,
      borderRadius: 5,
      backgroundColor: '#d946ef',
      alignSelf: 'center',
    },
    emptyContainer: {
      alignItems: 'center',
      paddingVertical: 64,
    },
    emptyTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: isDark ? '#ffffff' : '#1f2937',
      marginTop: 16,
      marginBottom: 8,
    },
    emptyText: {
      fontSize: 14,
      color: '#6b7280',
      textAlign: 'center',
    },
  });
