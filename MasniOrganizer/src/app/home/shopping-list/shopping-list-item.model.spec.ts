import { ShoppingListItem } from './shopping-list-item.model';

describe('ShoppingListItem', () => {
  it('should create an instance with required properties', () => {
    const item = new ShoppingListItem('Apples', 'user123', 'item1',); // Adjusted order
    expect(item).toBeTruthy();
  });
});
