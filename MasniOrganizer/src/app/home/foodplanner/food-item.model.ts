// food-item.model.ts
export class FoodItem {
  id?: string;
  name: string;
  description: string;
  userId: string;
  used: boolean;

  constructor(
    name: string,
    description: string,
    userId: string,
    id?: string,
    used: boolean = false
  ) {
    this.name = name;
    this.description = description;
    this.userId = userId;
    this.used = used;
    if (id) {
      this.id = id;
    }
  }
}
