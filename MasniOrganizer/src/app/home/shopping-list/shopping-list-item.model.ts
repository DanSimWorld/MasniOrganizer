export class ShoppingListItem {
  id?: string;
  name: string;
  userId: string;
  used:boolean;

  constructor(
    name: string,
    userId: string,
    id?: string,
    used: boolean = false
  ) {
    this.name= name;
    this.userId= userId;
    this.used= used;
    if (id) {
      this.id = id;
    }
  }
}
