import { Component } from '@angular/core';
import { FirebaseService } from "../firebase.service";
import { FormsModule } from "@angular/forms";
import { CommonModule } from "@angular/common";

@Component({
  selector: 'app-my-family',
  standalone: true,
  templateUrl: './my-family.component.html',
  imports: [
    FormsModule,
    CommonModule
  ],
  styleUrls: ['./my-family.component.scss']
})
export class MyFamilyComponent {
  searchTerm: string = '';
  users: any[] = [];
  errorMessage: string = '';
  searchPerformed: boolean = false;  // Flag to track search status

  constructor(private firebaseService: FirebaseService) {}

  searchUsers(): void {
    this.searchPerformed = true;  // Set the flag to true when search is initiated

    if (this.searchTerm.trim() === '') {
      this.errorMessage = 'Please enter a valid email address.';
      this.users = [];  // Clear previous search results
      return;
    }

    this.firebaseService.searchUsers(this.searchTerm).then(
      (users) => {
        this.users = users;
        this.errorMessage = '';  // Clear any previous error messages
        if (users.length === 0) {
          this.errorMessage = 'No results found.';
        }
      },
      (error) => {
        this.errorMessage = 'An error occurred during the search. Please try again.';
        console.error('Search error:', error);
        this.users = [];
      }
    );
  }

  // Email validation (basic check)
  validateEmail(email: string): boolean {
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/;
    return emailRegex.test(email);
  }
}
