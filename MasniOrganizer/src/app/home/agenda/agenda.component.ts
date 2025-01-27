import { Component, OnInit } from '@angular/core';
import { startOfMonth, endOfMonth, eachDayOfInterval, subMonths, addMonths, isSameDay } from 'date-fns';
import { CommonModule } from '@angular/common';
import { FirebaseService } from '../../firebase.service';
import { RouterLink } from '@angular/router';
import { Appointment } from '../../appointment.model';
import { isSupported } from 'firebase/analytics';
import { Timestamp } from 'firebase/firestore';
import { ActivatedRoute } from '@angular/router';

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

  constructor(
    private firebaseService: FirebaseService,
    private route: ActivatedRoute
  ) {}

  async ngOnInit() {
    const analyticsEnabled = await isSupported();
    if (analyticsEnabled) {
      // Initialize analytics if required
    }

    this.generateMonthDays();
    this.loadAppointments();

    // Check for date query parameter in URL
    this.route.queryParams.subscribe(params => {
      const selectedDate = params['date'];
      if (selectedDate) {
        this.selectedDay = new Date(selectedDate);
        this.openDay(this.selectedDay); // Open the selected day
      }
    });
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

  isToday(day: Date): boolean {
    const today = new Date();
    return day.toDateString() === today.toDateString();
  }

  hasAppointments(day: Date): boolean {
    return this.appointments.some(appointment => {
      const appointmentDate = (appointment.date as Timestamp).toDate();
      return isSameDay(appointmentDate, day);
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
      const hour = (7 + i).toString().padStart(2, '0'); // Ensures two digits for hour
      return {
        label: `${hour}:00 - ${parseInt(hour) + 1}:00`,
        startTime: `${hour}:00`,
        endTime: `${(parseInt(hour) + 1).toString().padStart(2, '0')}:00`, // Ensures two digits for the end time
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
    console.log("Selected appointment ID:", appointment.id); // Debugging line
    this.selectedAppointmentId = this.selectedAppointmentId === appointment.id ? null : appointment.id;
  }

  // Method to confirm deletion of appointment
  confirmDelete(appointment: Appointment) {
    // Check if the appointment has an ID
    if (!appointment.id) {
      // If there's no ID, display the message about deleting only own appointments
      alert("You can only delete your own appointments.");
      return; // Exit the function to prevent further actions
    }

    // If there's an ID, proceed with the regular confirmation
    const confirmed = confirm(`Are you sure you want to delete the appointment "${appointment.title}"?`);
    if (confirmed) {
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
