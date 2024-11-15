import { Component, OnInit } from '@angular/core';
import { FirebaseService } from '../../firebase.service';
import { FoodItem } from './food-item.model';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';



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
  userId: string = 'user123';

  constructor(private firebaseService: FirebaseService) {}

  ngOnInit(): void {
    this.firebaseService.getFoodItems(this.userId).then((items) => {
      this.foodItems = items;
    });
  }

  addFoodItem(): void {
    if (this.newFoodItem.name) {
      this.newFoodItem.userId = this.userId;
      this.firebaseService.addFoodItem(this.newFoodItem)
        .then(() => {
          this.foodItems.push({...this.newFoodItem});
          this.newFoodItem = { name: '', description: '', userId: '', used: false };
        });
    }
  }

  toggleUsed(foodItem: FoodItem): void {
    foodItem.used = !foodItem.used; // Toggle the used status
    this.firebaseService.updateFoodItem(foodItem.id!, foodItem); // Update in Firebase
  }

  deleteFoodItem(foodItemId: string): void {
    this.firebaseService.deleteFoodItem(foodItemId)
      .then(() => {
        this.foodItems = this.foodItems.filter(item => item.id !== foodItemId);
      });
  }

  clearAllItems(): void {
    this.firebaseService.clearFoodItems(this.userId)
      .then(() => {
        this.foodItems = [];
      });
  }
}

