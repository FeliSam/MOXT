import { useEffect, useState } from 'react';
import { Pressable, View } from 'react-native';

import { OTP_RESEND_COOLDOWN_SECONDS } from '@moxt/shared/auth/otpCooldown.js';
import { isPhoneVerified, isValidRussianPhone } from '@moxt/shared/auth/userSecurity.js';

import { DsAlert } from '@/components/ds/Alert';
import { AppText } from '@/components/ui/AppText';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useLanguage } from '@/providers/LanguageProvider';
import { authService, setUser } from '@/store/auth';
import { useAppDispatch, useAppSelector } from '@/store/store';
import type { AuthUser } from '@/store/types';
import { showNotice } from '@/utils/notice';

const CHANNELS = [
  { id: 'sms', titleKey: 'auth.register.channel.smsTitle' },
  { id: 'telegram', titleKey: 'auth.register.channel.telegramTitle' },
  { id: 'flashcall', titleKey: 'auth.register.channel.callTitle' },
] as const;

/** PhoneVerificationCard du web : SMS, Telegram ou appel, puis code. */
export function PhoneVerificationCard() {
  const dispatch = useAppDispatch();
  const { t } = useLanguage();
  const user = useAppSelector((state) => state.auth.user);
  const [phone, setPhone] = useState(user?.phone && user.phone !== '+7' ? user.phone : '+7');
  const [channel, setChannel] = useState<(typeof CHANNELS)[number]['id']>('sms');
  const [otp, setOtp] = useState('');
  const [otpType, setOtpType] = useState('phone_change');
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (cooldown <= 0) return undefined;
    const timer = setInterval(() => setCooldown((value) => Math.max(0, value - 1)), 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  if (!user) return null;
  if (isPhoneVerified(user)) {
    return (
      <DsAlert variant="success" title={t('security.phone.verifiedTitle')}>
        {t('security.phone.verifiedBody', { phone: user.phone })}
      </DsAlert>
    );
  }

  const otpLen = channel === 'flashcall' ? 4 : 6;

  async function sendCode() {
    if (!isValidRussianPhone(phone)) {
      showNotice(t('security.phone.invalidTitle'), t('security.phone.invalidBody'));
      return;
    }
    setBusy(true);
    try {
      const result = await authService.requestPhoneVerificationOtp(user, phone, { otpChannel: channel });
      if (result?.user) {
        dispatch(setUser(result.user as AuthUser));
        showNotice(t('security.phone.alreadyConfirmedTitle'), t('security.phone.alreadyConfirmedBody'));
        return;
      }
      setSent(true);
      setOtp('');
      if (result?.otpType) setOtpType(result.otpType);
      setCooldown(user?.role === 'superadmin' ? 0 : OTP_RESEND_COOLDOWN_SECONDS);
      const bodyKey =
        channel === 'flashcall'
          ? 'security.phone.codeSentBodyCall'
          : channel === 'telegram'
            ? 'security.phone.codeSentBodyTelegram'
            : 'security.phone.codeSentBody';
      showNotice(t('security.phone.codeSentTitle'), t(bodyKey, { phone: result?.phone || phone }));
    } catch (error) {
      showNotice(t('security.phone.errorTitle'), error instanceof Error ? error.message : String(error));
    } finally {
      setBusy(false);
    }
  }

  async function confirmCode() {
    if (otp.length !== otpLen) return;
    setBusy(true);
    try {
      const confirmed = await authService.confirmPhoneVerification(user, { phone, token: otp, otpType });
      dispatch(setUser(confirmed as AuthUser));
      setSent(false);
      setOtp('');
      showNotice(t('security.phone.confirmedTitle'), t('security.phone.confirmedBody'));
    } catch (error) {
      showNotice(t('security.phone.errorTitle'), error instanceof Error ? error.message : String(error));
    } finally {
      setBusy(false);
    }
  }

  return (
    <View className="gap-3 rounded-card-lg border border-app-border bg-app-surface p-4">
      <AppText className="text-base font-black text-app-text">{t('security.phone.title')}</AppText>
      <AppText className="text-sm text-app-text-muted">{t('security.phone.description')}</AppText>
      <Input label={t('security.phone.numberLabel')} value={phone} onChangeText={setPhone} keyboardType="phone-pad" autoCapitalize="none" />
      <View className="flex-row flex-wrap gap-2">
        {CHANNELS.map((item) => {
          const active = channel === item.id;
          return (
            <Pressable
              key={item.id}
              onPress={() => {
                setChannel(item.id);
                setSent(false);
                setOtp('');
              }}
              className={active ? 'rounded-full bg-brand-700 px-3 py-2' : 'rounded-full border border-app-border bg-app-surface-muted px-3 py-2'}>
              <AppText className={active ? 'text-xs font-bold text-white' : 'text-xs font-bold text-app-text'}>
                {t(item.titleKey)}
              </AppText>
            </Pressable>
          );
        })}
      </View>
      {sent ? (
        <Input
          label={t(channel === 'flashcall' ? 'security.phone.otpLabelCall' : channel === 'telegram' ? 'security.phone.otpLabelTelegram' : 'security.phone.otpLabel')}
          value={otp}
          onChangeText={(value) => setOtp(value.replace(/\D/g, '').slice(0, otpLen))}
          keyboardType="number-pad"
          maxLength={otpLen}
        />
      ) : null}
      <View className="flex-row flex-wrap gap-2">
        <Button size="sm" loading={busy && !sent} disabled={busy || cooldown > 0} onPress={sendCode}>
          {cooldown > 0
            ? t('security.phone.resendCooldown', { seconds: cooldown })
            : sent
              ? t('security.phone.resend')
              : channel === 'telegram'
                ? t('security.phone.sendCodeTelegram')
                : channel === 'flashcall'
                  ? t('security.phone.sendCodeCall')
                  : t('security.phone.sendCode')}
        </Button>
        {sent ? (
          <Button size="sm" variant="secondary" loading={busy} disabled={otp.length !== otpLen} onPress={confirmCode}>
            {t('security.phone.confirm')}
          </Button>
        ) : null}
      </View>
    </View>
  );
}
