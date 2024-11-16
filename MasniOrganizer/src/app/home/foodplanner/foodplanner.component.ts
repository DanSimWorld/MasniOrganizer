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
  newFoodItem: FoodItem = { name: '', description: '', userId: '', used: false };
  userId: string = ''; // Will be set after authentication check

  constructor(private firebaseService: FirebaseService) {}

  ngOnInit(): void {
    const user = getAuth().currentUser;
    if (user) {
      this.userId = user.uid; // Get user ID from Firebase Authentication
      this.loadFoodItems();
    } else {
      console.log('User is not authenticated');
    }
  }

  loadFoodItems() {
    if (this.userId) {
      this.firebaseService.getFoodItems(this.userId).then((items) => {
        this.foodItems = items;
      }).catch((error) => {
        console.error('Error loading food items:', error);
      });
    }
  }

  addFoodItem(): void {
    if (this.newFoodItem.name && this.userId) {
      this.newFoodItem.userId = this.userId;
      this.firebaseService.addFoodItem(this.newFoodItem)
        .then(() => {
          this.foodItems.push({...this.newFoodItem});
          this.newFoodItem = { name: '', description: '', userId: '', used: false };
        })
        .catch((error) => {
          console.error('Error adding food item:', error);
        });
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
    this.firebaseService.clearFoodItems(this.userId)
      .then(() => {
        this.foodItems = [];
      })
      .catch((error) => {
        console.error('Error clearing food items:', error);
      });
  }
}
