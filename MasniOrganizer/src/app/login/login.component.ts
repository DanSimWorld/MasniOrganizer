// src/app/login/login.component.ts
import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { FirebaseService } from '../firebase.service';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
  standalone: true,
  imports: [FormsModule, CommonModule] // Include any necessary Angular directives
})
export class LoginComponent {
  email: string = '';
  password: string = '';
  errorMessage: string = '';

  constructor(private router: Router, private firebaseService: FirebaseService) {}

  login() {
    this.firebaseService.login(this.email, this.password)
      .then(() => {
        this.router.navigate(['/home']).catch(error => {
          console.error('Navigation to home failed:', error);
        });
      })
      .catch((error) => {
        this.errorMessage = error.message;
      });
  }
}
