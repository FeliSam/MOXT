export type AuthUser = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  secondaryPhone: string;
  country: string;
  originCountry: string;
  city: string;
  avatarUrl: string;
  role: string;
  verified: boolean;
  status: string;
  phoneVerified?: boolean;
  phoneVerifiedAt?: string | null;
  emailVerified?: boolean;
  emailVerifiedAt?: string | null;
};

export type AuthState = {
  user: AuthUser | null;
  token: string | null;
  status: 'loading' | 'authenticated' | 'anonymous';
  error: string | null;
  registrationEmail: string | null;
};
