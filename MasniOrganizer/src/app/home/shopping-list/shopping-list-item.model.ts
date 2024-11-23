export class ShoppingListItem {
  id?: string;
  name: string;
  userId: string;
  userEmail: string | null;
  used:boolean;

  constructor(
    name: string,
    userId: string,
    userEmail: string | null = null,
    id?: string,
    used: boolean = false
  ) {
    this.name= name;
    this.userId= userId;
    this.userEmail = userEmail;
    this.used= used;
    if (id) {
      this.id = id;
    }
  }
}
