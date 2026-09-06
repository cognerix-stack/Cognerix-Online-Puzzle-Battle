import en from './locales/en.json';
import hi from './locales/hi.json';
import ru from './locales/ru.json';
import ja from './locales/ja.json';
import es from './locales/es.json';
import fr from './locales/fr.json';
import it from './locales/it.json';
import ptPT from './locales/pt-PT.json';
import zhCN from './locales/zh-CN.json';

export interface LanguageConfig {
  name: string;
  nativeName: string;
  locale: string;
  enabled: boolean;
  comingSoonText: string;
}

export const LANGUAGE_CONFIGS: LanguageConfig[] = [
  { name: 'English', nativeName: 'English', locale: 'en', enabled: true, comingSoonText: 'Coming Soon' },
  { name: 'Hindi', nativeName: 'हिन्दी', locale: 'hi', enabled: false, comingSoonText: 'जल्द आ रहा है' },
  { name: 'Russian', nativeName: 'Русский', locale: 'ru', enabled: false, comingSoonText: 'Скоро' },
  { name: 'Japanese', nativeName: '日本語', locale: 'ja', enabled: false, comingSoonText: '近日公開' },
  { name: 'Spanish', nativeName: 'Español', locale: 'es', enabled: false, comingSoonText: 'Próximamente' },
  { name: 'French', nativeName: 'Français', locale: 'fr', enabled: false, comingSoonText: 'Bientôt disponible' },
  { name: 'Italian', nativeName: 'Italiano', locale: 'it', enabled: false, comingSoonText: 'Prossimamente' },
  { name: 'Portuguese (Portugal)', nativeName: 'Português (Portugal)', locale: 'pt-PT', enabled: false, comingSoonText: 'Em breve' },
  { name: 'Chinese (Simplified)', nativeName: '简体中文', locale: 'zh-CN', enabled: false, comingSoonText: '即将推出' },
];

export const LANGUAGES = LANGUAGE_CONFIGS.map(c => c.name);

export const LANGUAGE_DISPLAY_NAMES = LANGUAGE_CONFIGS.reduce((acc, c) => {
  acc[c.name] = `${c.name} — ${c.nativeName}`;
  return acc;
}, {} as Record<string, string>);

export const TRANSLATIONS: Record<string, Record<string, string>> = {
  'English': en,
  'Hindi': hi,
  'Russian': ru,
  'Japanese': ja,
  'Spanish': es,
  'French': fr,
  'Italian': it,
  'Portuguese (Portugal)': ptPT,
  'Chinese (Simplified)': zhCN,
};

export const translate = (key: string, lang: string): string => {
  let targetLang = lang;
  
  // Custom fallback resolution
  if (!TRANSLATIONS[targetLang]) {
    if (targetLang.startsWith('Spanish')) targetLang = 'Spanish';
    else if (targetLang.startsWith('Portuguese')) targetLang = 'Portuguese (Portugal)';
    else if (targetLang.startsWith('Chinese') || targetLang.startsWith('Mandarin')) {
      targetLang = 'Chinese (Simplified)';
    } else if (targetLang.startsWith('Russian')) targetLang = 'Russian';
    else {
      targetLang = 'English';
    }
  }
  
  const dictionary = TRANSLATIONS[targetLang] || TRANSLATIONS.English;
  return dictionary[key] || TRANSLATIONS.English[key] || key;
};

// Ensure critical keys are present in all languages to prevent blank values
Object.keys(TRANSLATIONS).forEach(lang => {
  const dict = TRANSLATIONS[lang];
  if (!dict.mental_math_name) {
    dict.mental_math_name = TRANSLATIONS.English.mental_math_name;
  }
  if (!dict.mental_math_desc) {
    dict.mental_math_desc = TRANSLATIONS.English.mental_math_desc;
  }
  if (!dict.online_arena_1v1) {
    dict.online_arena_1v1 = TRANSLATIONS.English.online_arena_1v1;
  }
  if (!dict.online_arena_1v1_desc) {
    dict.online_arena_1v1_desc = TRANSLATIONS.English.online_arena_1v1_desc;
  }
});
