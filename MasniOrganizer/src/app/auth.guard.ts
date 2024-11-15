import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { FirebaseService } from './firebase.service'; // Adjust path as necessary

@Injectable({
  providedIn: 'root',
})
export class AuthGuard implements CanActivate {
  constructor(private firebaseService: FirebaseService, private router: Router) {}

  canActivate(): boolean {
    if (this.firebaseService.isLoggedIn()) {
      return true; // User is logged in, allow access
    } else {
      this.router.navigate(['/login']); // Redirect to login if not logged in
      return false; // User is not logged in, deny access
    }
  }
}
