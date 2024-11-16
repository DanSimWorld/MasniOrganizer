import { Component, OnInit } from '@angular/core';
import { ShoppingListItem } from './shopping-list-item.model';
import { FirebaseService } from '../../firebase.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { getAuth } from "firebase/auth";


@Component({
  selector: 'app-shopping-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './shopping-list.component.html',
  styleUrls: ['./shopping-list.component.scss'],
})
export class ShoppingListComponent implements OnInit {
  shoppingListItems: ShoppingListItem[] = [];
  newShoppingListItem: ShoppingListItem = { name: '', userId: '', used: false };
  userId: string = '';

  constructor(private firebaseService: FirebaseService) {}

  ngOnInit(): void {
    const user = getAuth().currentUser;
    if (user) {
      this.userId = user.uid; // Get user ID from Firebase Authentication
      this.loadShoppingListItems();
    } else {
      console.log('User is not authenticated');
    }
  }

  loadShoppingListItems() {
    if (this.userId) {
      this.firebaseService.getShoppingListItems(this.userId).then((items) => {
        this.shoppingListItems = items;
      }).catch((error) => {
        console.error('Error loading food items:', error);
      });
    }
  }

  addShoppingListItem(): void {
    if (this.newShoppingListItem.name && this.userId) {
      this.newShoppingListItem.userId = this.userId;
      this.firebaseService.addShoppingListItem(this.newShoppingListItem)
        .then(() => {
          this.shoppingListItems.push({...this.newShoppingListItem});
          this.newShoppingListItem = { name: '', userId: '', used: false };
        })
        .catch((error) => {
          console.error('Error adding shopping list item:', error);
        });
    }
  }

  toggleUsed(shoppingListItem: ShoppingListItem): void {
    shoppingListItem.used = !shoppingListItem.used; // Toggle the used status
    if (shoppingListItem.id) {
      this.firebaseService.updateShoppingListItem(shoppingListItem.id, shoppingListItem); // Update in Firebase
    }
  }

  deleteShoppingListItem(shoppingListItemId: string): void {
    this.firebaseService.deleteShoppingListItem(shoppingListItemId)
      .then(() => {
        this.shoppingListItems = this.shoppingListItems.filter(item => item.id !== shoppingListItemId);
      })
      .catch((error) => {
        console.error('Error deleting shopping list item:', error);
      });
  }

  clearAllItems(): void {
    this.firebaseService.clearShoppingListItems(this.userId)
      .then(() => {
        this.shoppingListItems = [];
      })
      .catch((error) => {
        console.error('Error clearing shopping list items:', error);
      });
  }
}
