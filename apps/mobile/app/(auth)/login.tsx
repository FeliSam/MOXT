import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';

import { cn } from '@/lib/cn';
import { clearAuthError, login, loginWithGoogle } from '@/store/auth';
import { useAppDispatch, useAppSelector } from '@/store/store';

export default function LoginScreen() {
  const dispatch = useAppDispatch();
  const { error, status } = useAppSelector((state) => state.auth);
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => () => {
    dispatch(clearAuthError());
  }, [dispatch]);

  const handleSubmit = () => {
    dispatch(login({ identifier, password } as any));
  };

  const isLoading = status === 'loading';
  const canSubmit = Boolean(identifier && password) && !isLoading;

  return (
    <SafeAreaView className="flex-1 bg-app-bg dark:bg-[#0c0c0e]">
      <KeyboardAvoidingView
        className="flex-1 justify-center px-5"
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>

        <Text className="text-[28px] font-black italic text-brand-800 dark:text-brand-400 mb-4 ml-1">
          MOXT
        </Text>

        <View className="relative overflow-hidden rounded-3xl border border-app-border dark:border-zinc-800 bg-app-surface dark:bg-zinc-900 p-6 shadow-sm">
          <View className="absolute left-0 top-0 bottom-0 w-1 bg-brand-200 dark:bg-brand-800 rounded-l-3xl" />

          <View className="flex-row items-center gap-2 mb-1">
            <View className="w-2 h-2 rounded-full bg-brand-700 dark:bg-brand-400" />
            <Text className="text-xs font-bold tracking-widest text-brand-700 dark:text-brand-400">MOXT</Text>
          </View>
          <Text className="text-[28px] font-black text-app-text dark:text-zinc-50 mb-1">Entrar</Text>
          <Text className="text-sm leading-5 text-app-text-muted dark:text-zinc-400 mb-5">
            Accédez à votre espace MOXT avec une session persistante et des routes protégées.
          </Text>

          {error ? (
            <Text className="text-[13px] text-red-700 dark:text-red-300 bg-red-50 dark:bg-red-950/40 p-3 rounded-lg mb-2">
              {error}
            </Text>
          ) : null}

          <Pressable
            className="flex-row items-center justify-center border border-app-border dark:border-zinc-700 rounded-2xl py-3.5 gap-3"
            onPress={() => dispatch(loginWithGoogle())}>
            <Text className="text-xl font-bold text-[#4285F4]">G</Text>
            <Text className="font-semibold text-[15px] text-app-text dark:text-zinc-50">
              Continuar avec Google
            </Text>
          </Pressable>

          <View className="flex-row items-center my-5">
            <View className="flex-1 h-px bg-app-border dark:bg-zinc-700" />
            <Text className="mx-3 text-[11px] font-semibold tracking-wide text-app-text-faint dark:text-zinc-500">
              OU AVEC VOTRE EMAIL
            </Text>
            <View className="flex-1 h-px bg-app-border dark:bg-zinc-700" />
          </View>

          <Text className="text-[11px] font-bold tracking-wide uppercase text-app-text-secondary dark:text-zinc-300 mb-2 mt-3">
            E-MAIL OU NUMÉRO RUSSE
          </Text>
          <View className="flex-row items-center border border-app-border-md dark:border-zinc-600 rounded-xl px-3 h-[50px] bg-white dark:bg-zinc-900">
            <Text className="text-base mr-2">👤</Text>
            <TextInput
              autoCapitalize="none"
              autoComplete="username"
              keyboardType="email-address"
              placeholder="nom@example.com ou +7XXXXXXXXXX"
              placeholderTextColor="#9ca3af"
              className="flex-1 text-[15px] text-app-text dark:text-zinc-50 h-full"
              value={identifier}
              onChangeText={setIdentifier}
            />
          </View>

          <Text className="text-[11px] font-bold tracking-wide uppercase text-app-text-secondary dark:text-zinc-300 mb-2 mt-3">
            MOT DE PASSE
          </Text>
          <View className="flex-row items-center border border-app-border-md dark:border-zinc-600 rounded-xl px-3 h-[50px] bg-white dark:bg-zinc-900">
            <Text className="text-base mr-2">🔒</Text>
            <TextInput
              autoCapitalize="none"
              autoComplete="password"
              placeholder="••••••••"
              placeholderTextColor="#9ca3af"
              secureTextEntry={!showPassword}
              className="flex-1 text-[15px] text-app-text dark:text-zinc-50 h-full"
              value={password}
              onChangeText={setPassword}
            />
            <Pressable onPress={() => setShowPassword(!showPassword)} className="p-1">
              <Text className="text-lg">{showPassword ? '👁️' : '👁️‍🗨️'}</Text>
            </Pressable>
          </View>

          <Pressable className="items-end mt-2 mb-5">
            <Text className="text-[13px] font-semibold text-brand-700 dark:text-brand-400">
              Mot de passe oublié ?
            </Text>
          </Pressable>

          <Pressable
            accessibilityRole="button"
            disabled={!canSubmit}
            className={cn(
              'rounded-full py-4 items-center mb-5 bg-brand-800 dark:bg-brand-600',
              !canSubmit && 'opacity-50',
            )}
            onPress={handleSubmit}>
            {isLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text className="text-white dark:text-slate-950 font-bold text-base">Entrar</Text>
            )}
          </Pressable>

          <View className="flex-row justify-center items-center">
            <Text className="text-sm text-app-text-muted dark:text-zinc-400">
              Nouveau sur MOXT ?{' '}
            </Text>
            <Pressable onPress={() => router.push('/register' as any)}>
              <Text className="text-sm font-bold text-brand-700 dark:text-brand-400">Criar conta</Text>
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
