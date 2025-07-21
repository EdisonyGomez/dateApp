export interface User {
  id: string;
  email: string;
  name: string;
  partnerId?: string;
  createdAt: Date;
}

export interface DiaryEntry {
  id: string;
  userId: string;
  date: string;
  title: string;
  content: string;
  mood: 'happy' | 'sad' | 'excited' | 'calm' | 'stressed' | 'grateful' | 'neutral';
  isPrivate: boolean;
  photos: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface AuthContextType {
  user: User | null;
  partner: User | null;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  logout: () => void;
  linkPartner: (partnerEmail: string) => Promise<void>;
}