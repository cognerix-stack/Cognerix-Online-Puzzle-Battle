import en from './locales/en.json';
import es from './locales/es.json';
import es419 from './locales/es-419.json';
import ptBR from './locales/pt-BR.json';
import ptPT from './locales/pt-PT.json';
import fr from './locales/fr.json';
import de from './locales/de.json';
import it from './locales/it.json';
import nl from './locales/nl.json';
import id from './locales/id.json';
import ru from './locales/ru.json';
import tr from './locales/tr.json';
import ja from './locales/ja.json';
import ko from './locales/ko.json';
import zhCN from './locales/zh-CN.json';
import zhHK from './locales/zh-HK.json';
import ro from './locales/ro.json';
import hi from './locales/hi.json';

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
  { name: 'Spanish', nativeName: 'Español', locale: 'es', enabled: false, comingSoonText: 'Próximamente' },
  { name: 'Spanish (Latin America)', nativeName: 'Español (Latinoamérica)', locale: 'es-419', enabled: false, comingSoonText: 'Próximamente' },
  { name: 'Portuguese (Brazil)', nativeName: 'Português (Brasil)', locale: 'pt-BR', enabled: false, comingSoonText: 'Em breve' },
  { name: 'Portuguese (Portugal)', nativeName: 'Português (Portugal)', locale: 'pt-PT', enabled: false, comingSoonText: 'Em breve' },
  { name: 'French', nativeName: 'Français', locale: 'fr', enabled: false, comingSoonText: 'Bientôt disponible' },
  { name: 'German', nativeName: 'Deutsch', locale: 'de', enabled: false, comingSoonText: 'Demnächst' },
  { name: 'Italian', nativeName: 'Italiano', locale: 'it', enabled: false, comingSoonText: 'Prossimamente' },
  { name: 'Dutch', nativeName: 'Nederlands', locale: 'nl', enabled: false, comingSoonText: 'Binnenkort' },
  { name: 'Indonesian', nativeName: 'Bahasa Indonesia', locale: 'id', enabled: false, comingSoonText: 'Segera hadir' },
  { name: 'Russian', nativeName: 'Русский', locale: 'ru', enabled: false, comingSoonText: 'Скоро' },
  { name: 'Turkish', nativeName: 'Türkçe', locale: 'tr', enabled: false, comingSoonText: 'Yakında' },
  { name: 'Japanese', nativeName: '日本語', locale: 'ja', enabled: false, comingSoonText: '近日公開' },
  { name: 'Korean', nativeName: '한국어', locale: 'ko', enabled: false, comingSoonText: '곧 출시' },
  { name: 'Chinese (Simplified)', nativeName: '简体中文', locale: 'zh-CN', enabled: false, comingSoonText: '即将推出' },
  { name: 'Chinese (Traditional - Hong Kong)', nativeName: '繁體中文（香港）', locale: 'zh-HK', enabled: false, comingSoonText: '即將推出' },
  { name: 'Romanian', nativeName: 'Română', locale: 'ro', enabled: false, comingSoonText: 'În curând' }
];

export const LANGUAGES = LANGUAGE_CONFIGS.map(c => c.name);

export const LANGUAGE_DISPLAY_NAMES = LANGUAGE_CONFIGS.reduce((acc, c) => {
  acc[c.name] = `${c.name} — ${c.nativeName}`;
  return acc;
}, {} as Record<string, string>);

export const TRANSLATIONS: Record<string, Record<string, string>> = {
  'English': en,
  'Spanish': es,
  'Spanish (Latin America)': es419,
  'Portuguese (Brazil)': ptBR,
  'Portuguese (Portugal)': ptPT,
  'French': fr,
  'German': de,
  'Italian': it,
  'Dutch': nl,
  'Indonesian': id,
  'Russian': ru,
  'Turkish': tr,
  'Japanese': ja,
  'Korean': ko,
  'Chinese (Simplified)': zhCN,
  'Chinese (Traditional - Hong Kong)': zhHK,
  'Romanian': ro,
  'Hindi': hi
};

export const translate = (key: string, lang: string): string => {
  let targetLang = lang;
  
  // Custom fallback resolution
  if (!TRANSLATIONS[targetLang]) {
    if (targetLang.startsWith('Spanish')) targetLang = 'Spanish';
    else if (targetLang.startsWith('Portuguese')) targetLang = 'Portuguese (Brazil)';
    else if (targetLang.startsWith('Chinese') || targetLang.startsWith('Mandarin')) {
      if (targetLang.includes('Hong Kong') || targetLang.includes('Traditional')) {
        targetLang = 'Chinese (Traditional - Hong Kong)';
      } else {
        targetLang = 'Chinese (Simplified)';
      }
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
