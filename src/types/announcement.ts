export type AnnouncementStatus = 'important' | 'normal' | 'archived';

export interface Announcement {
  id: number;
  title: string;
  class: string;
  date: string;
  status: AnnouncementStatus;
  description?: string;
  createdAt: string;
  updatedAt?: string;
} 