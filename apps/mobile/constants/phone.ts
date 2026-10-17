export type PhoneRule = {
  label: string;
  prefix: string;
  placeholder: string;
  pattern: RegExp;
  message: string;
};

export const PHONE_RULES: Record<string, PhoneRule> = {
  BJ: {
    label: 'Bénin',
    prefix: '+22901',
    placeholder: '+22901XXXXXXXX',
    pattern: /^\+22901\d{8}$/,
    message: 'Utilisez le format béninois +22901 suivi de 8 chiffres.',
  },
  RU: {
    label: 'Russie',
    prefix: '+7',
    placeholder: '+7XXXXXXXXXX ou 8XXXXXXXXXX',
    pattern: /^(?:\+7|8)\d{10}$/,
    message: 'Utilisez le format russe +7 ou 8 suivi de 10 chiffres.',
  },
  TG: {
    label: 'Togo',
    prefix: '+228',
    placeholder: '+228XXXXXXXX',
    pattern: /^\+228\d{8}$/,
    message: 'Utilisez le format togolais +228 suivi de 8 chiffres.',
  },
  CI: {
    label: "Côte d'Ivoire",
    prefix: '+225',
    placeholder: '+225XXXXXXXXXX',
    pattern: /^\+225\d{10}$/,
    message: "Utilisez le format ivoirien +225 suivi de 10 chiffres.",
  },
  SN: {
    label: 'Sénégal',
    prefix: '+221',
    placeholder: '+221XXXXXXXXX',
    pattern: /^\+221\d{9}$/,
    message: 'Utilisez le format sénégalais +221 suivi de 9 chiffres.',
  },
  CM: {
    label: 'Cameroun',
    prefix: '+237',
    placeholder: '+237XXXXXXXXX',
    pattern: /^\+237\d{9}$/,
    message: 'Utilisez le format camerounais +237 suivi de 9 chiffres.',
  },
  ML: {
    label: 'Mali',
    prefix: '+223',
    placeholder: '+223XXXXXXXX',
    pattern: /^\+223\d{8}$/,
    message: 'Utilisez le format malien +223 suivi de 8 chiffres.',
  },
  GN: {
    label: 'Guinée',
    prefix: '+224',
    placeholder: '+224XXXXXXXXX',
    pattern: /^\+224\d{9}$/,
    message: 'Utilisez le format guinéen +224 suivi de 9 chiffres.',
  },
  BF: {
    label: 'Burkina Faso',
    prefix: '+226',
    placeholder: '+226XXXXXXXX',
    pattern: /^\+226\d{8}$/,
    message: 'Utilisez le format burkinabè +226 suivi de 8 chiffres.',
  },
  NE: {
    label: 'Niger',
    prefix: '+227',
    placeholder: '+227XXXXXXXX',
    pattern: /^\+227\d{8}$/,
    message: 'Utilisez le format nigérien +227 suivi de 8 chiffres.',
  },
};

const FALLBACK_RULE: PhoneRule = {
  label: 'International',
  prefix: '+',
  placeholder: '+XXXXXXXXXX',
  pattern: /^\+\d{7,15}$/,
  message: 'Format international invalide.',
};

export function normalizePhone(value: string = ''): string {
  const trimmed = String(value || '').trim();
  const hasPlus = trimmed.startsWith('+');
  const digits = trimmed.replace(/\D/g, '');
  return `${hasPlus ? '+' : ''}${digits}`;
}

export function phonePrefix(country: string): string {
  const c = String(country || '').toUpperCase();
  return (PHONE_RULES[c] || PHONE_RULES.BJ || FALLBACK_RULE).prefix;
}

export function phonePlaceholder(country: string): string {
  const c = String(country || '').toUpperCase();
  return (PHONE_RULES[c] || PHONE_RULES.BJ || FALLBACK_RULE).placeholder;
}

export function phoneError(country: string): string {
  const c = String(country || '').toUpperCase();
  return (PHONE_RULES[c] || PHONE_RULES.BJ || FALLBACK_RULE).message;
}

export function validatePhone(value: string, country: string): boolean {
  const c = String(country || '').toUpperCase();
  const rule = PHONE_RULES[c] || PHONE_RULES.BJ || FALLBACK_RULE;
  return rule.pattern.test(normalizePhone(value));
}

export function ensurePhoneCountry(value: string, country: string): string {
  const normalized = normalizePhone(value);
  const c = String(country || '').toUpperCase();
  const rule = PHONE_RULES[c] || PHONE_RULES.BJ || FALLBACK_RULE;
  if (!normalized || Object.values(PHONE_RULES).some((item) => normalized === item.prefix)) {
    return rule.prefix;
  }
  if (c === 'RU') {
    if (/^8\d{10}$/.test(normalized) || /^\+7\d{10}$/.test(normalized)) return normalized;
    const digits = normalized.replace(/\D/g, '');
    if (digits.length === 10) return `${rule.prefix}${digits}`;
  }
  return normalized;
}
