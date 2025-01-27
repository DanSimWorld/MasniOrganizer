import { Component } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FirebaseService } from '../../firebase.service';
import { v4 as uuidv4 } from 'uuid';
import { Timestamp } from 'firebase/firestore';
import { Router } from '@angular/router';

@Component({
  selector: 'app-add',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './add.component.html',
  styleUrls: ['./add.component.scss'],
})
export class AddComponent {
  date: string = '';
  startTime: string = '';
  endTime: string = '';
  title: string = '';
  description: string = '';

  constructor(
    private firebaseService: FirebaseService,
    private route: ActivatedRoute,
    private router: Router) {
    this.route.queryParams.subscribe(params => {
      this.date = params['date'] || '';
      this.startTime = params['startTime'] || '';
      this.endTime = params['endTime'] || '';
      console.log('Received params:', params);
    });
  }

  addAppointment() {
    if (this.date && this.startTime && this.endTime && this.title && this.description) {
      const appointmentDate = new Date(this.date);
      const newAppointment = {
        id: uuidv4(),
        date: Timestamp.fromDate(appointmentDate),
        startTime: this.startTime,
        endTime: this.endTime,
        title: this.title,
        description: this.description,
      };

      this.firebaseService.addAppointment(newAppointment).then(() => {
        console.log('Appointment added successfully');

        this.router.navigate(['/agenda'], {
          queryParams: { date: this.date } // Pass the date as query parameter
        });
        this.resetForm();
      }).catch(error => {
        console.error('Error adding appointment: ', error);
      });
    } else {
      console.error('All fields are required');
    }
  }

  resetForm() {
    this.date = '';
    this.startTime = '';
    this.endTime = '';
    this.title = '';
    this.description = '';
  }
}
