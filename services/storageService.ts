
import { User, Patient, Bill, ServiceItem, UserRole, Commission, HospitalConfig, Expense, TrashItem, AdmittedPatient, Room, ServiceCategory, Professional } from '../types';

const API_BASE = './api.php';

export const KEYS = {
  USERS: 'medcore_users',
  PATIENTS: 'medcore_patients',
  BILLS: 'medcore_bills',
  SERVICES: 'medcore_services',
  SERVICE_CATEGORIES: 'medcore_service_categories',
  COMMISSIONS: 'medcore_commissions',
  SESSION: 'medcore_session',
  HOSPITAL_CONFIG: 'medcore_hospital_config',
  EXPENSES: 'medcore_expenses',
  THEME: 'medcore_theme',
  TRASH: 'medcore_trash',
  ADMITTED: 'medcore_admitted',
  ROOMS: 'medcore_rooms',
  PROFESSIONALS: 'medcore_professionals'
};

const INITIAL_PROFESSIONALS: Professional[] = [
  { id: 'PRO-101', name: 'Dr. Sarah Smith', degree: 'MBBS, MD', category: 'Hospital', commissionEnabled: true, commissionRate: 10 },
  { id: 'PRO-102', name: 'Dr. James Wilson', degree: 'MBBS, FCPS', category: 'Out', outType: 'Doctor', commissionEnabled: true, commissionRate: 20 },
  { id: 'PRO-103', name: 'Metro Pharmacy', degree: 'B.Pharm', category: 'Out', outType: 'Pharmacist', commissionEnabled: true, commissionRate: 5 },
  { id: 'PRO-104', name: 'John Referral Agent', degree: 'Diploma', category: 'Out', outType: 'Field Refer', commissionEnabled: true, commissionRate: 15 },
];

const INITIAL_CATEGORIES: ServiceCategory[] = [
  { id: 'CAT1', name: 'OPD' },
  { id: 'CAT2', name: 'Pathology' },
  { id: 'CAT3', name: 'Imaging' },
  { id: 'CAT4', name: 'Pharmacy' },
  { id: 'CAT5', name: 'Emergency' },
];

const INITIAL_SERVICES: ServiceItem[] = [
  { id: 'S1', category: 'OPD', name: 'General Consultation', price: 500, commissionRate: 20 },
  { id: 'S2', category: 'OPD', name: 'Follow-up Consultation', price: 300, commissionRate: 20 },
  { id: 'S3', category: 'Pathology', name: 'Complete Blood Count (CBC)', price: 450, commissionRate: 15 },
  { id: 'S4', category: 'Pathology', name: 'Thyroid Profile', price: 1200, commissionRate: 15 },
  { id: 'S5', category: 'Pathology', name: 'Blood Sugar (F)', price: 100, commissionRate: 15 },
];

const INITIAL_USERS: User[] = [
  { id: 'U1', name: 'Sohan Bhuiyan', username: 'admin', password: 'password', role: UserRole.SUPER_ADMIN, email: 'admin@sohanhms.com', status: 'active' },
];

const INITIAL_ROOMS: Room[] = [
  { id: 'RM1', number: '101', type: 'General', pricePerDay: 800, floor: '1st Floor', status: 'Available' },
  { id: 'RM2', number: '102', type: 'General', pricePerDay: 800, floor: '1st Floor', status: 'Available' },
  { id: 'RM3', number: '201', type: 'AC Cabin', pricePerDay: 2500, floor: '2nd Floor', status: 'Available' },
  { id: 'RM4', number: 'ICU-1', type: 'ICU', pricePerDay: 5000, floor: 'Ground Floor', status: 'Available' },
];

const INITIAL_HOSPITAL: HospitalConfig = {
  name: "Sohan's Hospital Management",
  address: '123 Health Ave, Medical District, NY 10001',
  phone: '+1 (555) 000-1234',
  email: 'contact@sohanhms.com',
  website: 'www.sohanhms.com',
  socialMedia: '@sohanhms',
  tagline: 'Precision Care, Intelligent Healing',
  currencySymbol: 'Tk',
  timeZone: 'UTC',
  dateFormat: 'DD/MM/YYYY',
  googleDriveEnabled: false,
  autoBackupEnabled: false,
  invoiceIdPrefix: 'INV',
  invoiceIdDateFormat: 'YYYYMM',
  invoiceIdPadding: 4,
  invoiceIdSeparator: '-',
  taxRate: 0
};

async function apiFetch(route: string, options?: RequestInit, id?: string) {
  if (!navigator.onLine) return getLocalFallback(route);

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    const url = `${API_BASE}?route=${route}${id ? `&id=${id}` : ''}`;
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: { 'Content-Type': 'application/json', ...options?.headers }
    });
    
    clearTimeout(timeoutId);
    if (response.ok) {
        const result = await response.json();
        const keyMap: Record<string, string> = {
            'patients': KEYS.PATIENTS, 'bills': KEYS.BILLS, 'services': KEYS.SERVICES,
            'categories': KEYS.SERVICE_CATEGORIES, 'users': KEYS.USERS, 'commissions': KEYS.COMMISSIONS,
            'expenses': KEYS.EXPENSES, 'trash': KEYS.TRASH, 'admissions': KEYS.ADMITTED, 'rooms': KEYS.ROOMS,
            'professionals': KEYS.PROFESSIONALS
        };
        const key = keyMap[route];
        if (key && Array.isArray(result)) localStorage.setItem(key, JSON.stringify(result));
        return result;
    }
    return getLocalFallback(route);
  } catch (error) {
    return getLocalFallback(route);
  }
}

function getLocalFallback(route: string) {
  const keyMap: Record<string, string> = {
    'patients': KEYS.PATIENTS, 'bills': KEYS.BILLS, 'services': KEYS.SERVICES,
    'categories': KEYS.SERVICE_CATEGORIES, 'users': KEYS.USERS, 'commissions': KEYS.COMMISSIONS,
    'expenses': KEYS.EXPENSES, 'trash': KEYS.TRASH, 'admissions': KEYS.ADMITTED, 'rooms': KEYS.ROOMS,
    'professionals': KEYS.PROFESSIONALS
  };
  const key = keyMap[route] || `medcore_${route}`;
  const data = localStorage.getItem(key);
  return data ? JSON.parse(data) : [];
}

async function apiPost(route: string, data: any) {
    return await apiFetch(route, {
        method: 'POST',
        body: JSON.stringify(data)
    });
}

export const storageService = {
  init: () => {
    if (!localStorage.getItem(KEYS.USERS)) localStorage.setItem(KEYS.USERS, JSON.stringify(INITIAL_USERS));
    if (!localStorage.getItem(KEYS.SERVICES)) localStorage.setItem(KEYS.SERVICES, JSON.stringify(INITIAL_SERVICES));
    if (!localStorage.getItem(KEYS.SERVICE_CATEGORIES)) localStorage.setItem(KEYS.SERVICE_CATEGORIES, JSON.stringify(INITIAL_CATEGORIES));
    if (!localStorage.getItem(KEYS.PATIENTS)) localStorage.setItem(KEYS.PATIENTS, JSON.stringify([]));
    if (!localStorage.getItem(KEYS.BILLS)) localStorage.setItem(KEYS.BILLS, JSON.stringify([]));
    if (!localStorage.getItem(KEYS.COMMISSIONS)) localStorage.setItem(KEYS.COMMISSIONS, JSON.stringify([]));
    if (!localStorage.getItem(KEYS.HOSPITAL_CONFIG)) localStorage.setItem(KEYS.HOSPITAL_CONFIG, JSON.stringify(INITIAL_HOSPITAL));
    if (!localStorage.getItem(KEYS.EXPENSES)) localStorage.setItem(KEYS.EXPENSES, JSON.stringify([]));
    if (!localStorage.getItem(KEYS.THEME)) localStorage.setItem(KEYS.THEME, 'light');
    if (!localStorage.getItem(KEYS.TRASH)) localStorage.setItem(KEYS.TRASH, JSON.stringify([]));
    if (!localStorage.getItem(KEYS.ADMITTED)) localStorage.setItem(KEYS.ADMITTED, JSON.stringify([]));
    if (!localStorage.getItem(KEYS.ROOMS)) localStorage.setItem(KEYS.ROOMS, JSON.stringify(INITIAL_ROOMS));
    if (!localStorage.getItem(KEYS.PROFESSIONALS)) localStorage.setItem(KEYS.PROFESSIONALS, JSON.stringify(INITIAL_PROFESSIONALS));
  },

  getUsers: async (): Promise<User[]> => await apiFetch('users'),
  saveUsers: async (users: User[]) => { 
      localStorage.setItem(KEYS.USERS, JSON.stringify(users));
      for (const u of users) await apiPost('users', u);
  },

  getProfessionals: async (): Promise<Professional[]> => await apiFetch('professionals'),
  saveProfessionals: async (profs: Professional[]) => {
      localStorage.setItem(KEYS.PROFESSIONALS, JSON.stringify(profs));
      for (const p of profs) await apiPost('professionals', p);
  },

  getPatients: async (): Promise<Patient[]> => await apiFetch('patients'),
  savePatients: async (patients: Patient[]) => {
      localStorage.setItem(KEYS.PATIENTS, JSON.stringify(patients));
      for (const p of patients) await apiPost('patients', p);
  },

  getServices: async (): Promise<ServiceItem[]> => await apiFetch('services'),
  saveServices: async (services: ServiceItem[]) => {
      localStorage.setItem(KEYS.SERVICES, JSON.stringify(services));
      for (const s of services) await apiPost('services', s);
  },

  getServiceCategories: async (): Promise<ServiceCategory[]> => await apiFetch('categories'),
  saveServiceCategories: async (categories: ServiceCategory[]) => {
      localStorage.setItem(KEYS.SERVICE_CATEGORIES, JSON.stringify(categories));
      for (const c of categories) await apiPost('categories', c);
  },

  getBills: async (): Promise<Bill[]> => await apiFetch('bills'),
  saveBills: async (bills: Bill[]) => {
      localStorage.setItem(KEYS.BILLS, JSON.stringify(bills));
      for (const b of bills) await apiPost('bills', b);
  },

  getExpenses: async (): Promise<Expense[]> => await apiFetch('expenses'),
  saveExpenses: async (expenses: Expense[]) => {
      localStorage.setItem(KEYS.EXPENSES, JSON.stringify(expenses));
      for (const e of expenses) await apiPost('expenses', e);
  },

  getRooms: async (): Promise<Room[]> => await apiFetch('rooms'),
  saveRooms: async (rooms: Room[]) => {
      localStorage.setItem(KEYS.ROOMS, JSON.stringify(rooms));
      for (const r of rooms) await apiPost('rooms', r);
  },

  getAdmissions: async (): Promise<AdmittedPatient[]> => await apiFetch('admissions'),
  saveAdmissions: async (admissions: AdmittedPatient[]) => {
      localStorage.setItem(KEYS.ADMITTED, JSON.stringify(admissions));
      for (const a of admissions) await apiPost('admissions', a);
  },

  getCommissions: async (): Promise<Commission[]> => await apiFetch('commissions'),
  saveCommissions: async (commissions: Commission[]) => {
      localStorage.setItem(KEYS.COMMISSIONS, JSON.stringify(commissions));
      for (const c of commissions) await apiPost('commissions', c);
  },

  getTrash: async (): Promise<TrashItem[]> => await apiFetch('trash'),
  saveTrash: async (trash: TrashItem[]) => {
      localStorage.setItem(KEYS.TRASH, JSON.stringify(trash));
      for (const t of trash) await apiPost('trash', t);
  },

  getHospitalConfig: (): HospitalConfig => {
    const data = localStorage.getItem(KEYS.HOSPITAL_CONFIG);
    if (!data) return INITIAL_HOSPITAL;
    return { ...INITIAL_HOSPITAL, ...JSON.parse(data) };
  },
  saveHospitalConfig: (config: HospitalConfig) => localStorage.setItem(KEYS.HOSPITAL_CONFIG, JSON.stringify(config)),

  getCurrentSession: (): User | null => {
    const sessionStr = localStorage.getItem(KEYS.SESSION);
    if (!sessionStr) return null;
    try {
      const sessionData = JSON.parse(sessionStr);
      const isNewBrowserSession = !sessionStorage.getItem('medcore_transient_active');
      if (isNewBrowserSession && !sessionData.rememberMe) {
        localStorage.removeItem(KEYS.SESSION);
        return null;
      }
      const now = Date.now();
      const thirtyMinutes = 30 * 60 * 1000;
      if (now - sessionData.lastSeen > thirtyMinutes) {
        localStorage.removeItem(KEYS.SESSION);
        return null;
      }
      sessionStorage.setItem('medcore_transient_active', 'true');
      return sessionData.user;
    } catch (e) { return null; }
  },

  updateSessionActivity: () => {
    const sessionStr = localStorage.getItem(KEYS.SESSION);
    if (sessionStr) {
      const sessionData = JSON.parse(sessionStr);
      sessionData.lastSeen = Date.now();
      localStorage.setItem(KEYS.SESSION, JSON.stringify(sessionData));
    }
  },

  login: (user: User, remember: boolean = false) => {
    const sessionData = { user, rememberMe: remember, lastSeen: Date.now(), loginTime: Date.now() };
    localStorage.setItem(KEYS.SESSION, JSON.stringify(sessionData));
    sessionStorage.setItem('medcore_transient_active', 'true');
  },

  logout: () => {
    localStorage.removeItem(KEYS.SESSION);
    sessionStorage.removeItem('medcore_transient_active');
  },

  getTheme: (): 'light' | 'dark' => (localStorage.getItem(KEYS.THEME) as 'light' | 'dark') || 'light',
  saveTheme: (theme: 'light' | 'dark') => localStorage.setItem(KEYS.THEME, theme),

  generateInvoiceId: (currentBills: Bill[]) => {
    const config = storageService.getHospitalConfig();
    const now = new Date();
    let datePart = '';
    const year = now.getFullYear().toString();
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    const day = now.getDate().toString().padStart(2, '0');
    const shortYear = year.slice(-2);

    switch (config.invoiceIdDateFormat) {
      case 'YYYYMM': datePart = year + month; break;
      case 'YYYYMMDD': datePart = year + month + day; break;
      case 'YYMM': datePart = shortYear + month; break;
      case 'YYMMDD': datePart = shortYear + month + day; break;
      default: datePart = '';
    }

    const sep = config.invoiceIdSeparator || '-';
    let max = 0;
    
    currentBills.forEach(b => {
      const parts = b.id.split(sep);
      const lastPart = parts[parts.length - 1];
      const num = parseInt(lastPart);
      if (!isNaN(num) && num > max) max = num;
    });

    const count = (max + 1).toString().padStart(config.invoiceIdPadding || 4, '0');
    const parts = [];
    if (config.invoiceIdPrefix) parts.push(config.invoiceIdPrefix);
    if (datePart) parts.push(datePart);
    parts.push(count);
    return parts.join(sep);
  },

  generatePatientId: (currentPatients: Patient[]) => {
    let max = 1000;
    currentPatients.forEach(p => {
      const num = parseInt(p.id.replace('P-', ''));
      if (!isNaN(num) && num > max) max = num;
    });
    return `P-${max + 1}`;
  },

  generateProfessionalId: (currentProfessionals: Professional[]) => {
    let max = 100;
    currentProfessionals.forEach(p => {
      const num = parseInt(p.id.replace('PRO-', ''));
      if (!isNaN(num) && num > max) max = num;
    });
    return `PRO-${max + 1}`;
  }
};
