/**
 * AURELIUS i18n locale definitions.
 *
 * All user-facing data labels, alert strings, and output messages live here.
 * The Bulgarian locale (bg) is the admin-core language.
 * English (en) is the default for all public-facing outputs.
 *
 * Usage:
 *   import { t, setLocale, currentLocale } from '../i18n/locales';
 *   t('alerts.yieldWallBreach')
 */

export type LocaleCode = 'en' | 'bg' | 'de' | 'fr' | 'zh' | 'ja' | 'ar';

export interface AureliusLocale {
  // Navigation
  nav: {
    dashboard: string;
    intelligence: string;
    stressLab: string;
    blackSwan: string;
    capitalSurvival: string;
    agiTerminal: string;
    energyFinance: string;
    sovereign: string;
    citadel: string;
    triad: string;
    prophecyLog: string;
    reports: string;
    dataSources: string;
  };
  // Market data labels
  market: {
    vix: string;
    fearGreed: string;
    yieldSpread: string;
    survivalProbability: string;
    systemicRisk: string;
    btcPrice: string;
    wtiCrude: string;
    brentCrude: string;
    gold: string;
    usdJpy: string;
    dgs10: string;
    dgs2: string;
    institutionalFlow: string;
    correlation: string;
  };
  // Alert strings
  alerts: {
    yieldWallBreach: string;
    yieldWallMessage: string;
    energyShock: string;
    interventionWatch: string;
    realityDivergence: string;
    calibrating: string;
    liveCalc: string;
  };
  // Prophecy Log
  prophecy: {
    title: string;
    subtitle: string;
    hitRate: string;
    verifiedHits: string;
    misses: string;
    pending: string;
    hit: string;
    miss: string;
    rationale: string;
    predicted: string;
    targetDate: string;
    verified: string;
    source: string;
    noRecords: string;
  };
  // Outcome labels
  outcomes: {
    hit: string;
    miss: string;
    pending: string;
    elevated_risk: string;
    stress: string;
    contraction: string;
    normal: string;
  };
  // System
  system: {
    globalAlert: string;
    loading: string;
    lastUpdate: string;
    accuracy: string;
    live: string;
    stale: string;
    offline: string;
  };
}

// =====================================================
// ENGLISH — Default public-facing output language
// =====================================================
const en: AureliusLocale = {
  nav: {
    dashboard: 'Home', intelligence: 'Intelligence', stressLab: 'Stress Lab',
    blackSwan: 'Black Swan', capitalSurvival: 'Capital AI', agiTerminal: 'AGI Terminal',
    energyFinance: 'Energy', sovereign: 'Sovereign', citadel: 'Citadel',
    triad: 'Triad', prophecyLog: 'Prophecy Log', reports: 'Reports', dataSources: 'Data Sources',
  },
  market: {
    vix: 'VIX', fearGreed: 'Fear & Greed', yieldSpread: 'Yield Spread',
    survivalProbability: 'Survival Probability', systemicRisk: 'Systemic Risk',
    btcPrice: 'BTC Price', wtiCrude: 'WTI Crude', brentCrude: 'Brent Crude',
    gold: 'Gold (XAU)', usdJpy: 'USD/JPY', dgs10: '10Y Yield', dgs2: '2Y Yield',
    institutionalFlow: 'Institutional Flow', correlation: 'SPX/BTC Correlation',
  },
  alerts: {
    yieldWallBreach: 'YIELD WALL BREACHED — GLOBAL DEBT COLLAPSE SIGNAL',
    yieldWallMessage: 'US 10Y Treasury Yield has crossed 4.50%. Refinancing costs become unsustainable. CAPITAL PRESERVATION MODE ACTIVATED.',
    energyShock: 'ENERGY_SHOCK_V3 — $100 resistance imminent',
    interventionWatch: 'INTERVENTION_WATCH — USD/JPY approaching BoJ threshold',
    realityDivergence: 'REALITY_DIVERGENCE: CORRECTED',
    calibrating: 'Calibrating...',
    liveCalc: 'Live calc...',
  },
  prophecy: {
    title: 'PROPHECY LOG', subtitle: 'AURELIUS prediction record — every call logged, every outcome verified.',
    hitRate: 'HIT RATE', verifiedHits: 'VERIFIED HITS', misses: 'MISSES', pending: 'PENDING',
    hit: 'HIT', miss: 'MISS', rationale: 'RATIONALE', predicted: 'PREDICTED',
    targetDate: 'TARGET DATE', verified: 'VERIFIED', source: 'SOURCE',
    noRecords: 'No predictions found.',
  },
  outcomes: {
    hit: 'HIT', miss: 'MISS', pending: 'PENDING',
    elevated_risk: 'ELEVATED RISK', stress: 'STRESS', contraction: 'CONTRACTION', normal: 'NORMAL',
  },
  system: {
    globalAlert: 'GLOBAL_ALERT', loading: 'Loading...', lastUpdate: 'Last Update',
    accuracy: 'Accuracy', live: 'LIVE', stale: 'STALE', offline: 'OFFLINE',
  },
};

// =====================================================
// BULGARIAN — Admin core language
// =====================================================
const bg: AureliusLocale = {
  nav: {
    dashboard: 'Начало', intelligence: 'Разузнаване', stressLab: 'Стрес Лаборатория',
    blackSwan: 'Черен Лебед', capitalSurvival: 'Капитал ИИ', agiTerminal: 'АГИ Терминал',
    energyFinance: 'Енергия', sovereign: 'Суверен', citadel: 'Цитадела',
    triad: 'Триада', prophecyLog: 'Дневник на Пророчествата', reports: 'Доклади', dataSources: 'Данни',
  },
  market: {
    vix: 'ВИХ', fearGreed: 'Страх и Алчност', yieldSpread: 'Лихвен Спред',
    survivalProbability: 'Вероятност за Оцеляване', systemicRisk: 'Системен Риск',
    btcPrice: 'Цена на БТК', wtiCrude: 'WTI Суров', brentCrude: 'Брент Суров',
    gold: 'Злато (XAU)', usdJpy: 'USD/JPY', dgs10: '10Г Доходност', dgs2: '2Г Доходност',
    institutionalFlow: 'Институционален Поток', correlation: 'Корелация SPX/BTC',
  },
  alerts: {
    yieldWallBreach: 'СТЕНА НА ДОХОДНОСТТА ПРОБИТА — СИГНАЛ ЗА ГЛОБАЛЕН ДЪЛГ',
    yieldWallMessage: 'Доходността на 10Г Облигации пресече 4.50%. РЕЖИМ НА ЗАПАЗВАНЕ НА КАПИТАЛА АКТИВИРАН.',
    energyShock: 'ЕНЕРГИЕН ШОК V3 — Съпротива от $100 е неизбежна',
    interventionWatch: 'НАБЛЮДЕНИЕ ЗА ИНТЕРВЕНЦИЯ — USD/JPY приближава прага на БЯ',
    realityDivergence: 'РЕАЛНОСТНО РАЗМИНАВАНЕ: КОРИГИРАНО',
    calibrating: 'Калибриране...',
    liveCalc: 'Изчисляване в реално...',
  },
  prophecy: {
    title: 'ДНЕВНИК НА ПРОРОЧЕСТВАТА',
    subtitle: 'Всяко предсказание записано, всеки резултат верифициран.',
    hitRate: 'ПРОЦЕНТ ПОПАДЕНИЯ', verifiedHits: 'ПОТВЪРДЕНИ ПОПАДЕНИЯ',
    misses: 'ПРОПУСКИ', pending: 'ИЗЧАКВАЩИ',
    hit: 'ПОПАДЕНИЕ', miss: 'ПРОПУСК', rationale: 'ОБОСНОВКА', predicted: 'ПРЕДСКАЗАНО',
    targetDate: 'ЦЕЛЕВА ДАТА', verified: 'ВЕРИФИЦИРАНО', source: 'ИЗТОЧНИК',
    noRecords: 'Няма намерени предсказания.',
  },
  outcomes: {
    hit: 'ПОПАДЕНИЕ', miss: 'ПРОПУСК', pending: 'ИЗЧАКВАЩО',
    elevated_risk: 'ПОВИШЕН РИСК', stress: 'СТРЕС', contraction: 'СВИВАНЕ', normal: 'НОРМАЛНО',
  },
  system: {
    globalAlert: 'ГЛОБАЛНА АЛАРМА', loading: 'Зареждане...', lastUpdate: 'Последна Актуализация',
    accuracy: 'Точност', live: 'НА ЖИВО', stale: 'ОСТАРЕЛО', offline: 'ОФЛАЙН',
  },
};

// =====================================================
// Locale registry + accessor
// =====================================================
const locales: Record<LocaleCode, AureliusLocale> = { en, bg, de: en, fr: en, zh: en, ja: en, ar: en };

let _locale: LocaleCode = 'en';

export function setLocale(code: LocaleCode): void {
  _locale = code;
}

export function currentLocale(): LocaleCode {
  return _locale;
}

/**
 * Translate a dot-notation key, e.g. t('alerts.yieldWallBreach')
 * Falls back to English if the key is missing in the current locale.
 */
export function t(key: string): string {
  const parts = key.split('.');
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let val: any = locales[_locale];
  for (const part of parts) {
    val = val?.[part];
    if (val === undefined) break;
  }
  if (typeof val === 'string') return val;

  // Fallback to English
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let fallback: any = locales['en'];
  for (const part of parts) {
    fallback = fallback?.[part];
  }
  return typeof fallback === 'string' ? fallback : key;
}

export { en as enLocale, bg as bgLocale };
