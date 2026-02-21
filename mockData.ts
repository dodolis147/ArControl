
import { ACUnit, UnitStatus, ServiceType, User, UserRole, UserStatus } from './types';

export const MOCK_USERS: User[] = [
  {
    id: '1',
    username: 'admin',
    password: 'admin',
    role: UserRole.ADMIN,
    clientName: null,
    status: UserStatus.ACTIVE,
    email: 'suporte@arcontrol.com',
    phone: '71988638342'
  },
  {
    id: '2',
    username: 'cliente',
    password: '123',
    role: UserRole.CLIENT,
    clientName: 'Hospital Central',
    status: UserStatus.ACTIVE,
    email: 'contato@hospital.com'
  },
  {
    id: '3',
    username: 'tecnico',
    password: '123',
    role: UserRole.TECHNICIAN,
    clientName: null,
    status: UserStatus.ACTIVE,
    email: 'tecnico@arcontrol.com'
  }
];

export const MOCK_UNITS: ACUnit[] = [
  {
    id: 'AC-7721',
    clientName: 'Hospital Central',
    department: 'Radiologia',
    brand: 'Samsung',
    model: 'WindFree Inverter',
    serialNumber: 'SN-99812-RT',
    btu: 12000,
    location: 'Sala 04 - Térreo',
    regional: 'Salvador - BA',
    installDate: '2023-01-15',
    status: UnitStatus.OPERATIONAL,
    history: [
      {
        id: 'h1',
        type: ServiceType.CLEANING,
        technician: 'João Silva',
        description: 'Limpeza de filtros e higienização da evaporadora.',
        date: '2023-12-10',
        time: '14:30',
        photos: ['https://picsum.photos/seed/ac1/300/300']
      }
    ],
    planned: [
      {
        id: 'p1',
        type: ServiceType.PREVENTIVE,
        description: 'Manutenção periódica de 6 meses.',
        expectedDate: '2024-06-10'
      }
    ],
    unitPhotos: ['https://picsum.photos/seed/acmain1/500/500']
  },
  {
    id: 'AC-8812',
    clientName: 'Escritório Advocacia Silva',
    department: 'Diretoria',
    brand: 'LG',
    model: 'Dual Inverter',
    serialNumber: 'LG-7761-AS',
    btu: 18000,
    location: 'Gabinete Principal',
    regional: 'Feira de Santana - BA',
    installDate: '2022-05-20',
    status: UnitStatus.MAINTENANCE_REQUIRED,
    history: [],
    planned: [
      {
        id: 'p2',
        type: ServiceType.CLEANING,
        description: 'Limpeza atrasada.',
        expectedDate: '2024-03-01'
      }
    ]
  }
];
