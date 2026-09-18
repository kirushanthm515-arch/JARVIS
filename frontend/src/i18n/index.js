import en from './en.json'
import ta from './ta.json'
import hi from './hi.json'
import te from './te.json'
import ml from './ml.json'
import kn from './kn.json'

export const dictionaries = { en, ta, hi, te, ml, kn }

export const LANGUAGES = [
  { code: 'en', flag: '🇬🇧', label: 'English' },
  { code: 'ta', flag: '🇮🇳', label: 'தமிழ்' },
  { code: 'hi', flag: '🇮🇳', label: 'हिन्दी' },
  { code: 'te', flag: '🇮🇳', label: 'తెలుగు' },
  { code: 'ml', flag: '🇮🇳', label: 'മലയാളം' },
  { code: 'kn', flag: '🇮🇳', label: 'ಕನ್ನಡ' },
]

// Falls back to English, then to the raw key, so the UI never renders blank.
export const translate = (lang, key) => dictionaries[lang]?.[key] ?? dictionaries.en[key] ?? key
