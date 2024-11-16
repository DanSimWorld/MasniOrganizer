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
  name: string = '';  // Add a property for the name input
  errorMessage: string = '';
  isLoginMode: boolean = true;  // Flag to toggle between login, signup, and reset password
  isSignUpMode: boolean = false; // Flag to toggle signup mode

  constructor(private router: Router, private firebaseService: FirebaseService) {}

  // Login method
  login() {
    if (this.isLoginMode) {
      // User is logging in
      this.firebaseService.login(this.email, this.password)
        .then(() => {
          this.router.navigate(['/home']).catch(error => {
            console.error('Navigation to home failed:', error);
          });
        })
        .catch((error) => {
          this.errorMessage = error.message;
        });
    } else if (this.isSignUpMode) {
      // User wants to sign up
      this.signUp();
    } else {
      // User wants to reset the password
      this.firebaseService.resetPassword(this.email)
        .then(() => {
          this.errorMessage = '';  // Clear error message
          alert('Password reset email sent.');
        })
        .catch((error) => {
          this.errorMessage = error.message;
        });
    }
  }

  // Sign Up method
  signUp() {
    if (!this.name || !this.email || !this.password) {
      this.errorMessage = "Please fill in all fields!";
      return;
    }

    // Call signup method with name, email, and password
    this.firebaseService.signup(this.email, this.password, this.name)  // Pass the name here
      .then(() => {
        this.router.navigate(['/home']);
      })
      .catch((error: Error) => {  // Type error as Error
        this.errorMessage = error.message;
      });
  }

  // Toggle to reset password mode
  onForgotPassword() {
    this.isLoginMode = false;
    this.isSignUpMode = false;
  }

  // Back to login mode
  onBackToLogin() {
    this.isLoginMode = true;
    this.isSignUpMode = false;
  }

  // Toggle to sign up mode
  onSignUp() {
    this.isLoginMode = false;
    this.isSignUpMode = true;
  }
}
