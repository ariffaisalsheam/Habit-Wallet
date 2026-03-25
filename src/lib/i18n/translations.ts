import type { AppLanguage } from "@/lib/i18n/language";

type TranslationKey =
  | "nav.habits"
  | "nav.finance"
  | "nav.add"
  | "nav.analytics"
  | "nav.profile"
  | "shell.primary"
  | "shell.brand"
  | "sync.offline"
  | "sync.localMode"
  | "sync.locked"
  | "sync.syncing"
  | "sync.pending"
  | "sync.synced"
  | "sync.syncedAt"
  | "sync.upgrade"
  | "title.habits"
  | "title.finance"
  | "title.quickAdd"
  | "title.insights"
  | "title.profile"
  | "title.subscription"
  | "profile.pageHeading"
  | "profile.pageDescription"
  | "profile.premiumHeading"
  | "profile.premiumDescription"
  | "profile.subscriptionCta"
  | "profile.footer"
  | "settings.accountHeading"
  | "settings.accountDescription"
  | "settings.subscriptionStatus"
  | "settings.fullName"
  | "settings.phone"
  | "settings.preferredLanguage"
  | "settings.country"
  | "settings.updateProfile"
  | "settings.languageEnglish"
  | "settings.languageBangla"
  | "settings.success"
  | "settings.loadError"
  | "settings.updateError";

type Translations = Record<TranslationKey, string>;

const EN_TRANSLATIONS: Translations = {
  "nav.habits": "Habits",
  "nav.finance": "Finance",
  "nav.add": "Add",
  "nav.analytics": "Analytics",
  "nav.profile": "Profile",
  "shell.primary": "Primary",
  "shell.brand": "HabitWallet",
  "sync.offline": "Offline mode active",
  "sync.localMode": "Local mode active (changes are saved)",
  "sync.locked": "Cloud sync locked (Professional feature)",
  "sync.syncing": "Syncing...",
  "sync.pending": "{{count}} {{label}} pending sync",
  "sync.synced": "Synced",
  "sync.syncedAt": "Synced at {{time}}",
  "sync.upgrade": "Upgrade",
  "title.habits": "Habits",
  "title.finance": "Finance",
  "title.quickAdd": "Quick Add",
  "title.insights": "Insights",
  "title.profile": "Profile",
  "title.subscription": "Subscription",
  "profile.pageHeading": "My Sanctum",
  "profile.pageDescription": "Your private space to manage identity, security, and premium configurations.",
  "profile.premiumHeading": "Premium Experience",
  "profile.premiumDescription": "Upgrade to Professional for 90-day insights and PDF exports while keeping your core tracking free forever.",
  "profile.subscriptionCta": "Subscription",
  "profile.footer": "HabitWallet Version 1.0.2 • Secure Cloud Auth",
  "settings.accountHeading": "Account Settings",
  "settings.accountDescription": "Modify your identity and regional preferences.",
  "settings.subscriptionStatus": "Subscription Status",
  "settings.fullName": "Full Name",
  "settings.phone": "Phone Number",
  "settings.preferredLanguage": "Preferred Language",
  "settings.country": "Home Region/Country",
  "settings.updateProfile": "Update Profile",
  "settings.languageEnglish": "English (Global)",
  "settings.languageBangla": "Bangla (Native)",
  "settings.success": "Profile settings updated successfully!",
  "settings.loadError": "Could not load profile.",
  "settings.updateError": "Profile update failed.",
};

const BN_TRANSLATIONS: Translations = {
  "nav.habits": "অভ্যাস",
  "nav.finance": "আর্থিক",
  "nav.add": "যোগ করুন",
  "nav.analytics": "বিশ্লেষণ",
  "nav.profile": "প্রোফাইল",
  "shell.primary": "প্রধান নেভিগেশন",
  "shell.brand": "হ্যাবিটওয়ালেট",
  "sync.offline": "অফলাইন মোড চালু আছে",
  "sync.localMode": "লোকাল মোড চালু (পরিবর্তন সেভ হচ্ছে)",
  "sync.locked": "ক্লাউড সিঙ্ক লকড (প্রফেশনাল ফিচার)",
  "sync.syncing": "সিঙ্ক হচ্ছে...",
  "sync.pending": "{{count}} {{label}} সিঙ্ক বাকি",
  "sync.synced": "সিঙ্ক সম্পন্ন",
  "sync.syncedAt": "সর্বশেষ সিঙ্ক {{time}}",
  "sync.upgrade": "আপগ্রেড",
  "title.habits": "অভ্যাস",
  "title.finance": "আর্থিক",
  "title.quickAdd": "দ্রুত যোগ",
  "title.insights": "ইনসাইটস",
  "title.profile": "প্রোফাইল",
  "title.subscription": "সাবস্ক্রিপশন",
  "profile.pageHeading": "আমার স্পেস",
  "profile.pageDescription": "পরিচয়, নিরাপত্তা ও প্রিমিয়াম সেটিংস ব্যবস্থাপনার ব্যক্তিগত স্থান।",
  "profile.premiumHeading": "প্রিমিয়াম অভিজ্ঞতা",
  "profile.premiumDescription": "৯০ দিনের ইনসাইটস ও পিডিএফ এক্সপোর্ট পেতে প্রফেশনালে আপগ্রেড করুন, মূল ট্র্যাকিং থাকবে ফ্রি।",
  "profile.subscriptionCta": "সাবস্ক্রিপশন",
  "profile.footer": "হ্যাবিটওয়ালেট সংস্করণ ১.০.২ • নিরাপদ ক্লাউড অথ",
  "settings.accountHeading": "অ্যাকাউন্ট সেটিংস",
  "settings.accountDescription": "পরিচয় ও আঞ্চলিক পছন্দ পরিবর্তন করুন।",
  "settings.subscriptionStatus": "সাবস্ক্রিপশন স্ট্যাটাস",
  "settings.fullName": "পূর্ণ নাম",
  "settings.phone": "ফোন নম্বর",
  "settings.preferredLanguage": "পছন্দের ভাষা",
  "settings.country": "দেশ/অঞ্চল",
  "settings.updateProfile": "প্রোফাইল আপডেট",
  "settings.languageEnglish": "ইংরেজি (গ্লোবাল)",
  "settings.languageBangla": "বাংলা (নেটিভ)",
  "settings.success": "প্রোফাইল সেটিংস সফলভাবে আপডেট হয়েছে!",
  "settings.loadError": "প্রোফাইল লোড করা যায়নি।",
  "settings.updateError": "প্রোফাইল আপডেট ব্যর্থ হয়েছে।",
};

const TITLE_KEY_MAP: Record<string, TranslationKey> = {
  Habits: "title.habits",
  Finance: "title.finance",
  "Quick Add": "title.quickAdd",
  Insights: "title.insights",
  Profile: "title.profile",
  Subscription: "title.subscription",
};

export function t(language: AppLanguage, key: TranslationKey, vars?: Record<string, string | number>) {
  const dict = language === "bn" ? BN_TRANSLATIONS : EN_TRANSLATIONS;
  let text = dict[key] ?? EN_TRANSLATIONS[key];

  if (!vars) {
    return text;
  }

  for (const [name, value] of Object.entries(vars)) {
    text = text.replace(`{{${name}}}`, String(value));
  }

  return text;
}

export function translateTitle(language: AppLanguage, rawTitle: string) {
  const key = TITLE_KEY_MAP[rawTitle];
  if (!key) {
    return rawTitle;
  }

  return t(language, key);
}
