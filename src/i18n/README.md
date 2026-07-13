# Localization (i18n)

This directory contains translation files for supporting multiple languages in the app.

## Available Languages

- `en.ts` - English
- `uk.ts` - Ukrainian

Language preference is automatically saved to localStorage (`collection-checklist:language`) and persists across sessions.

## Adding a New Language

To add support for a new language (e.g., Spanish):

### 1. Create Translation File

Create `src/i18n/es.ts`:

```typescript
export const esTranslations = {
  "Collection Checklist": "Lista de verificación de colecciones",
  "Offline tracker for your local collection images and names.":
    "Rastreador sin conexión para imágenes y nombres de su colección local.",
  // ... copy and translate all other keys from en.ts
} as const;
```

### 2. Update Main Application

In `src/main.ts`, add the import at the top:

```typescript
import { esTranslations } from "./i18n/es";
```

Update the `Language` type definition:

```typescript
type Language = "en" | "uk" | "es";
```

Add to the translations dictionary:

```typescript
const translations: TranslationDict = {
  en: enTranslations,
  uk: ukTranslations,
  es: esTranslations
};
```

### 3. Update HTML

In `src/index.html`, add the language option to the selector:

```html
<select id="languageSelector" class="language-selector">
  <option value="en">English</option>
  <option value="uk">Українська</option>
  <option value="es">Español</option>
</select>
```

### 4. Build and Test

```bash
npm run build
```

Open `dist/index.html` and verify the new language appears in the dropdown and works correctly.

## Translation Guidelines

- Keep translations concise but clear
- Maintain the same meaning as the English source
- Use gender-neutral language where appropriate
- Test all UI elements render properly with your language's character width

## Key Translation Strings

The app translates these main categories:

- **UI Labels**: Button text, field labels, section headings
- **Placeholders**: Input field hints
- **Status Messages**: Progress updates, confirmations, errors
- **Help Text**: Explanations and guidance for features
- **Error Messages**: Clear descriptions of what went wrong
- **Supabase Sync**: Authentication and sync status messages

## Testing

To test a new language:

1. Build the app: `npm run build`
2. Open `dist/index.html` in a browser
3. Select the new language from the dropdown
4. Verify all text is translated
5. Check that longer text doesn't break the layout
6. Confirm language preference persists after page reload
