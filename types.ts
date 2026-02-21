
export enum UserRole {
  ADMIN = 'ADMIN',
  CLIENT = 'CLIENT',
  TECHNICIAN = 'TECHNICIAN'
}

export enum UserStatus {
  ACTIVE = 'ACTIVE',
  BLOCKED = 'BLOCKED'
}

export enum ServiceType {
  PREVENTIVE = 'PREVENTIVA',
  // Fixed typo: CORRETIVE -> CORRECTIVE
  CORRECTIVE = 'CORRETIVA',
  CLEANING = 'LIMPEZA',
  INSTALLATION = 'INSTALAÇÃO'
}

export enum UnitStatus {
  OPERATIONAL = 'Operacional',
  MAINTENANCE_REQUIRED = 'Necessita Manutenção',
  STOPPED = 'Parado',
  EQUIPAMENTO = 'Equipamento',
  AWAITING_PARTS = 'Aguardando peça'
}

export interface DocumentAttachment {
  name: string;
  url: string;
}

export interface User {
  id: string;
  username: string;
  password?: string;
  email?: string;
  phone?: string;
  role: UserRole;
  clientName: string | null;
  status: UserStatus;
}

export interface MaintenanceRecord {
  id: string;
  type: ServiceType;
  technician: string;
  description: string;
  date: string;
  time?: string;
  photos?: string[];
  rating?: number; // 1 to 5 stars
  technicalReport?: string;
  documents?: DocumentAttachment[];
}

export interface PlannedMaintenance {
  id: string;
  type: ServiceType;
  description: string;
  expectedDate: string;
}

export interface ACUnit {
  id: string;
  clientName: string;
  department: string;
  brand: string;
  model: string;
  serialNumber: string;
  btu: number;
  location: string;
  regional: string;
  installDate: string;
  status: UnitStatus;
  history: MaintenanceRecord[];
  planned: PlannedMaintenance[];
  unitPhotos?: string[];
}

export interface Ticket {
  id: string;
  unitId?: string;
  clientName: string;
  description: string;
  date: string;
  status: 'Aberto' | 'Em Atendimento' | 'Concluído' | 'Reagendado';
  priority: 'Baixa' | 'Média' | 'Alta' | 'Urgente';
  technicianId?: string; // ID or Username of the technician
  rating?: number; // 1 to 5
  feedback?: string; // Optional text feedback
  rescheduleReason?: string; // Justification for rescheduling
  solution?: string; // Description of the service performed
  photos?: string[]; // Photos of the service
  technicalReport?: string;
  documents?: DocumentAttachment[];
}
