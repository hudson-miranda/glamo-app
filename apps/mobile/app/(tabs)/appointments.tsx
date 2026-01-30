import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  useColorScheme,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { appointmentsService } from '@/services/appointments';

type FilterStatus = 'all' | 'scheduled' | 'confirmed' | 'completed' | 'cancelled';

const statusFilters: { label: string; value: FilterStatus }[] = [
  { label: 'Todos', value: 'all' },
  { label: 'Agendados', value: 'scheduled' },
  { label: 'Confirmados', value: 'confirmed' },
  { label: 'Concluídos', value: 'completed' },
  { label: 'Cancelados', value: 'cancelled' },
];

const statusColors: Record<string, { bg: string; text: string }> = {
  scheduled: { bg: '#fef3c7', text: '#d97706' },
  confirmed: { bg: '#dbeafe', text: '#2563eb' },
  in_progress: { bg: '#e0e7ff', text: '#4f46e5' },
  completed: { bg: '#d1fae5', text: '#059669' },
  cancelled: { bg: '#fee2e2', text: '#dc2626' },
  no_show: { bg: '#f3f4f6', text: '#6b7280' },
};

export default function AppointmentsScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const [filter, setFilter] = useState<FilterStatus>('all');

  const {
    data: appointments = [],
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ['appointments', filter],
    queryFn: () =>
      appointmentsService.list({
        status: filter === 'all' ? undefined : filter,
        limit: 50,
      }),
  });

  const styles = createStyles(isDark);

  const renderItem = ({ item }: { item: any }) => {
    const statusStyle = statusColors[item.status] || statusColors.scheduled;
    
    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => router.push(`/appointment/${item.id}`)}
      >
        <View style={styles.cardHeader}>
          <View style={styles.dateContainer}>
            <Text style={styles.dateDay}>
              {format(new Date(item.startTime), 'd', { locale: ptBR })}
            </Text>
            <Text style={styles.dateMonth}>
              {format(new Date(item.startTime), 'MMM', { locale: ptBR })}
            </Text>
          </View>
          <View style={styles.cardContent}>
            <View style={styles.timeRow}>
              <Ionicons name="time-outline" size={14} color="#6b7280" />
              <Text style={styles.timeText}>
                {format(new Date(item.startTime), 'HH:mm')} -{' '}
                {format(new Date(item.endTime), 'HH:mm')}
              </Text>
            </View>
            <Text style={styles.customerName}>{item.customer?.name}</Text>
            <Text style={styles.serviceName}>{item.service?.name}</Text>
            <View style={styles.professionalRow}>
              <Ionicons name="person-outline" size={14} color="#6b7280" />
              <Text style={styles.professionalName}>
                {item.professional?.name}
              </Text>
            </View>
          </View>
          <View
            style={[
              styles.statusBadge,
              { backgroundColor: statusStyle.bg },
            ]}
          >
            <Text style={[styles.statusText, { color: statusStyle.text }]}>
              {item.status === 'scheduled' && 'Agendado'}
              {item.status === 'confirmed' && 'Confirmado'}
              {item.status === 'in_progress' && 'Em andamento'}
              {item.status === 'completed' && 'Concluído'}
              {item.status === 'cancelled' && 'Cancelado'}
              {item.status === 'no_show' && 'Não compareceu'}
            </Text>
          </View>
        </View>
        <View style={styles.cardFooter}>
          <Text style={styles.priceText}>
            R$ {(item.totalPrice / 100).toFixed(2).replace('.', ',')}
          </Text>
          <Ionicons
            name="chevron-forward"
            size={20}
            color={isDark ? '#6b7280' : '#9ca3af'}
          />
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.filterContainer}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={statusFilters}
          keyExtractor={(item) => item.value}
          contentContainerStyle={styles.filterList}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[
                styles.filterButton,
                filter === item.value && styles.filterButtonActive,
              ]}
              onPress={() => setFilter(item.value)}
            >
              <Text
                style={[
                  styles.filterText,
                  filter === item.value && styles.filterTextActive,
                ]}
              >
                {item.label}
              </Text>
            </TouchableOpacity>
          )}
        />
      </View>

      <FlatList
        data={appointments}
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
              name="calendar-outline"
              size={64}
              color={isDark ? '#374151' : '#d1d5db'}
            />
            <Text style={styles.emptyTitle}>Nenhum agendamento</Text>
            <Text style={styles.emptyText}>
              Não há agendamentos para exibir com o filtro selecionado.
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
    filterContainer: {
      backgroundColor: isDark ? '#1a1a1a' : '#ffffff',
      borderBottomWidth: 1,
      borderBottomColor: isDark ? '#374151' : '#e5e7eb',
    },
    filterList: {
      paddingHorizontal: 16,
      paddingVertical: 12,
    },
    filterButton: {
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 20,
      marginRight: 8,
      backgroundColor: isDark ? '#374151' : '#f3f4f6',
    },
    filterButtonActive: {
      backgroundColor: '#d946ef',
    },
    filterText: {
      fontSize: 14,
      fontWeight: '500',
      color: isDark ? '#d1d5db' : '#4b5563',
    },
    filterTextActive: {
      color: '#ffffff',
    },
    list: {
      padding: 16,
    },
    card: {
      backgroundColor: isDark ? '#1a1a1a' : '#ffffff',
      borderRadius: 12,
      padding: 16,
      marginBottom: 12,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 2,
      elevation: 2,
    },
    cardHeader: {
      flexDirection: 'row',
    },
    dateContainer: {
      width: 48,
      height: 48,
      borderRadius: 8,
      backgroundColor: '#fdf4ff',
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 12,
    },
    dateDay: {
      fontSize: 18,
      fontWeight: 'bold',
      color: '#d946ef',
    },
    dateMonth: {
      fontSize: 10,
      color: '#d946ef',
      textTransform: 'uppercase',
    },
    cardContent: {
      flex: 1,
    },
    timeRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 4,
    },
    timeText: {
      fontSize: 12,
      color: '#6b7280',
      marginLeft: 4,
    },
    customerName: {
      fontSize: 16,
      fontWeight: '600',
      color: isDark ? '#ffffff' : '#1f2937',
      marginBottom: 2,
    },
    serviceName: {
      fontSize: 14,
      color: isDark ? '#d1d5db' : '#4b5563',
      marginBottom: 4,
    },
    professionalRow: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    professionalName: {
      fontSize: 12,
      color: '#6b7280',
      marginLeft: 4,
    },
    statusBadge: {
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 4,
      alignSelf: 'flex-start',
    },
    statusText: {
      fontSize: 10,
      fontWeight: '600',
      textTransform: 'uppercase',
    },
    cardFooter: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginTop: 12,
      paddingTop: 12,
      borderTopWidth: 1,
      borderTopColor: isDark ? '#374151' : '#e5e7eb',
    },
    priceText: {
      fontSize: 16,
      fontWeight: '600',
      color: isDark ? '#ffffff' : '#1f2937',
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
