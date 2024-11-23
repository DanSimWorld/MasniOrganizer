import { Component, OnInit } from '@angular/core';
import { FirebaseService } from '../../firebase.service';
import { FoodItem } from './food-item.model';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { getAuth } from 'firebase/auth';

@Component({
  selector: 'app-foodplanner',
  standalone: true,  // Mark this component as standalone
  imports: [CommonModule, FormsModule],  // Add necessary imports
  templateUrl: './foodplanner.component.html',
  styleUrls: ['./foodplanner.component.scss'],
})
export class FoodPlannerComponent implements OnInit {
  foodItems: FoodItem[] = [];
  newFoodItem: FoodItem = { userEmail: null, name: '', description: '', userId: '', used: false };
  userId: string = '';
  userEmail: string | null = null;
  sharedUsers: any[] = [];

  constructor(private firebaseService: FirebaseService) {}

  ngOnInit(): void {
    const user = getAuth().currentUser;
    if (user) {
      this.userId = user.uid;
      this.userEmail = user.email;

      // Load shared users after getting the current user
      this.loadSharedUsers().then(() => {
        // Load food items after shared users are loaded
        this.loadFoodItems();
      }).catch((error) => {
        console.error('Error loading shared users:', error);
      });
    } else {
      console.log('User is not authenticated');
    }
  }

  loadFoodItems() {
    if (this.userEmail) {
      // Create an array of emails, including the logged-in user's email and shared users' emails
      const emailsToFetch = [this.userEmail, ...this.sharedUsers.map(user => user.email)];

      // Fetch food items for all users (logged-in user + shared users)
      Promise.all(emailsToFetch.map((email) => this.firebaseService.getFoodItems(email)))
        .then((itemsArray) => {
          // Flatten the array of items from different users and set it to foodItems
          this.foodItems = itemsArray.flat();
        })
        .catch((error) => {
          console.error('Error loading food items:', error);
        });
    }
  }

  async loadSharedUsers(): Promise<void> {
    try {
      this.sharedUsers = await this.firebaseService.getSharedUsers();
    } catch (error) {
      console.error('Error loading shared users:', error);
      throw error; // Rethrow the error so it can be caught in ngOnInit
    }
  }


  addFoodItem(): void {
    if (this.newFoodItem.name && this.userId) {
      const user = getAuth().currentUser;  // Get current authenticated user
      if (user) {
        // Ensure userEmail is set
        this.newFoodItem.userEmail = user.email || '';  // Default to empty string if null
        this.newFoodItem.userId = this.userId;

        this.firebaseService.addFoodItem(this.newFoodItem)
          .then(() => {
            this.foodItems.push({...this.newFoodItem});
            // Reset the form, including userEmail
            this.newFoodItem = { name: '', description: '', userId: '', userEmail: '', used: false };  // Reset form
          })
          .catch((error) => {
            console.error('Error adding food item:', error);
          });
      } else {
        console.error('User is not authenticated');
      }
    }
  }

  toggleUsed(foodItem: FoodItem): void {
    foodItem.used = !foodItem.used; // Toggle the used status
    if (foodItem.id) {
      this.firebaseService.updateFoodItem(foodItem.id, foodItem); // Update in Firebase
    }
  }

  deleteFoodItem(foodItemId: string): void {
    this.firebaseService.deleteFoodItem(foodItemId)
      .then(() => {
        this.foodItems = this.foodItems.filter(item => item.id !== foodItemId);
      })
      .catch((error) => {
        console.error('Error deleting food item:', error);
      });
  }

  clearAllItems(): void {
    // Create an array of emails to include the current user and all shared users
    const emailsToFetch = [this.userEmail, ...this.sharedUsers.map(user => user.email)];

    // Fetch all food items for the current user and shared users
    Promise.all(emailsToFetch.map((email) => this.firebaseService.getFoodItems(email)))
      .then((itemsArray) => {
        // Flatten the array of items from different users
        const allItems = itemsArray.flat();

        // Delete each food item by its ID
        Promise.all(allItems.map((item) => this.firebaseService.deleteFoodItem(item.id!)))
          .then(() => {
            this.foodItems = [];  // Clear the local food items array
          })
          .catch((error) => {
            console.error('Error deleting food items:', error);
          });
      })
      .catch((error) => {
        console.error('Error loading food items:', error);
      });
  }

}
