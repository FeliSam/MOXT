# Traductions MOXT (export / import JSON)

## Export

```bash
npm run i18n:export
```

Génère `translations/moxt-translations.json` avec :

- **uiPhrases** — textes français du JSX + traductions EN/RU/PT (catalogues DOM)
- **keys** — clés structurées (`auth.login.title`, etc.)

Envoyez ce fichier à un traducteur ou importez-le dans Tolgee / Locize.

## Import

```bash
# Aperçu des différences
npm run i18n:import

# Appliquer aux fichiers sources
npm run i18n:import:apply
```

`--apply` met à jour les catalogues UI (`englishUiCatalog`, `publishAuthCatalog`, …) et les locales `en.js` / `ru.js` / `pt.js`.

## Langue au premier visit

Sans préférence sauvegardée (`localStorage.moxt-language`), le site détecte `navigator.language` (fr, en, ru, pt) et bascule automatiquement.
