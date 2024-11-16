import { Component, OnInit } from '@angular/core';
import { ShoppingListItem } from './shopping-list-item.model';
import { FirebaseService } from '../../firebase.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

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
  userId: string = 'user123';  // Dynamically set this based on the authenticated user

  constructor(private firebaseService: FirebaseService) {}

  ngOnInit(): void {
    // Assuming userId is set dynamically (e.g., from a user authentication service)
    this.firebaseService.getShoppingListItems(this.userId).then((items) => {
      this.shoppingListItems = items;
    });
  }

  addShoppingListItem(): void {
    if (this.newShoppingListItem.name) {
      this.newShoppingListItem.userId = this.userId;
      this.firebaseService.addShoppingListItem(this.newShoppingListItem)
        .then(() => {
          this.shoppingListItems.push({ ...this.newShoppingListItem });
          this.newShoppingListItem = { name: '', userId: '', used: false };
        });
    }
  }

  toggleUsed(shoppingListItem: ShoppingListItem): void {
    shoppingListItem.used = !shoppingListItem.used; // Toggle the used status
    this.firebaseService.updateShoppingListItem(shoppingListItem.id!, shoppingListItem); // Update in Firebase
  }

  deleteShoppingListItem(shoppingListItemId: string): void {
    this.firebaseService.deleteShoppingListItem(shoppingListItemId)
      .then(() => {
        this.shoppingListItems = this.shoppingListItems.filter(item => item.id !== shoppingListItemId);
      });
  }

  clearAllItems(): void {
    this.firebaseService.clearShoppingListItems(this.userId)
      .then(() => {
        this.shoppingListItems = [];
      });
  }
}
