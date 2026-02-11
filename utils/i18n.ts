export const translations: Record<string, Record<string, string>> = {
  English: {
    dashboard: 'Dashboard',
    billing: 'Billing Center',
    patients: 'Patients',
  }
};

export const getTranslation = (lang: string, key: string) => {
  return key;
};