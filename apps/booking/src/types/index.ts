// Types for Booking Portal

export interface Category {
  id: string;
  name: string;
  slug: string;
  icon: string;
  description?: string;
  imageUrl?: string;
}

export interface Establishment {
  id: string;
  name: string;
  slug: string;
  description?: string;
  logo?: string;
  coverImage?: string;
  address: string;
  city: string;
  state: string;
  zipCode?: string;
  phone: string;
  email?: string;
  website?: string;
  rating: number;
  reviewCount: number;
  priceRange: 1 | 2 | 3 | 4;
  categories: string[];
  amenities?: string[];
  workingHours: WorkingHours;
  location?: {
    lat: number;
    lng: number;
  };
  isFeatured?: boolean;
  isOpen?: boolean;
}

export interface WorkingHours {
  [key: string]: {
    isOpen: boolean;
    open?: string;
    close?: string;
    breakStart?: string;
    breakEnd?: string;
  };
}

export interface Service {
  id: string;
  name: string;
  description?: string;
  duration: number;
  price: number;
  promotionalPrice?: number;
  categoryId: string;
  categoryName?: string;
  imageUrl?: string;
  isPopular?: boolean;
}

export interface ServiceCategory {
  id: string;
  name: string;
  description?: string;
  services: Service[];
}

export interface Professional {
  id: string;
  name: string;
  avatar?: string;
  bio?: string;
  rating: number;
  reviewCount: number;
  specialties: string[];
  yearsExperience?: number;
  isAvailable: boolean;
}

export interface Review {
  id: string;
  customerId: string;
  customerName: string;
  customerAvatar?: string;
  rating: number;
  comment: string;
  services: string[];
  professionalName?: string;
  createdAt: string;
  response?: {
    text: string;
    createdAt: string;
  };
}

export interface TimeSlot {
  time: string;
  available: boolean;
}

export interface Appointment {
  id: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled' | 'no_show';
  services: Array<{
    id: string;
    name: string;
    duration: number;
    price: number;
  }>;
  professional: {
    id: string;
    name: string;
    avatar?: string;
  };
  establishment: {
    id: string;
    name: string;
    slug: string;
    address: string;
    phone: string;
  };
  date: string;
  time: string;
  endTime: string;
  totalPrice: number;
  totalDuration: number;
  notes?: string;
  createdAt: string;
  confirmedAt?: string;
  cancelledAt?: string;
  cancellationReason?: string;
}

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  avatar?: string;
  createdAt: string;
  appointmentCount: number;
  lastVisit?: string;
  favoriteEstablishments?: string[];
  notificationPreferences?: {
    email: boolean;
    sms: boolean;
    push: boolean;
    reminders: boolean;
    promotions: boolean;
  };
}

export interface BookingState {
  services: Service[];
  professional?: Professional;
  date?: Date;
  time?: string;
  customer?: {
    name: string;
    email: string;
    phone: string;
  };
  notes?: string;
}

export interface SearchFilters {
  query?: string;
  category?: string;
  location?: string;
  rating?: number;
  priceRange?: number[];
  distance?: number;
  isOpen?: boolean;
  sortBy?: 'rating' | 'distance' | 'price' | 'popularity';
}
