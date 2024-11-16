import { Injectable } from '@angular/core';
import { initializeApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, sendPasswordResetEmail } from 'firebase/auth';
import { getFirestore, collection, addDoc, onSnapshot, Timestamp, deleteDoc, doc, getDocs, updateDoc } from 'firebase/firestore';
import { getAnalytics, isSupported } from 'firebase/analytics';
import { Appointment } from './appointment.model';
import { Observable } from 'rxjs';
import { FoodItem } from './home/foodplanner/food-item.model';
import { ShoppingListItem } from './home/shopping-list/shopping-list-item.model';

const firebaseConfig = {
  apiKey: "AIzaSyBJ4VU8NzNDGCSWE0zgPDpzW8jlmLVUwh8",
  authDomain: "masniofficeagenda.firebaseapp.com",
  projectId: "masniofficeagenda",
  storageBucket: "masniofficeagenda.appspot.com",
  messagingSenderId: "176523511925",
  appId: "1:176523511925:web:3c72a67b5fc3d2e679903c",
  measurementId: "G-P3W83HV194"
};

@Injectable({
  providedIn: 'root',
})
export class FirebaseService {
  private app: any;
  private auth: any;
  private db: any;

  constructor() {
    this.app = initializeApp(firebaseConfig);
    isSupported()
      .then((supported) => {
        if (supported) {
          getAnalytics(this.app);
        }
      })
      .catch((error) => {
        console.error("Analytics not supported:", error);
      });

    this.auth = getAuth(this.app);
    this.db = getFirestore(this.app);
  }

  // Signup method with user information saving
  async signup(email: string, password: string, name: string): Promise<void> {
    try {
      const userCredential = await createUserWithEmailAndPassword(this.auth, email, password);
      const user = userCredential.user;

      // Save the user information in Firestore
      await addDoc(collection(this.db, 'users'), {
        uid: user.uid,
        email: user.email,
        name: name,  // Store the name along with the email
      });

      console.log('Signup successful');
    } catch (error: unknown) {
      this.handleError(error);
      throw new Error(error instanceof Error ? error.message : "An unknown error occurred during signup");
    }
  }

  // login method
  async login(email: string, password: string): Promise<void> {
    try {
      await signInWithEmailAndPassword(this.auth, email, password);
      console.log('Login successful');
    } catch (error: unknown) {
      this.handleError(error);
      throw new Error(error instanceof Error ? error.message : "An unknown error occurred during login");
    }
  }

  async logout(): Promise<void> {
    try {
      await signOut(this.auth);
      console.log('Logout successful');
    } catch (error: unknown) {
      this.handleError(error);
      throw new Error(error instanceof Error ? error.message : "An unknown error occurred during logout");
    }
  }

  isLoggedIn(): boolean {
    return this.auth.currentUser !== null;
  }

  // Password reset method
  async resetPassword(email: string): Promise<void> {
    try {
      await sendPasswordResetEmail(this.auth, email);
      console.log('Password reset email sent successfully');
    } catch (error: unknown) {
      this.handleError(error);
      throw new Error(error instanceof Error ? error.message : 'An unknown error occurred during password reset');
    }
  }

  //appointments coding
  async addAppointment(appointment: Appointment): Promise<void> {
    if (!appointment.date) {
      throw new Error("Appointment date is required");
    }
    try {
      const docRef = await addDoc(collection(this.db, 'appointments'), {
        date: appointment.date,
        startTime: appointment.startTime,
        endTime: appointment.endTime,
        title: appointment.title,
        description: appointment.description,
      });
      console.log("Appointment added with ID:", docRef.id);
    } catch (e: unknown) {
      this.handleError(e);
      throw new Error("Error adding appointment: " + (e instanceof Error ? e.message : "Unknown error"));
    }
  }

  getAppointments(): Observable<Appointment[]> {
    const appointmentsCollection = collection(this.db, 'appointments');
    return new Observable<Appointment[]>(observer => {
      const unsubscribe = onSnapshot(appointmentsCollection, querySnapshot => {
        const appointments: Appointment[] = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          date: doc.data()['date'] as Timestamp,
          startTime: doc.data()['startTime'] as string,
          endTime: doc.data()['endTime'] as string,
          title: doc.data()['title'] as string,
          description: doc.data()['description'] as string,
        }) as Appointment);
        observer.next(appointments);
      }, error => {
        observer.error(error);
      });

      return () => unsubscribe();
    });
  }

  private handleError(e: unknown): void {
    if (e instanceof Error) {
      console.error("Error:", e.message);
    } else {
      console.error("Error:", e);
    }
  }

  async deleteAppointment(id: string): Promise<void> {
    const appointmentRef = doc(this.db, 'appointments', id);
    try {
      await deleteDoc(appointmentRef);
      console.log(`Appointment with ID ${id} deleted successfully`);
    } catch (error) {
      console.error("Error deleting appointment:", error);
      throw error;
    }
  }

//food planner coding
  async addFoodItem(foodItem: FoodItem): Promise<void> {
    try {
      const docRef = await addDoc(collection(this.db, 'foodItems'), {
        name: foodItem.name,
        description: foodItem.description,
        userId: foodItem.userId ?? "",  // Ensure userId is never undefined
      });
      console.log("Food item added with ID:", docRef.id);
      foodItem.id = docRef.id; // Set the id of the FoodItem
    } catch (e: unknown) {
      console.error("Error adding food item:", e);
    }
  }

  async getFoodItems(userId: string): Promise<FoodItem[]> {
    const foodItemsCollection = collection(this.db, 'foodItems');
    const querySnapshot = await getDocs(foodItemsCollection);
    const foodItems: FoodItem[] = [];
    querySnapshot.forEach((doc) => {
      if (doc.data()['userId'] === userId) {
        foodItems.push({id: doc.id, ...doc.data() as FoodItem});
      }
    });
    return foodItems;
  }

  async updateFoodItem(id: string, updatedFoodItem: FoodItem): Promise<void> {
    const foodItemRef = doc(this.db, 'foodItems', id);
    await updateDoc(foodItemRef, {
      name: updatedFoodItem.name,
      description: updatedFoodItem.description,
      userId: updatedFoodItem.userId,
      used: updatedFoodItem.used // Include "used" property in the update
    });
    console.log("Food item updated:", id);
  }

  async deleteFoodItem(id: string): Promise<void> {
    const foodItemRef = doc(this.db, 'foodItems', id);
    await deleteDoc(foodItemRef);
    console.log("Food item deleted:", id);
  }

  async clearFoodItems(userId: string): Promise<void> {
    const foodItems = await this.getFoodItems(userId);
    for (const item of foodItems) {
      if (item.id) { // Ensure that item.id is not undefined or null
        await this.deleteFoodItem(item.id);
      } else {
        console.error("Food item does not have a valid ID:", item);
      }
    }
  }

  //Shopping List Coding
  async addShoppingListItem(shoppingListItem: ShoppingListItem): Promise<void> {
    try {
      const docRef = await addDoc(collection(this.db, 'shoppingListItems'), {
        name: shoppingListItem.name,
        userId: shoppingListItem.userId ?? "",  // Ensure userId is never undefined
      });
      console.log("Shopping List Item added with ID:", docRef.id);
      shoppingListItem.id = docRef.id; // Set the id of the FoodItem
    } catch (e: unknown) {
      console.error("Error adding shopping list item:", e);
    }
  }

  async getShoppingListItems(userId: string): Promise<ShoppingListItem[]> {
    const shoppingListCollection = collection(this.db, 'shoppingListItems');
    const querySnapshot = await getDocs(shoppingListCollection);
    const shoppingListItems: ShoppingListItem[] = [];
    querySnapshot.forEach((doc) => {
      if (doc.data()['userId'] === userId) {
        shoppingListItems.push({id: doc.id, ...doc.data() as ShoppingListItem});
      }
    });
    return shoppingListItems;
  }

  async updateShoppingListItem(id: string, updatedShoppingListItem: ShoppingListItem): Promise<void> {
    const shoppingListItemRef = doc(this.db, 'shoppingListItems', id);
    await updateDoc(shoppingListItemRef, {
      name: updatedShoppingListItem.name,
      userId: updatedShoppingListItem.userId,
      used: updatedShoppingListItem.used // Include "used" property in the update
    });
    console.log("Shopping List item updated:", id);
  }

  async deleteShoppingListItem(id: string): Promise<void> {
    const shoppingListItemRef = doc(this.db, 'shoppingListItems', id);
    await deleteDoc(shoppingListItemRef);
    console.log("Shopping List item deleted:", id);
  }

  async clearShoppingListItems(userId: string): Promise<void> {
    const shoppingListItems = await this.getShoppingListItems(userId);
    for (const item of shoppingListItems) {
      if (item.id) { // Ensure that item.id is not undefined or null
        await this.deleteShoppingListItem(item.id);
      } else {
        console.error("Shopping List item does not have a valid ID:", item);
      }
    }
  }
}

