/** @type {import('jest').Config} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/__tests__'],
  testMatch: ['**/__tests__/**/*.test.ts'],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx'],
  transform: {
    '^.+\\.[tj]sx?$': ['ts-jest', { tsconfig: '__tests__/tsconfig.json', useESM: false }],
  },
  transformIgnorePatterns: [
    'node_modules/(?!(@moxt|@supabase)/)',
  ],
  moduleNameMapper: {
    '^(\\.\\./)+services/supabase$': '<rootDir>/__mocks__/services/supabase.ts',
    '^@/services/supabase$': '<rootDir>/__mocks__/services/supabase.ts',
    '^@moxt/shared/supabase/(.*)$': '<rootDir>/__mocks__/shared/supabase.ts',
    '^@/(.*)$': '<rootDir>/$1',
    '^@moxt/shared(.*)$': '<rootDir>/../../packages/shared/src$1',
  },
};
