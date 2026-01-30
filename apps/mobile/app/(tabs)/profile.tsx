import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  useColorScheme,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useAuthStore } from '@/stores/auth';
import { profileService } from '@/services/profile';

export default function ProfileScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const { user, tenant, logout } = useAuthStore();

  const { data: profile } = useQuery({
    queryKey: ['profile'],
    queryFn: () => profileService.get(),
  });

  const styles = createStyles(isDark);

  const handleLogout = () => {
    Alert.alert('Sair', 'Deseja realmente sair da sua conta?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Sair',
        style: 'destructive',
        onPress: () => {
          logout();
          router.replace('/(auth)/login');
        },
      },
    ]);
  };

  const getInitials = (name: string) => {
    return name
      ?.split(' ')
      .slice(0, 2)
      .map((n) => n[0])
      .join('')
      .toUpperCase() || '?';
  };

  const menuItems = [
    {
      title: 'Conta',
      items: [
        {
          icon: 'person-outline',
          label: 'Meus dados',
          onPress: () => router.push('/profile/edit'),
        },
        {
          icon: 'lock-closed-outline',
          label: 'Alterar senha',
          onPress: () => router.push('/profile/change-password'),
        },
        {
          icon: 'notifications-outline',
          label: 'Notificações',
          onPress: () => router.push('/profile/notifications'),
        },
      ],
    },
    {
      title: 'Preferências',
      items: [
        {
          icon: 'moon-outline',
          label: 'Tema escuro',
          isSwitch: true,
          value: isDark,
          onToggle: () => {},
        },
        {
          icon: 'language-outline',
          label: 'Idioma',
          value: 'Português',
          onPress: () => {},
        },
      ],
    },
    {
      title: 'Suporte',
      items: [
        {
          icon: 'help-circle-outline',
          label: 'Central de ajuda',
          onPress: () => router.push('/profile/help'),
        },
        {
          icon: 'chatbubble-outline',
          label: 'Fale conosco',
          onPress: () => router.push('/profile/contact'),
        },
        {
          icon: 'document-text-outline',
          label: 'Termos de uso',
          onPress: () => router.push('/profile/terms'),
        },
        {
          icon: 'shield-outline',
          label: 'Política de privacidade',
          onPress: () => router.push('/profile/privacy'),
        },
      ],
    },
  ];

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {getInitials(user?.name || '')}
          </Text>
        </View>
        <Text style={styles.userName}>{user?.name}</Text>
        <Text style={styles.userEmail}>{user?.email}</Text>
        {tenant && (
          <View style={styles.tenantBadge}>
            <Ionicons name="business-outline" size={14} color="#d946ef" />
            <Text style={styles.tenantName}>{tenant.name}</Text>
          </View>
        )}
      </View>

      {menuItems.map((section) => (
        <View key={section.title} style={styles.section}>
          <Text style={styles.sectionTitle}>{section.title}</Text>
          <View style={styles.sectionContent}>
            {section.items.map((item, index) => (
              <TouchableOpacity
                key={item.label}
                style={[
                  styles.menuItem,
                  index < section.items.length - 1 && styles.menuItemBorder,
                ]}
                onPress={item.onPress}
                disabled={item.isSwitch}
              >
                <View style={styles.menuItemLeft}>
                  <Ionicons
                    name={item.icon as any}
                    size={22}
                    color={isDark ? '#d1d5db' : '#4b5563'}
                  />
                  <Text style={styles.menuItemLabel}>{item.label}</Text>
                </View>
                {item.isSwitch ? (
                  <Switch
                    value={item.value as boolean}
                    onValueChange={item.onToggle}
                    trackColor={{ false: '#e5e7eb', true: '#e879f9' }}
                    thumbColor={item.value ? '#d946ef' : '#f4f4f5'}
                  />
                ) : item.value ? (
                  <Text style={styles.menuItemValue}>{item.value}</Text>
                ) : (
                  <Ionicons
                    name="chevron-forward"
                    size={20}
                    color={isDark ? '#6b7280' : '#9ca3af'}
                  />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>
      ))}

      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Ionicons name="log-out-outline" size={22} color="#ef4444" />
        <Text style={styles.logoutText}>Sair da conta</Text>
      </TouchableOpacity>

      <Text style={styles.version}>Versão 1.0.0</Text>
    </ScrollView>
  );
}

const createStyles = (isDark: boolean) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: isDark ? '#0a0a0a' : '#f9fafb',
    },
    header: {
      alignItems: 'center',
      paddingVertical: 32,
      backgroundColor: isDark ? '#1a1a1a' : '#ffffff',
      borderBottomWidth: 1,
      borderBottomColor: isDark ? '#374151' : '#e5e7eb',
    },
    avatar: {
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor: '#d946ef',
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 16,
    },
    avatarText: {
      fontSize: 28,
      fontWeight: 'bold',
      color: '#ffffff',
    },
    userName: {
      fontSize: 22,
      fontWeight: 'bold',
      color: isDark ? '#ffffff' : '#1f2937',
      marginBottom: 4,
    },
    userEmail: {
      fontSize: 14,
      color: '#6b7280',
      marginBottom: 12,
    },
    tenantBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#fdf4ff',
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 16,
    },
    tenantName: {
      fontSize: 14,
      color: '#d946ef',
      fontWeight: '500',
      marginLeft: 6,
    },
    section: {
      marginTop: 24,
      paddingHorizontal: 16,
    },
    sectionTitle: {
      fontSize: 12,
      fontWeight: '600',
      color: '#6b7280',
      textTransform: 'uppercase',
      letterSpacing: 0.5,
      marginBottom: 8,
      marginLeft: 4,
    },
    sectionContent: {
      backgroundColor: isDark ? '#1a1a1a' : '#ffffff',
      borderRadius: 12,
      overflow: 'hidden',
    },
    menuItem: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: 14,
      paddingHorizontal: 16,
    },
    menuItemBorder: {
      borderBottomWidth: 1,
      borderBottomColor: isDark ? '#374151' : '#e5e7eb',
    },
    menuItemLeft: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    menuItemLabel: {
      fontSize: 16,
      color: isDark ? '#ffffff' : '#1f2937',
      marginLeft: 12,
    },
    menuItemValue: {
      fontSize: 14,
      color: '#6b7280',
    },
    logoutButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 32,
      marginHorizontal: 16,
      paddingVertical: 14,
      backgroundColor: isDark ? '#1a1a1a' : '#ffffff',
      borderRadius: 12,
      borderWidth: 1,
      borderColor: '#fecaca',
    },
    logoutText: {
      fontSize: 16,
      color: '#ef4444',
      fontWeight: '500',
      marginLeft: 8,
    },
    version: {
      textAlign: 'center',
      fontSize: 12,
      color: '#9ca3af',
      marginTop: 24,
      marginBottom: 32,
    },
  });
