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
  newShoppingListItem: ShoppingListItem = { userEmail: null, name: '', userId: '', used: false };
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
        this.loadShoppingListItems();
      }).catch((error) => {
        console.error('Error loading shared users:', error);
      });
    } else {
      console.log('User is not authenticated');
    }
  }

  loadShoppingListItems() {
    if (this.userEmail) {
      // Create an array of emails, including the logged-in user's email and shared users' emails
      const emailsToFetch = [this.userEmail, ...this.sharedUsers.map(user => user.email)];

      // Fetch food items for all users (logged-in user + shared users)
      Promise.all(emailsToFetch.map((email) => this.firebaseService.getShoppingListItems(email)))
        .then((itemsArray) => {
          // Flatten the array of items from different users and set it to foodItems
          this.shoppingListItems = itemsArray.flat();
        })
        .catch((error) => {
          console.error('Error loading shopping list items:', error);
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

  addShoppingListItem(): void {
    if (this.newShoppingListItem.name && this.userId) {
      const user = getAuth().currentUser;  // Get current authenticated user
      if (user) {
        // Ensure userEmail is set
        this.newShoppingListItem.userEmail = user.email || '';  // Default to empty string if null
        this.newShoppingListItem.userId = this.userId;

        this.firebaseService.addShoppingListItem(this.newShoppingListItem)
          .then(() => {
            this.shoppingListItems.push({...this.newShoppingListItem});
            // Reset the form, including userEmail
            this.newShoppingListItem = { name: '', userId: '', userEmail: '', used: false };  // Reset form
          })
          .catch((error) => {
            console.error('Error adding shopping list item:', error);
          });
      } else {
        console.error('User is not authenticated');
      }
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
    // Create an array of emails to include the current user and all shared users
    const emailsToFetch = [this.userEmail, ...this.sharedUsers.map(user => user.email)];

    // Fetch all food items for the current user and shared users
    Promise.all(emailsToFetch.map((email) => this.firebaseService.getShoppingListItems(email)))
      .then((itemsArray) => {
        // Flatten the array of items from different users
        const allItems = itemsArray.flat();

        // Delete each food item by its ID
        Promise.all(allItems.map((item) => this.firebaseService.deleteShoppingListItem(item.id!)))
          .then(() => {
            this.shoppingListItems = [];  // Clear the local food items array
          })
          .catch((error) => {
            console.error('Error deleting shopping list items:', error);
          });
      })
      .catch((error) => {
        console.error('Error loading shopping list items:', error);
      });
  }
}
