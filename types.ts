
export interface TripPreferences {
  destination: string;
  duration: number;
  nights: number;
  budget: 'Budget' | 'Moderate' | 'Luxury';
  interests: string[];
  travelers: string;
}

export interface AgencyClientProfile {
  clientName: string;
  destination: string;
  duration: number;
  notes: string;
}

export interface GeneratedContent {
  title: string;
  content: string;
  imageUrl?: string;
  groundingSources?: Array<{
    uri: string;
    title: string;
  }>;
}

export enum AppMode {
  INDIVIDUAL = 'individual',
  AGENCY = 'agency',
  CONTENT = 'content',
  CHAT = 'chat'
}

export interface GeoLocation {
  latitude: number;
  longitude: number;
}

export interface User {
  name: string;
  email: string;
  avatar: string;
}

export interface HistoryItem {
  id: string;
  type: 'Itinerary' | 'Content';
  title: string;
  date: string;
  preview: string;
  resultData: any; // Stores the full content/object to restore
}

export interface Message {
  id: string;
  role: 'user' | 'model';
  text: string;
  image?: string; // Base64 string for display
}