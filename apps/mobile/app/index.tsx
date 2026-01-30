import { View, Text, Pressable } from 'react-native';
import { Link } from 'expo-router';

export default function WelcomeScreen() {
  return (
    <View className="flex-1 bg-brand-cream items-center justify-center px-6">
      {/* Logo */}
      <View className="items-center mb-8">
        <View className="h-20 w-20 rounded-full bg-brand-gold items-center justify-center mb-4">
          <Text className="text-white text-4xl font-bold">G</Text>
        </View>
        <Text className="text-4xl font-bold text-brand-charcoal">Glamo</Text>
        <Text className="text-gray-500 mt-2 text-center">
          Gestão completa para seu negócio de beleza
        </Text>
      </View>

      {/* CTA Buttons */}
      <View className="w-full gap-4">
        <Link href="/(auth)/login" asChild>
          <Pressable className="bg-brand-gold py-4 rounded-lg items-center">
            <Text className="text-white font-semibold text-lg">Entrar</Text>
          </Pressable>
        </Link>

        <Link href="/(auth)/register" asChild>
          <Pressable className="border border-brand-gold py-4 rounded-lg items-center">
            <Text className="text-brand-gold font-semibold text-lg">Criar Conta</Text>
          </Pressable>
        </Link>
      </View>

      {/* Footer */}
      <Text className="text-gray-400 text-sm mt-8">
        Versão 1.0.0
      </Text>
    </View>
  );
}
