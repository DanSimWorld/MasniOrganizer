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
  searchPerformed: boolean = false;

  receivedInvitations: any[] = []; // Invitations from others
  sharedUsers: any[] = []; // Users you already share data with

  constructor(private firebaseService: FirebaseService) {
    this.loadInvitations();
    this.loadSharedUsers();
  }

  searchUsers(): void {
    this.searchPerformed = true;

    if (this.searchTerm.trim() === '') {
      this.errorMessage = 'Please enter a valid email address.';
      this.users = [];
      return;
    }

    this.firebaseService.searchUsers(this.searchTerm).then(
      (users) => {
        this.users = users;
        this.errorMessage = '';
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

  sendInvitation(email: string): void {
    this.firebaseService.sendInvitation(email).then(() => {
      alert('Invitation sent successfully.');
    }).catch((error) => {
      console.error('Error sending invitation:', error);
      alert('Failed to send invitation.');
    });
  }

  acceptInvitation(invitationId: string): void {
    this.firebaseService.acceptInvitation(invitationId).then(() => {
      alert('Invitation accepted.');
      this.loadInvitations();
      this.loadSharedUsers();
    }).catch((error) => {
      console.error('Error accepting invitation:', error);
      alert('Failed to accept invitation.');
    });
  }

  declineInvitation(invitationId: string): void {
    this.firebaseService.declineInvitation(invitationId).then(() => {
      alert('Invitation declined.');
      this.loadInvitations();
    }).catch((error) => {
      console.error('Error declining invitation:', error);
      alert('Failed to decline invitation.');
    });
  }

  revokeAccess(email: string): void {
    this.firebaseService.revokeAccess(email).then(() => {
      alert('Access revoked.');
      this.loadSharedUsers();
    }).catch((error) => {
      console.error('Error revoking access:', error);
      alert('Failed to revoke access.');
    });
  }

  private loadInvitations(): void {
    this.firebaseService.getReceivedInvitations().then((invitations) => {
      this.receivedInvitations = invitations;
    }).catch((error) => {
      console.error('Error loading invitations:', error);
    });
  }

  private loadSharedUsers(): void {
    this.firebaseService.getSharedUsers().then((users) => {
      this.sharedUsers = users;
    }).catch((error) => {
      console.error('Error loading shared users:', error);
    });
  }
}
