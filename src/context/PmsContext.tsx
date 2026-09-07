"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';

export interface Room {
  id: string;
  number: string;
  floor: number;
  type: string;
  capacity: number;
  bedType: string;
  dailyRate: number;
  weeklyRate: number;
  monthlyRate: number;
  status: 'AVAILABLE' | 'RESERVED' | 'OCCUPIED' | 'CHECK_IN_TODAY' | 'CHECK_OUT_TODAY' | 'CLEANING_REQUIRED' | 'UNDER_MAINTENANCE' | 'LONG_STAY';
  kitchenEligible: boolean;
  longStayEligible: boolean;
  currentGuest?: string;
  cleaningStaff?: string;
  maintenanceNote?: string;
}

export interface Reservation {
  id: string;
  otaReference?: string;
  guestName: string;
  email: string;
  phone: string;
  nationality: string;
  passportNumber: string;
  roomNumber: string;
  roomType: string;
  checkInDate: string;
  checkOutDate: string;
  adults: number;
  children: number;
  totalAmount: number;
  paidAmount: number;
  status: 'CONFIRMED' | 'CHECKED_IN' | 'CHECKED_OUT' | 'CANCELLED';
  source: 'Booking.com' | 'Agoda' | 'Airbnb' | 'Trip.com' | 'Direct Website' | 'Walk-In' | 'WhatsApp' | 'Phone';
  specialRequests?: string;
  createdAt: string;
}

export interface LongStayContract {
  id: string;
  guestName: string;
  email: string;
  phone: string;
  passport: string;
  roomNumber: string;
  startDate: string;
  endDate: string;
  monthlyRent: number;
  securityDeposit: number;
  kitchenAccess: boolean;
  depositStatus: 'HELD' | 'REFUNDED' | 'DEDUCTED';
  rentPaidUntil: string;
  status: 'ACTIVE' | 'EXPIRING' | 'TERMINATED';
  notes?: string;
}

export interface KitchenUser {
  id: string;
  guestName: string;
  roomNumber: string;
  passType: 'Long Stay' | 'Short Stay Add-on';
  validFrom: string;
  validTo: string;
  depositAmount: number;
  depositStatus: 'HELD' | 'REFUNDED' | 'PARTIAL_DEDUCTED';
  status: 'ACTIVE' | 'EXPIRED' | 'REVOKED';
}

export interface KitchenIncident {
  id: string;
  date: string;
  type: string;
  guestName: string;
  roomNumber: string;
  costNpr: number;
  status: 'Deducted from Deposit' | 'Waived' | 'Pending Review';
  note: string;
}

export interface HousekeepingTask {
  id: string;
  roomNumber: string;
  type: 'Regular Clean' | 'Deep Clean' | 'Turnover Clean' | 'Linen Change';
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'INSPECTED';
  assignedTo: string;
  priority: 'NORMAL' | 'HIGH' | 'URGENT';
  scheduledTime: string;
  note?: string;
}

export interface MaintenanceTicket {
  id: string;
  location: string; // Room 301, Shared Kitchen, etc.
  issue: string;
  reportedBy: string;
  reportedAt: string;
  priority: 'Low' | 'Medium' | 'Urgent';
  status: 'Open' | 'In Progress' | 'Resolved';
  assignedTechnician?: string;
}

export interface Invoice {
  id: string;
  reservationId?: string;
  invoiceDate: string;
  dueDate: string;
  guestName: string;
  roomNumber: string;
  items: { description: string; quantity: number; unitPrice: number; total: number }[];
  subtotal: number;
  taxAmount: number; // 13% VAT
  serviceCharge: number; // 10% Service
  discount: number;
  grandTotal: number;
  paidAmount: number;
  paymentMethod?: 'Cash NPR' | 'Cash USD' | 'eSewa' | 'Khalti' | 'Visa' | 'MasterCard' | 'Bank Transfer';
  status: 'PAID' | 'UNPAID' | 'PARTIAL';
}

export interface NotificationItem {
  id: string;
  title: string;
  detail: string;
  timestamp: string;
  type: 'Booking' | 'LongStay' | 'Billing' | 'Kitchen' | 'Maintenance' | 'Channel';
  channel: 'WhatsApp' | 'Email' | 'In-App' | 'SMS';
  status: 'Delivered' | 'Action Required' | 'Resolved';
}

interface PmsContextType {
  rooms: Room[];
  reservations: Reservation[];
  contracts: LongStayContract[];
  kitchenUsers: KitchenUser[];
  kitchenIncidents: KitchenIncident[];
  gasLevel: number;
  housekeepingTasks: HousekeepingTask[];
  maintenanceTickets: MaintenanceTicket[];
  invoices: Invoice[];
  notifications: NotificationItem[];
  stopSellActive: boolean;
  addReservation: (reservation: Omit<Reservation, 'id' | 'createdAt'>) => void;
  checkInGuest: (reservationId: string, passport?: string) => void;
  checkOutGuest: (reservationId: string, paymentDetails?: { method: Invoice['paymentMethod']; amount: number }) => void;
  updateRoomStatus: (roomNumber: string, status: Room['status'], note?: string) => void;
  addLongStayContract: (contract: Omit<LongStayContract, 'id'>) => void;
  addKitchenPass: (pass: Omit<KitchenUser, 'id'>) => void;
  addKitchenIncident: (incident: Omit<KitchenIncident, 'id' | 'date'>) => void;
  updateGasLevel: (level: number) => void;
  updateHousekeepingStatus: (taskId: string, status: HousekeepingTask['status']) => void;
  addMaintenanceTicket: (ticket: Omit<MaintenanceTicket, 'id' | 'reportedAt'>) => void;
  resolveMaintenanceTicket: (ticketId: string) => void;
  createInvoice: (invoice: Omit<Invoice, 'id'>) => Invoice;
  recordPayment: (invoiceId: string, amount: number, method: Invoice['paymentMethod']) => void;
  toggleStopSell: () => void;
}

const initialRooms: Room[] = [
  { id: '1', number: '201', floor: 2, type: 'Standard Double', capacity: 2, bedType: 'Queen Bed', dailyRate: 3500, weeklyRate: 21000, monthlyRate: 45000, status: 'AVAILABLE', kitchenEligible: true, longStayEligible: true },
  { id: '2', number: '202', floor: 2, type: 'Standard Double', capacity: 2, bedType: 'Queen Bed', dailyRate: 3500, weeklyRate: 21000, monthlyRate: 45000, status: 'OCCUPIED', kitchenEligible: true, longStayEligible: true, currentGuest: 'Sarah Connor', cleaningStaff: 'Pasang Lhamu' },
  { id: '3', number: '203', floor: 2, type: 'Deluxe Twin', capacity: 2, bedType: '2 Single Beds', dailyRate: 4200, weeklyRate: 25000, monthlyRate: 50000, status: 'LONG_STAY', kitchenEligible: true, longStayEligible: true, currentGuest: 'Carlos Gomez', cleaningStaff: 'Dawa Sherpa' },
  { id: '4', number: '301', floor: 3, type: 'Deluxe Double', capacity: 2, bedType: 'King Bed', dailyRate: 4500, weeklyRate: 27000, monthlyRate: 55000, status: 'UNDER_MAINTENANCE', kitchenEligible: true, longStayEligible: true, maintenanceNote: 'Shower pressure calibration' },
  { id: '5', number: '302', floor: 3, type: 'Standard Twin', capacity: 2, bedType: '2 Single Beds', dailyRate: 3800, weeklyRate: 23000, monthlyRate: 48000, status: 'LONG_STAY', kitchenEligible: true, longStayEligible: true, currentGuest: 'Jane Smith', cleaningStaff: 'Dawa Sherpa' },
  { id: '6', number: '303', floor: 3, type: 'Family Suite', capacity: 4, bedType: '1 King + 2 Singles', dailyRate: 6500, weeklyRate: 39000, monthlyRate: 85000, status: 'AVAILABLE', kitchenEligible: true, longStayEligible: true },
];

const initialReservations: Reservation[] = [
  {
    id: 'RES-1001',
    otaReference: 'BK-991204',
    guestName: 'Sarah Connor',
    email: 'sarah.connor@gmail.com',
    phone: '+1 555 0192',
    nationality: 'American',
    passportNumber: 'USA8892104',
    roomNumber: '202',
    roomType: 'Standard Double',
    checkInDate: new Date().toISOString().split('T')[0],
    checkOutDate: new Date(Date.now() + 86400000 * 3).toISOString().split('T')[0],
    adults: 2,
    children: 0,
    totalAmount: 10500,
    paidAmount: 10500,
    status: 'CHECKED_IN',
    source: 'Booking.com',
    specialRequests: 'Quiet room on upper side, extra towels',
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
  },
  {
    id: 'RES-1002',
    otaReference: 'AG-77412',
    guestName: 'Michael Chang',
    email: 'm.chang@outlook.com',
    phone: '+852 9123 4567',
    nationality: 'Hong Kong',
    passportNumber: 'HKG491028',
    roomNumber: '201',
    roomType: 'Standard Double',
    checkInDate: new Date().toISOString().split('T')[0],
    checkOutDate: new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0],
    adults: 1,
    children: 0,
    totalAmount: 7000,
    paidAmount: 0,
    status: 'CONFIRMED',
    source: 'Agoda',
    specialRequests: 'Late check-in around 6:00 PM',
    createdAt: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: 'RES-1003',
    guestName: 'Elena Rossi',
    email: 'elena.rossi@yahoo.it',
    phone: '+39 333 123456',
    nationality: 'Italian',
    passportNumber: 'ITA391029',
    roomNumber: '303',
    roomType: 'Family Suite',
    checkInDate: new Date(Date.now() - 86400000 * 4).toISOString().split('T')[0],
    checkOutDate: new Date().toISOString().split('T')[0],
    adults: 2,
    children: 1,
    totalAmount: 26000,
    paidAmount: 26000,
    status: 'CONFIRMED',
    source: 'Direct Website',
    specialRequests: 'Airport pickup arranged',
    createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
  },
];

const initialContracts: LongStayContract[] = [
  {
    id: 'LSC-2023-01',
    guestName: 'Jane Smith',
    email: 'jane.smith@nomad.io',
    phone: '+44 7700 900077',
    passport: 'GBR9920194',
    roomNumber: '302',
    startDate: '2026-08-01',
    endDate: '2026-10-31',
    monthlyRent: 40000,
    securityDeposit: 40000,
    kitchenAccess: true,
    depositStatus: 'HELD',
    rentPaidUntil: '2026-09-30',
    status: 'ACTIVE',
    notes: 'Software engineer working remotely. Renewable monthly.',
  },
  {
    id: 'LSC-2023-02',
    guestName: 'Carlos Gomez',
    email: 'carlos.gomez@madrid.es',
    phone: '+34 600 123 456',
    passport: 'ESP5519284',
    roomNumber: '203',
    startDate: '2026-08-15',
    endDate: '2026-09-15',
    monthlyRent: 45000,
    securityDeposit: 45000,
    kitchenAccess: true,
    depositStatus: 'HELD',
    rentPaidUntil: '2026-09-15',
    status: 'EXPIRING',
    notes: 'Mountaineering research. Lease ends in 5 days.',
  }
];

const initialKitchenUsers: KitchenUser[] = [
  { id: 'KU-101', guestName: 'Jane Smith', roomNumber: '302', passType: 'Long Stay', validFrom: '2026-08-01', validTo: '2026-10-31', depositAmount: 5000, depositStatus: 'HELD', status: 'ACTIVE' },
  { id: 'KU-102', guestName: 'Carlos Gomez', roomNumber: '203', passType: 'Long Stay', validFrom: '2026-08-15', validTo: '2026-09-15', depositAmount: 5000, depositStatus: 'HELD', status: 'ACTIVE' },
  { id: 'KU-103', guestName: 'Sarah Connor', roomNumber: '202', passType: 'Short Stay Add-on', validFrom: '2026-09-04', validTo: '2026-09-07', depositAmount: 2000, depositStatus: 'HELD', status: 'ACTIVE' },
];

const initialIncidents: KitchenIncident[] = [
  { id: 'INC-01', date: '2026-09-02', type: 'Broken Mug & Glass', guestName: 'Carlos Gomez', roomNumber: '203', costNpr: 450, status: 'Deducted from Deposit', note: 'Deducted from deposit upon mutual agreement.' },
  { id: 'INC-02', date: '2026-08-28', type: 'Unattended Stove Top Cleaning', guestName: 'General Notice', roomNumber: 'Shared Area', costNpr: 0, status: 'Waived', note: 'Resolved immediately by morning staff sanitization.' },
];

const initialHousekeeping: HousekeepingTask[] = [
  { id: 'HK-01', roomNumber: '201', type: 'Turnover Clean', status: 'COMPLETED', assignedTo: 'Dawa Sherpa', priority: 'HIGH', scheduledTime: '10:00 AM' },
  { id: 'HK-02', roomNumber: '202', type: 'Linen Change', status: 'IN_PROGRESS', assignedTo: 'Pasang Lhamu', priority: 'NORMAL', scheduledTime: '11:30 AM' },
  { id: 'HK-03', roomNumber: '203', type: 'Regular Clean', status: 'COMPLETED', assignedTo: 'Dawa Sherpa', priority: 'NORMAL', scheduledTime: '01:00 PM' },
  { id: 'HK-04', roomNumber: '301', type: 'Deep Clean', status: 'PENDING', assignedTo: 'Pasang Lhamu', priority: 'HIGH', scheduledTime: '02:00 PM' },
  { id: 'HK-05', roomNumber: '302', type: 'Regular Clean', status: 'COMPLETED', assignedTo: 'Dawa Sherpa', priority: 'NORMAL', scheduledTime: '11:00 AM' },
  { id: 'HK-06', roomNumber: '303', type: 'Turnover Clean', status: 'INSPECTED', assignedTo: 'Pasang Lhamu', priority: 'HIGH', scheduledTime: '09:00 AM' },
];

const initialMaintenance: MaintenanceTicket[] = [
  { id: 'MNT-101', location: 'Room 301', issue: 'Bathroom shower hot water pressure low', reportedBy: 'Front Desk', reportedAt: '2026-09-04 09:30', priority: 'Urgent', status: 'In Progress', assignedTechnician: 'Pemba Plumber' },
  { id: 'MNT-102', location: 'Shared Kitchen', issue: 'Exhaust fan slight motor vibration', reportedBy: 'Dawa Sherpa', reportedAt: '2026-09-03 16:00', priority: 'Medium', status: 'Open', assignedTechnician: 'Kaji Electrician' },
];

const initialInvoices: Invoice[] = [
  {
    id: 'INV-2026-001',
    reservationId: 'RES-1001',
    invoiceDate: '2026-09-04',
    dueDate: '2026-09-04',
    guestName: 'Sarah Connor',
    roomNumber: '202',
    items: [
      { description: 'Standard Double Room (3 Nights)', quantity: 3, unitPrice: 3500, total: 10500 },
      { description: 'Shared Kitchen Pass Add-on (3 Days)', quantity: 3, unitPrice: 500, total: 1500 }
    ],
    subtotal: 12000,
    taxAmount: 1560, // 13% VAT
    serviceCharge: 1200, // 10%
    discount: 500,
    grandTotal: 14260,
    paidAmount: 14260,
    paymentMethod: 'eSewa',
    status: 'PAID',
  },
  {
    id: 'INV-2026-002',
    reservationId: 'RES-1002',
    invoiceDate: '2026-09-04',
    dueDate: '2026-09-04',
    guestName: 'Michael Chang',
    roomNumber: '201',
    items: [
      { description: 'Standard Double Room (2 Nights)', quantity: 2, unitPrice: 3500, total: 7000 }
    ],
    subtotal: 7000,
    taxAmount: 910,
    serviceCharge: 700,
    discount: 0,
    grandTotal: 8610,
    paidAmount: 0,
    status: 'UNPAID',
  }
];

const initialNotifications: NotificationItem[] = [
  { id: 'NOTIF-01', title: 'New Instant Booking: Booking.com', detail: 'Sarah Connor booked Room 202. Real-time atomic lock propagated to Agoda & Airbnb.', timestamp: '12 mins ago', type: 'Booking', channel: 'WhatsApp', status: 'Delivered' },
  { id: 'NOTIF-02', title: 'Long Stay Lease Warning', detail: 'Room 203 (Carlos Gomez) lease expires in 5 days. Extension invoice draft ready.', timestamp: '1 hour ago', type: 'LongStay', channel: 'WhatsApp', status: 'Action Required' },
  { id: 'NOTIF-03', title: 'Checkout & Balance Settle', detail: 'Elena Rossi (Room 303) departing today. Full settlement verified.', timestamp: '2 hours ago', type: 'Billing', channel: 'In-App', status: 'Resolved' },
  { id: 'NOTIF-04', title: 'Gas Refill Reminder', detail: 'Main LPG cylinder at 70%. Reserve cylinder full on standby.', timestamp: 'Yesterday', type: 'Kitchen', channel: 'SMS', status: 'Delivered' },
];

const PmsContext = createContext<PmsContextType | null>(null);

export const PmsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [rooms, setRooms] = useState<Room[]>(initialRooms);
  const [reservations, setReservations] = useState<Reservation[]>(initialReservations);
  const [contracts, setContracts] = useState<LongStayContract[]>(initialContracts);
  const [kitchenUsers, setKitchenUsers] = useState<KitchenUser[]>(initialKitchenUsers);
  const [kitchenIncidents, setKitchenIncidents] = useState<KitchenIncident[]>(initialIncidents);
  const [gasLevel, setGasLevel] = useState<number>(70);
  const [housekeepingTasks, setHousekeepingTasks] = useState<HousekeepingTask[]>(initialHousekeeping);
  const [maintenanceTickets, setMaintenanceTickets] = useState<MaintenanceTicket[]>(initialMaintenance);
  const [invoices, setInvoices] = useState<Invoice[]>(initialInvoices);
  const [notifications, setNotifications] = useState<NotificationItem[]>(initialNotifications);
  const [stopSellActive, setStopSellActive] = useState<boolean>(false);

  // Load from LocalStorage if available
  useEffect(() => {
    try {
      const saved = localStorage.getItem('hotelsherpasoul_pms_data_v1');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.rooms) setRooms(parsed.rooms);
        if (parsed.reservations) setReservations(parsed.reservations);
        if (parsed.contracts) setContracts(parsed.contracts);
        if (parsed.kitchenUsers) setKitchenUsers(parsed.kitchenUsers);
        if (parsed.kitchenIncidents) setKitchenIncidents(parsed.kitchenIncidents);
        if (parsed.gasLevel) setGasLevel(parsed.gasLevel);
        if (parsed.housekeepingTasks) setHousekeepingTasks(parsed.housekeepingTasks);
        if (parsed.maintenanceTickets) setMaintenanceTickets(parsed.maintenanceTickets);
        if (parsed.invoices) setInvoices(parsed.invoices);
        if (parsed.notifications) setNotifications(parsed.notifications);
        if (parsed.stopSellActive !== undefined) setStopSellActive(parsed.stopSellActive);
      }
    } catch (e) {
      console.warn('LocalStorage not available or parse error', e);
    }
  }, []);

  // Save changes to LocalStorage
  const persist = (dataToSave: any) => {
    try {
      localStorage.setItem('hotelsherpasoul_pms_data_v1', JSON.stringify(dataToSave));
    } catch (e) {
      console.warn('LocalStorage save failed', e);
    }
  };

  const addReservation = (res: Omit<Reservation, 'id' | 'createdAt'>) => {
    const newId = `RES-${Math.floor(1000 + Math.random() * 9000)}`;
    const newReservation: Reservation = {
      ...res,
      id: newId,
      createdAt: new Date().toISOString(),
    };
    const updatedReservations = [newReservation, ...reservations];
    setReservations(updatedReservations);

    // Update Room status to RESERVED or OCCUPIED
    const updatedRooms = rooms.map(r => {
      if (r.number === res.roomNumber) {
        return {
          ...r,
          status: res.status === 'CHECKED_IN' ? ('OCCUPIED' as const) : ('RESERVED' as const),
          currentGuest: res.guestName,
        };
      }
      return r;
    });
    setRooms(updatedRooms);

    // Add Notification
    const newNotif: NotificationItem = {
      id: `NOTIF-${Date.now()}`,
      title: `New Reservation: ${res.guestName}`,
      detail: `Room ${res.roomNumber} (${res.roomType}) reserved from ${res.checkInDate} to ${res.checkOutDate} via ${res.source}.`,
      timestamp: 'Just now',
      type: 'Booking',
      channel: 'WhatsApp',
      status: 'Delivered',
    };
    const updatedNotifs = [newNotif, ...notifications];
    setNotifications(updatedNotifs);

    persist({
      rooms: updatedRooms,
      reservations: updatedReservations,
      contracts,
      kitchenUsers,
      kitchenIncidents,
      gasLevel,
      housekeepingTasks,
      maintenanceTickets,
      invoices,
      notifications: updatedNotifs,
      stopSellActive,
    });
  };

  const checkInGuest = (reservationId: string, passport?: string) => {
    let updatedRoomNumber = '';
    let guestName = '';
    const updatedReservations = reservations.map(r => {
      if (r.id === reservationId) {
        updatedRoomNumber = r.roomNumber;
        guestName = r.guestName;
        return {
          ...r,
          status: 'CHECKED_IN' as const,
          passportNumber: passport || r.passportNumber,
        };
      }
      return r;
    });
    setReservations(updatedReservations);

    const updatedRooms = rooms.map(r => {
      if (r.number === updatedRoomNumber) {
        return { ...r, status: 'OCCUPIED' as const, currentGuest: guestName };
      }
      return r;
    });
    setRooms(updatedRooms);

    const updatedNotifs = [
      {
        id: `NOTIF-${Date.now()}`,
        title: `Guest Checked-In: ${guestName}`,
        detail: `Room ${updatedRoomNumber} marked as OCCUPIED. Passport registered.`,
        timestamp: 'Just now',
        type: 'Booking' as const,
        channel: 'In-App' as const,
        status: 'Resolved' as const,
      },
      ...notifications,
    ];
    setNotifications(updatedNotifs);

    persist({
      rooms: updatedRooms,
      reservations: updatedReservations,
      contracts,
      kitchenUsers,
      kitchenIncidents,
      gasLevel,
      housekeepingTasks,
      maintenanceTickets,
      invoices,
      notifications: updatedNotifs,
      stopSellActive,
    });
  };

  const checkOutGuest = (reservationId: string, paymentDetails?: { method: Invoice['paymentMethod']; amount: number }) => {
    let roomNum = '';
    let guest = '';
    const updatedReservations = reservations.map(r => {
      if (r.id === reservationId) {
        roomNum = r.roomNumber;
        guest = r.guestName;
        return {
          ...r,
          status: 'CHECKED_OUT' as const,
          paidAmount: paymentDetails ? r.paidAmount + paymentDetails.amount : r.paidAmount,
        };
      }
      return r;
    });
    setReservations(updatedReservations);

    // Set room to CLEANING_REQUIRED
    const updatedRooms = rooms.map(r => {
      if (r.number === roomNum) {
        return { ...r, status: 'CLEANING_REQUIRED' as const, currentGuest: undefined };
      }
      return r;
    });
    setRooms(updatedRooms);

    // Add Housekeeping Task
    const newHk: HousekeepingTask = {
      id: `HK-${Date.now()}`,
      roomNumber: roomNum,
      type: 'Turnover Clean',
      status: 'PENDING',
      assignedTo: 'Dawa Sherpa',
      priority: 'HIGH',
      scheduledTime: 'Immediate Turnover',
    };
    const updatedHk = [newHk, ...housekeepingTasks];
    setHousekeepingTasks(updatedHk);

    persist({
      rooms: updatedRooms,
      reservations: updatedReservations,
      contracts,
      kitchenUsers,
      kitchenIncidents,
      gasLevel,
      housekeepingTasks: updatedHk,
      maintenanceTickets,
      invoices,
      notifications,
      stopSellActive,
    });
  };

  const updateRoomStatus = (roomNumber: string, status: Room['status'], note?: string) => {
    const updatedRooms = rooms.map(r => {
      if (r.number === roomNumber) {
        return {
          ...r,
          status,
          maintenanceNote: note || r.maintenanceNote,
          currentGuest: status === 'AVAILABLE' ? undefined : r.currentGuest,
        };
      }
      return r;
    });
    setRooms(updatedRooms);
    persist({
      rooms: updatedRooms,
      reservations,
      contracts,
      kitchenUsers,
      kitchenIncidents,
      gasLevel,
      housekeepingTasks,
      maintenanceTickets,
      invoices,
      notifications,
      stopSellActive,
    });
  };

  const addLongStayContract = (contract: Omit<LongStayContract, 'id'>) => {
    const newId = `LSC-${Math.floor(1000 + Math.random() * 9000)}`;
    const newContract: LongStayContract = { ...contract, id: newId };
    const updated = [newContract, ...contracts];
    setContracts(updated);

    // Mark room as LONG_STAY
    const updatedRooms = rooms.map(r => {
      if (r.number === contract.roomNumber) {
        return { ...r, status: 'LONG_STAY' as const, currentGuest: contract.guestName };
      }
      return r;
    });
    setRooms(updatedRooms);

    // If kitchen access granted, auto-add kitchen user
    if (contract.kitchenAccess) {
      const newKitchenUser: KitchenUser = {
        id: `KU-${Math.floor(100 + Math.random() * 900)}`,
        guestName: contract.guestName,
        roomNumber: contract.roomNumber,
        passType: 'Long Stay',
        validFrom: contract.startDate,
        validTo: contract.endDate,
        depositAmount: 5000,
        depositStatus: 'HELD',
        status: 'ACTIVE',
      };
      setKitchenUsers(prev => [newKitchenUser, ...prev]);
    }

    persist({
      rooms: updatedRooms,
      reservations,
      contracts: updated,
      kitchenUsers,
      kitchenIncidents,
      gasLevel,
      housekeepingTasks,
      maintenanceTickets,
      invoices,
      notifications,
      stopSellActive,
    });
  };

  const addKitchenPass = (pass: Omit<KitchenUser, 'id'>) => {
    const newId = `KU-${Math.floor(100 + Math.random() * 900)}`;
    const newPass: KitchenUser = { ...pass, id: newId };
    const updated = [newPass, ...kitchenUsers];
    setKitchenUsers(updated);
    persist({
      rooms,
      reservations,
      contracts,
      kitchenUsers: updated,
      kitchenIncidents,
      gasLevel,
      housekeepingTasks,
      maintenanceTickets,
      invoices,
      notifications,
      stopSellActive,
    });
  };

  const addKitchenIncident = (inc: Omit<KitchenIncident, 'id' | 'date'>) => {
    const newId = `INC-${Math.floor(10 + Math.random() * 90)}`;
    const newIncident: KitchenIncident = {
      ...inc,
      id: newId,
      date: new Date().toISOString().split('T')[0],
    };
    const updated = [newIncident, ...kitchenIncidents];
    setKitchenIncidents(updated);
    persist({
      rooms,
      reservations,
      contracts,
      kitchenUsers,
      kitchenIncidents: updated,
      gasLevel,
      housekeepingTasks,
      maintenanceTickets,
      invoices,
      notifications,
      stopSellActive,
    });
  };

  const updateGasLevel = (level: number) => {
    setGasLevel(level);
    persist({
      rooms,
      reservations,
      contracts,
      kitchenUsers,
      kitchenIncidents,
      gasLevel: level,
      housekeepingTasks,
      maintenanceTickets,
      invoices,
      notifications,
      stopSellActive,
    });
  };

  const updateHousekeepingStatus = (taskId: string, status: HousekeepingTask['status']) => {
    let roomNum = '';
    const updated = housekeepingTasks.map(t => {
      if (t.id === taskId) {
        roomNum = t.roomNumber;
        return { ...t, status };
      }
      return t;
    });
    setHousekeepingTasks(updated);

    if (status === 'INSPECTED' || status === 'COMPLETED') {
      const updatedRooms = rooms.map(r => {
        if (r.number === roomNum && r.status === 'CLEANING_REQUIRED') {
          return { ...r, status: 'AVAILABLE' as const };
        }
        return r;
      });
      setRooms(updatedRooms);
    }
  };

  const addMaintenanceTicket = (ticket: Omit<MaintenanceTicket, 'id' | 'reportedAt'>) => {
    const newId = `MNT-${Math.floor(100 + Math.random() * 900)}`;
    const newTicket: MaintenanceTicket = {
      ...ticket,
      id: newId,
      reportedAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
    };
    const updated = [newTicket, ...maintenanceTickets];
    setMaintenanceTickets(updated);

    // If room specified, set under maintenance
    if (ticket.location.startsWith('Room')) {
      const roomNum = ticket.location.replace('Room ', '').trim();
      const updatedRooms = rooms.map(r => {
        if (r.number === roomNum) {
          return { ...r, status: 'UNDER_MAINTENANCE' as const, maintenanceNote: ticket.issue };
        }
        return r;
      });
      setRooms(updatedRooms);
    }
  };

  const resolveMaintenanceTicket = (ticketId: string) => {
    let loc = '';
    const updated = maintenanceTickets.map(t => {
      if (t.id === ticketId) {
        loc = t.location;
        return { ...t, status: 'Resolved' as const };
      }
      return t;
    });
    setMaintenanceTickets(updated);

    if (loc.startsWith('Room')) {
      const roomNum = loc.replace('Room ', '').trim();
      const updatedRooms = rooms.map(r => {
        if (r.number === roomNum && r.status === 'UNDER_MAINTENANCE') {
          return { ...r, status: 'CLEANING_REQUIRED' as const, maintenanceNote: undefined };
        }
        return r;
      });
      setRooms(updatedRooms);
    }
  };

  const createInvoice = (inv: Omit<Invoice, 'id'>): Invoice => {
    const newId = `INV-2026-${Math.floor(100 + Math.random() * 900)}`;
    const newInvoice: Invoice = { ...inv, id: newId };
    const updated = [newInvoice, ...invoices];
    setInvoices(updated);
    persist({
      rooms,
      reservations,
      contracts,
      kitchenUsers,
      kitchenIncidents,
      gasLevel,
      housekeepingTasks,
      maintenanceTickets,
      invoices: updated,
      notifications,
      stopSellActive,
    });
    return newInvoice;
  };

  const recordPayment = (invoiceId: string, amount: number, method: Invoice['paymentMethod']) => {
    const updated = invoices.map(inv => {
      if (inv.id === invoiceId) {
        const newPaid = inv.paidAmount + amount;
        return {
          ...inv,
          paidAmount: newPaid,
          paymentMethod: method,
          status: (newPaid >= inv.grandTotal ? 'PAID' : 'PARTIAL') as 'PAID' | 'PARTIAL',
        };
      }
      return inv;
    });
    setInvoices(updated);
  };

  const toggleStopSell = () => {
    const newStatus = !stopSellActive;
    setStopSellActive(newStatus);
    const updatedNotif: NotificationItem = {
      id: `NOTIF-${Date.now()}`,
      title: newStatus ? 'Stop Sell Broadcasted' : 'Stop Sell Deactivated',
      detail: newStatus ? 'All OTA channels locked with 0 inventory.' : 'Normal availability restored on all OTAs.',
      timestamp: 'Just now',
      type: 'Channel',
      channel: 'In-App',
      status: 'Action Required',
    };
    setNotifications(prev => [updatedNotif, ...prev]);
  };

  return (
    <PmsContext.Provider
      value={{
        rooms,
        reservations,
        contracts,
        kitchenUsers,
        kitchenIncidents,
        gasLevel,
        housekeepingTasks,
        maintenanceTickets,
        invoices,
        notifications,
        stopSellActive,
        addReservation,
        checkInGuest,
        checkOutGuest,
        updateRoomStatus,
        addLongStayContract,
        addKitchenPass,
        addKitchenIncident,
        updateGasLevel,
        updateHousekeepingStatus,
        addMaintenanceTicket,
        resolveMaintenanceTicket,
        createInvoice,
        recordPayment,
        toggleStopSell,
      }}
    >
      {children}
    </PmsContext.Provider>
  );
};

export const usePms = () => {
  const context = useContext(PmsContext);
  if (!context) {
    throw new Error('usePms must be used within a PmsProvider');
  }
  return context;
};
