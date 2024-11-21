import { Component, OnInit } from '@angular/core';
import { startOfMonth, endOfMonth, eachDayOfInterval, subMonths, addMonths, isSameDay } from 'date-fns';
import { CommonModule } from '@angular/common';
import { FirebaseService } from '../../firebase.service';
import { RouterLink } from '@angular/router';
import { Appointment } from '../../appointment.model';
import { isSupported } from 'firebase/analytics';
import { Timestamp } from 'firebase/firestore';

@Component({
  selector: 'app-agenda',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './agenda.component.html',
  styleUrls: ['./agenda.component.scss']
})
export class AgendaComponent implements OnInit {
  currentMonth: Date = new Date();
  daysInMonth: Date[] = [];
  selectedDay: Date | null = null;
  timeSlots: { label: string, startTime: string, endTime: string }[] = [];
  appointments: Appointment[] = [];
  appointmentsForSelectedDay: Appointment[] = [];
  selectedAppointmentId: string | null = null;
  sharedUsers: any[] = [];

  constructor(private firebaseService: FirebaseService) {}

  async ngOnInit() {
    const analyticsEnabled = await isSupported();
    if (analyticsEnabled) {
      // Initialize analytics if required
    }

    this.generateMonthDays();
    this.loadAppointments();
  }

  generateMonthDays() {
    const start = startOfMonth(this.currentMonth);
    const end = endOfMonth(this.currentMonth);
    this.daysInMonth = eachDayOfInterval({ start, end });
  }

  loadAppointments() {
    // First, load appointments for the current user
    this.firebaseService.getAppointments().subscribe({
      next: (data: Appointment[]) => {
        this.appointments = data;
        console.log('Loaded current user appointments:', JSON.stringify(this.appointments, null, 2));

        // After loading current user appointments, load shared users' appointments
        this.loadSharedUserAppointments();
      },
      error: (error: any) => {
        console.error("Error loading appointments for current user:", error);
      }
    });
  }

  loadSharedUserAppointments() {
    // First, load the shared users
    this.firebaseService.getSharedUsers().then((users) => {
      this.sharedUsers = users;
      // For each shared user, load their appointments
      this.sharedUsers.forEach(user => {
        this.firebaseService.getAppointmentsByEmail(user.email).subscribe({
          next: (data: Appointment[]) => {
            console.log(`Loaded appointments for ${user.email}:`, data);
            // Combine the current user's appointments with shared users' appointments
            this.appointments = [...this.appointments, ...data];
          },
          error: (error: any) => {
            console.error(`Error loading appointments for ${user.email}:`, error);
          }
        });
      });
    }).catch((error) => {
      console.error('Error loading shared users:', error);
    });
  }

  openDay(day: Date) {
    this.selectedDay = day;
    this.generateTimeSlots();
    this.updateAppointmentsForSelectedDay();
  }

  closeDay() {
    this.selectedDay = null;
    this.appointmentsForSelectedDay = [];
  }

  generateTimeSlots() {
    this.timeSlots = Array.from({ length: 15 }, (_, i) => {
      const hour = 7 + i; // Creates time slots from 7:00 to 22:00
      return {
        label: `${hour}:00 - ${hour + 1}:00`,
        startTime: `${hour}:00`,
        endTime: `${hour + 1}:00`,
      };
    });
  }

  isTimeInSlot(appointment: Appointment, time: { startTime: string, endTime: string }): boolean {
    const appointmentStartTime = new Date(`1970-01-01T${appointment.startTime.padStart(5, '0')}:00`);
    const appointmentEndTime = new Date(`1970-01-01T${appointment.endTime.padStart(5, '0')}:00`);

    const slotStartTime = new Date(`1970-01-01T${time.startTime.padStart(5, '0')}:00`);
    const slotEndTime = new Date(`1970-01-01T${time.endTime.padStart(5, '0')}:00`);

    // Check if the appointment overlaps with the time slot (appointment starts before the slot ends, and ends after the slot starts)
    return (
      appointmentStartTime < slotEndTime && appointmentEndTime > slotStartTime
    );
  }

  previousMonth() {
    this.currentMonth = subMonths(this.currentMonth, 1);
    this.generateMonthDays();
  }

  nextMonth() {
    this.currentMonth = addMonths(this.currentMonth, 1);
    this.generateMonthDays();
  }

  updateAppointmentsForSelectedDay() {
    this.appointmentsForSelectedDay = this.getAppointmentsForSelectedDay();
  }

  getAppointmentsForSelectedDay(): Appointment[] {
    if (!this.selectedDay) return [];

    const selectedDayDate = new Date(this.selectedDay).setHours(0, 0, 0, 0);
    console.log('Selected Day:', selectedDayDate);

    return this.appointments.filter(appointment => {
      const appointmentDate = (appointment.date as Timestamp).toDate().setHours(0, 0, 0, 0);
      console.log('Checking appointment date:', appointmentDate);
      return isSameDay(appointmentDate, selectedDayDate);
    });
  }

  areAppointmentsInTimeSlot(time: { startTime: string, endTime: string }): boolean {
    return this.appointmentsForSelectedDay.some(appointment =>
      this.isTimeInSlot(appointment, time) // Pass appointment and time slot to check for match
    );
  }

  // Function to convert time strings to actual Date objects
  convertToDate(day: Date, time: string): Date {
    const [hour, minute] = time.split(':').map(val => parseInt(val, 10));
    const newDate = new Date(day); // Create a new Date from the selected day
    newDate.setHours(hour, minute, 0, 0); // Set the hour and minute from the time string
    return newDate;
  }

  selectAppointment(appointment: Appointment) {
    // Toggle selection (if appointment is already selected, unselect it)
    this.selectedAppointmentId = this.selectedAppointmentId === appointment.id ? null : appointment.id;
  }

  // Method to confirm deletion of appointment
  confirmDelete(appointment: Appointment) {
    const confirmed = confirm(`Are you sure you want to delete the appointment "${appointment.title}"?`);
    if (confirmed && appointment.id) {
      // Call the delete function on Firebase
      this.firebaseService.deleteAppointment(appointment.id).then(() => {
        console.log('Appointment deleted');

        // Manually remove the deleted appointment from the appointments array
        this.appointments = this.appointments.filter(a => a.id !== appointment.id);

        // Update appointments for the selected day
        this.updateAppointmentsForSelectedDay();

      }).catch(error => {
        console.error("Error deleting appointment:", error);
      });
    }
  }

  // Method to check if the appointment is selected
  isSelected(appointment: Appointment): boolean {
    return this.selectedAppointmentId === appointment.id;
  }
}
