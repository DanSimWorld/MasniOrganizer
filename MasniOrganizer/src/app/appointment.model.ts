import { Timestamp } from 'firebase/firestore';

export interface Appointment {
  id: string;
  date: Timestamp; // Change from Date to Timestamp
  startTime: string;
  endTime: string;
  title: string;
  description: string;
}
