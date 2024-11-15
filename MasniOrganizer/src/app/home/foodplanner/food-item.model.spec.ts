import { FoodItem } from './food-item.model';

describe('FoodItem', () => {
  it('should create an instance', () => {
    // Provide the required arguments to the constructor
    const foodItem = new FoodItem('Dish Name', 'Description of the dish', 'user123');
    expect(foodItem).toBeTruthy();
  });
});
