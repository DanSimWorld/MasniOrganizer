import { Component, OnInit } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { FirebaseService } from './firebase.service';
import { RouterLink, RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink, CommonModule],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  title = 'MasniOrganizer';
  showHomeButton: boolean = false;
  showLogoutButton: boolean = false;

  constructor(private router: Router, private firebaseService: FirebaseService) {
  }

  ngOnInit() {
    // Explicitly set button visibility on initial load
    this.updateButtonVisibility(this.router.url);

    // Subscribe to NavigationEnd events to update visibility on route changes
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: NavigationEnd) => {
      this.updateButtonVisibility(event.url);
    });
  }

  private updateButtonVisibility(url: string) {
    // Determine if the current route is the login page
    const isLoginPage = url === '/login' || url === '/';
    this.showHomeButton = !isLoginPage;
    this.showLogoutButton = !isLoginPage && this.firebaseService.isLoggedIn();
  }

  navigateToHome() {
    this.router.navigate(['/home']).catch(error => {
      console.error('Navigation to home failed:', error);
    });
  }

  navigateToMyFamily() {
    this.router.navigate(['/my-family']).catch(error => {
      console.error('Navigation to myFamily failed:', error);
    });
  }

  logout() {
    this.firebaseService.logout().then(() => {
      this.router.navigate(['/login'], {replaceUrl: true}).catch(error => {
        console.error('Navigation to login failed:', error);
      });
    });
  }
}
