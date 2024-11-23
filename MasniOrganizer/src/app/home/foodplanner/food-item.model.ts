export class FoodItem {
  id?: string;
  name: string;
  description: string;
  userId: string;
  userEmail: string | null;  // Allow null as a valid value
  used: boolean;

  constructor(
    name: string,
    description: string,
    userId: string,
    userEmail: string | null = null,  // Default to null if not provided
    id?: string,
    used: boolean = false
  ) {
    this.name = name;
    this.description = description;
    this.userId = userId;
    this.userEmail = userEmail;  // Set email (can be null)
    this.used = used;
    if (id) {
      this.id = id;
    }
  }
}
