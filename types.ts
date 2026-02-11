
export enum UserRole {
  SUPER_ADMIN = 'SUPER_ADMIN',
  ADMIN = 'ADMIN',
  MANAGER = 'MANAGER',
  RECEPTIONIST = 'RECEPTIONIST',
  NURSE = 'NURSE',
  PATHOLOGIST = 'PATHOLOGIST'
}

export type InvoiceType = 'General' | 'OPD' | 'Pathology' | 'Pharmacy' | 'Emergency' | 'Surgery';

export type PaymentMethod = 'Cash' | 'Card' | 'Mobile Banking' | 'Insurance' | 'Other';

export interface Degree {
  id: string;
  name: string;
}

export interface Professional {
  id: string;
  name: string;
  degree: string;
  category: 'Hospital' | 'Out';
  outType?: 'Doctor' | 'Pharmacist' | 'Field Refer';
  phone?: string;
  commissionEnabled: boolean;
  commissionRate: number;
}

export interface User {
  id: string;
  name: string;
  username: string;
  password?: string;
  role: UserRole;
  email: string;
  phone?: string;
  status: 'active' | 'inactive';
}

export interface Patient {
  id: string;
  name: string;
  age: number;
  sex: 'Male' | 'Female' | 'Other';
  mobile: string;
  address?: string;
  regDate: string;
  history: string[];
  followUpDate?: string;
  followUpReason?: string;
}

export interface Room {
  id: string;
  number: string;
  type: 'General' | 'Cabin' | 'AC Cabin' | 'ICU' | 'NICU' | 'Emergency';
  pricePerDay: number;
  floor: string;
  status: 'Available' | 'Occupied' | 'Maintenance';
}

export interface AdmittedPatient {
  id: string;
  patientId: string;
  admissionDate: string;
  dischargeDate?: string;
  roomNumber: string;
  bedNumber: string;
  doctorInChargeId: string; 
  status: 'admitted' | 'discharged';
  notes?: string;
  guardianName?: string;
  guardianPhone?: string;
  guardianRelation?: string;
  bloodGroup?: string;
  admissionDiagnosis?: string;
  allergies?: string;
}

export interface ServiceCategory {
  id: string;
  name: string;
}

export interface ServiceItem {
  id: string;
  category: string;
  name: string;
  price: number;
  commissionRate?: number;
}

export interface BillItem {
  id: string;
  serviceId: string;
  name: string;
  qty: number;
  price: number;
  total: number;
  commissionRate: number; 
}

export interface PaymentRecord {
  id: string;
  date: string;
  amount: number;
  method: PaymentMethod;
  note?: string;
}

export interface Bill {
  id: string;
  type: InvoiceType;
  patientId?: string;
  walkInName?: string;
  walkInMobile?: string;
  walkInAge?: number;
  walkInSex?: 'Male' | 'Female' | 'Other';
  referringDoctorId?: string; 
  referringDoctorManual?: string;
  consultantDoctorId?: string; 
  consultantDoctorManual?: string;
  items: BillItem[];
  totalAmount: number;
  discount: number;
  taxAmount?: number;
  paidAmount: number;
  dueAmount: number;
  paymentMethod?: PaymentMethod;
  payments?: PaymentRecord[];
  date: string;
  status: 'paid' | 'partial' | 'due';
  authorUsername?: string;
  authorName?: string;
}

export interface TrashItem {
  id: string;
  originalId: string;
  type: 'Bill' | 'Patient' | 'Service' | 'User' | 'Admission' | 'Room' | 'Professional';
  name: string;
  data: any;
  deletedAt: string;
}

export interface Expense {
  id: string;
  description: string;
  amount: number;
  category: string;
  date: string;
  recordedBy: string;
}

export interface Commission {
  id: string;
  billId: string;
  staffId: string; 
  amount: number;
  date: string;
  type: string;
  calculationMethod: 'Item-Based' | 'Flat-Rate';
}

export interface HospitalConfig {
  name: string;
  address: string;
  phone: string;
  email: string;
  website: string;
  socialMedia: string;
  tagline: string;
  logo?: string;
  currencySymbol: string;
  timeZone: string;
  dateFormat: string;
  googleDriveEnabled: boolean;
  googleClientId?: string;
  googleApiKey?: string;
  autoBackupEnabled: boolean;
  lastAutoBackup?: string;
  invoiceIdPrefix: string;
  invoiceIdDateFormat: 'none' | 'YYYYMM' | 'YYYYMMDD' | 'YYMM' | 'YYMMDD';
  invoiceIdPadding: number;
  invoiceIdSeparator: string;
  taxRate?: number;
}
