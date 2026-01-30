import { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  FlatList,
  useColorScheme,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { format, addDays, startOfWeek, isSameDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Ionicons } from '@expo/vector-icons';
import { appointmentsService } from '@/services/appointments';

export default function AgendaScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const [selectedDate, setSelectedDate] = useState(new Date());

  const weekDays = useMemo(() => {
    const start = startOfWeek(selectedDate, { weekStartsOn: 0 });
    return Array.from({ length: 7 }, (_, i) => addDays(start, i));
  }, [selectedDate]);

  const { data: appointments = [], isLoading } = useQuery({
    queryKey: ['appointments', format(selectedDate, 'yyyy-MM-dd')],
    queryFn: () => appointmentsService.getByDate(selectedDate),
  });

  const timeSlots = useMemo(() => {
    const slots = [];
    for (let hour = 8; hour <= 20; hour++) {
      slots.push(`${hour.toString().padStart(2, '0')}:00`);
    }
    return slots;
  }, []);

  const getAppointmentForSlot = (time: string) => {
    return appointments.find((apt: any) => {
      const aptTime = format(new Date(apt.startTime), 'HH:mm');
      return aptTime === time;
    });
  };

  const styles = createStyles(isDark);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.monthTitle}>
          {format(selectedDate, 'MMMM yyyy', { locale: ptBR })}
        </Text>
        <View style={styles.weekContainer}>
          {weekDays.map((day) => {
            const isSelected = isSameDay(day, selectedDate);
            const isToday = isSameDay(day, new Date());
            return (
              <TouchableOpacity
                key={day.toISOString()}
                style={[
                  styles.dayButton,
                  isSelected && styles.dayButtonSelected,
                ]}
                onPress={() => setSelectedDate(day)}
              >
                <Text
                  style={[
                    styles.dayName,
                    isSelected && styles.dayNameSelected,
                  ]}
                >
                  {format(day, 'EEE', { locale: ptBR })}
                </Text>
                <Text
                  style={[
                    styles.dayNumber,
                    isSelected && styles.dayNumberSelected,
                    isToday && !isSelected && styles.dayNumberToday,
                  ]}
                >
                  {format(day, 'd')}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      <ScrollView style={styles.timeline}>
        {timeSlots.map((time) => {
          const appointment = getAppointmentForSlot(time);
          return (
            <View key={time} style={styles.timeSlot}>
              <Text style={styles.timeText}>{time}</Text>
              <View style={styles.slotContent}>
                {appointment ? (
                  <TouchableOpacity style={styles.appointmentCard}>
                    <View style={styles.appointmentHeader}>
                      <Text style={styles.customerName}>
                        {appointment.customer?.name}
                      </Text>
                      <View style={styles.statusBadge}>
                        <Text style={styles.statusText}>
                          {appointment.status}
                        </Text>
                      </View>
                    </View>
                    <Text style={styles.serviceName}>
                      {appointment.service?.name}
                    </Text>
                    <View style={styles.appointmentFooter}>
                      <Ionicons
                        name="time-outline"
                        size={14}
                        color="#6b7280"
                      />
                      <Text style={styles.duration}>
                        {appointment.service?.duration} min
                      </Text>
                      <Ionicons
                        name="person-outline"
                        size={14}
                        color="#6b7280"
                        style={{ marginLeft: 12 }}
                      />
                      <Text style={styles.professional}>
                        {appointment.professional?.name}
                      </Text>
                    </View>
                  </TouchableOpacity>
                ) : (
                  <View style={styles.emptySlot} />
                )}
              </View>
            </View>
          );
        })}
      </ScrollView>

      <TouchableOpacity style={styles.fab}>
        <Ionicons name="add" size={28} color="#ffffff" />
      </TouchableOpacity>
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
      backgroundColor: isDark ? '#1a1a1a' : '#ffffff',
      paddingHorizontal: 16,
      paddingTop: 16,
      paddingBottom: 12,
      borderBottomWidth: 1,
      borderBottomColor: isDark ? '#374151' : '#e5e7eb',
    },
    monthTitle: {
      fontSize: 20,
      fontWeight: 'bold',
      color: isDark ? '#ffffff' : '#1f2937',
      textTransform: 'capitalize',
      marginBottom: 16,
    },
    weekContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
    dayButton: {
      alignItems: 'center',
      paddingVertical: 8,
      paddingHorizontal: 12,
      borderRadius: 12,
    },
    dayButtonSelected: {
      backgroundColor: '#d946ef',
    },
    dayName: {
      fontSize: 12,
      color: isDark ? '#9ca3af' : '#6b7280',
      textTransform: 'uppercase',
      marginBottom: 4,
    },
    dayNameSelected: {
      color: '#ffffff',
    },
    dayNumber: {
      fontSize: 18,
      fontWeight: '600',
      color: isDark ? '#ffffff' : '#1f2937',
    },
    dayNumberSelected: {
      color: '#ffffff',
    },
    dayNumberToday: {
      color: '#d946ef',
    },
    timeline: {
      flex: 1,
      paddingHorizontal: 16,
      paddingTop: 16,
    },
    timeSlot: {
      flexDirection: 'row',
      marginBottom: 8,
      minHeight: 70,
    },
    timeText: {
      width: 50,
      fontSize: 14,
      color: isDark ? '#9ca3af' : '#6b7280',
    },
    slotContent: {
      flex: 1,
      borderLeftWidth: 1,
      borderLeftColor: isDark ? '#374151' : '#e5e7eb',
      paddingLeft: 12,
    },
    emptySlot: {
      height: 60,
    },
    appointmentCard: {
      backgroundColor: isDark ? '#1a1a1a' : '#ffffff',
      borderRadius: 12,
      padding: 12,
      borderLeftWidth: 4,
      borderLeftColor: '#d946ef',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 2,
      elevation: 2,
    },
    appointmentHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 4,
    },
    customerName: {
      fontSize: 16,
      fontWeight: '600',
      color: isDark ? '#ffffff' : '#1f2937',
    },
    statusBadge: {
      backgroundColor: '#fdf4ff',
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: 4,
    },
    statusText: {
      fontSize: 12,
      color: '#d946ef',
      fontWeight: '500',
    },
    serviceName: {
      fontSize: 14,
      color: isDark ? '#d1d5db' : '#4b5563',
      marginBottom: 8,
    },
    appointmentFooter: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    duration: {
      fontSize: 12,
      color: '#6b7280',
      marginLeft: 4,
    },
    professional: {
      fontSize: 12,
      color: '#6b7280',
      marginLeft: 4,
    },
    fab: {
      position: 'absolute',
      bottom: 24,
      right: 24,
      width: 56,
      height: 56,
      borderRadius: 28,
      backgroundColor: '#d946ef',
      justifyContent: 'center',
      alignItems: 'center',
      shadowColor: '#d946ef',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 8,
    },
  });
