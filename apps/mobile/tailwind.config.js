/**
 * Tailwind / NativeWind — jetons partagés avec le web.
 * Source unique : packages/shared/src/design/tokens.json (extraits de moxt-react/src/index.css).
 *
 * Les couleurs `app-*` passent par des variables CSS (`--app-*`, triplets RGB)
 * posées à la racine par `theme/ThemeContext.tsx` : `bg-app-surface/65`
 * fonctionne donc en clair comme en sombre, comme `bg-[var(--app-surface)]/65` sur le web.
 */
const plugin = require('tailwindcss/plugin');
const tokens = require('@moxt/shared/design/tokens.json');

const kebab = (name) => name.replace(/[A-Z0-9]+/g, (m) => `-${m.toLowerCase()}`);
const cssVar = (name) => `rgb(var(--app-${name}) / <alpha-value>)`;

const appColors = Object.fromEntries(
  Object.keys(tokens.colors.light).map((key) => [kebab(key), cssVar(kebab(key))]),
);

/** Graisses → familles chargées (Inter 400 / 600, Manrope 700), comme le web (font-synthesis: none). */
const FONT_REGULAR = 'Inter_400Regular';
const FONT_SEMIBOLD = 'Inter_600SemiBold';
const FONT_DISPLAY = 'Manrope_700Bold';

const fontWeightUtilities = plugin(({ addUtilities }) => {
  const regular = { fontFamily: FONT_REGULAR, fontWeight: 'normal' };
  const semibold = { fontFamily: FONT_SEMIBOLD, fontWeight: 'normal' };
  addUtilities({
    '.font-thin': regular,
    '.font-extralight': regular,
    '.font-light': regular,
    '.font-normal': regular,
    '.font-medium': regular,
    '.font-semibold': semibold,
    '.font-bold': semibold,
    '.font-extrabold': semibold,
    '.font-black': semibold,
    // Déclaré en dernier : `font-display font-extrabold` reste en Manrope (titres web).
    '.font-display': { fontFamily: FONT_DISPLAY, fontWeight: 'normal' },
  });
});

/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './app/**/*.{js,jsx,ts,tsx}',
    './components/**/*.{js,jsx,ts,tsx}',
    './theme/**/*.{js,jsx,ts,tsx}',
  ],
  presets: [require('nativewind/preset')],
  corePlugins: {
    fontWeight: false,
  },
  theme: {
    extend: {
      colors: {
        brand: tokens.brand,
        prune: tokens.palettes.prune.brand,
        app: {
          ...appColors,
          // Alias historiques de l'app mobile
          'surface-elevated': cssVar('surface'),
          'surface-interactive': cssVar('surface-muted'),
          'text-secondary': cssVar('text-2'),
          inverse: '#020617',
        },
      },
      borderRadius: {
        card: tokens.radius.card,
        'card-sm': tokens.radius.cardSm,
        'card-lg': tokens.radius.cardLg,
        btn: tokens.radius.btn,
        input: tokens.radius.input,
      },
      fontFamily: {
        sans: [FONT_REGULAR],
      },
    },
  },
  plugins: [fontWeightUtilities],
};
