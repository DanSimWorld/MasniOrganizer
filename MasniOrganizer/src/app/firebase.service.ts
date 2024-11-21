import { Injectable } from '@angular/core';
import { initializeApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, sendPasswordResetEmail } from 'firebase/auth';
import { getFirestore, collection, addDoc, Timestamp, deleteDoc, doc, getDocs, updateDoc, query, where, writeBatch } from 'firebase/firestore';
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
    const user = getAuth().currentUser;
    if (!user) {
      throw new Error("User not authenticated");
    }

    const userId = user.uid; // Get the current user's UID
    if (!appointment.date) {
      throw new Error("Appointment date is required");
    }

    try {
      const docRef = await addDoc(collection(this.db, `appointments/${userId}/userAppointments`), {
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
    const user = getAuth().currentUser;
    if (!user) {
      throw new Error("User not authenticated");
    }

    const userId = user.uid; // Get the current user's UID
    const appointmentsCollection = collection(this.db, `appointments/${userId}/userAppointments`);

    const appointmentsQuery = query(appointmentsCollection); // You can add more filters here if needed
    return new Observable<Appointment[]>((observer) => {
      getDocs(appointmentsQuery)
        .then(snapshot => {
          const appointments: Appointment[] = snapshot.docs.map(doc => doc.data() as Appointment);
          observer.next(appointments);
          observer.complete();
        })
        .catch(error => {
          observer.error(error);
        });
    });
  }

  private handleError(e: unknown): void {
    if (e instanceof Error) {
      console.error("Error:", e.message);
    } else {
      console.error("Error:", e);
    }
  }

  getAppointmentsByEmail(email: string): Observable<Appointment[]> {
    const usersRef = collection(this.db, 'users');
    collection(this.db, 'appointments');
// Query users to get the UID by email
    const userQuery = query(usersRef, where('email', '==', email));

    return new Observable<Appointment[]>((observer) => {
      getDocs(userQuery)
        .then(userSnapshot => {
          if (userSnapshot.empty) {
            observer.error('User not found');
            return;
          }

          const user = userSnapshot.docs[0].data();
          const userId = user['uid'];  // Assuming 'uid' is stored in the user document

          // Query the appointments collection for that user's appointments
          const appointmentsRef = collection(this.db, `appointments/${userId}/userAppointments`);
          const appointmentsQuery = query(appointmentsRef);

          return getDocs(appointmentsQuery);
        })
        .then(snapshot => {
          if (!snapshot || snapshot.empty) {
            // Handle case where no appointments are found or snapshot is undefined
            observer.next([]);
            observer.complete();
            return;
          }

          const appointments: Appointment[] = snapshot.docs.map(doc => doc.data() as Appointment);
          observer.next(appointments);
          observer.complete();
        })
        .catch(error => {
          observer.error(error);
        });
    });
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

// Add a new food item for the current user
  async addFoodItem(foodItem: FoodItem): Promise<void> {
    try {
      const user = getAuth().currentUser; // Get the current user
      if (!user) throw new Error('User is not authenticated');

      const docRef = await addDoc(collection(this.db, 'foodItems'), {
        name: foodItem.name,
        description: foodItem.description,
        userId: foodItem.userId,  // Ensure userId is set properly
        userEmail: user.email,  // Add email of the user
        used: foodItem.used || false, // Set default for 'used' if not provided
      });
      console.log('Food item added with ID:', docRef.id);
      foodItem.id = docRef.id; // Set the id of the FoodItem
    } catch (e) {
      console.error('Error adding food item:', e);
    }
  }


  // Get food items for a specific user
  async getFoodItems(userEmail: string): Promise<FoodItem[]> {
    const foodItemsCollection = collection(this.db, 'foodItems');
    const q = query(foodItemsCollection, where('userEmail', '==', userEmail)); // Filter by userEmail instead of userId
    const querySnapshot = await getDocs(q);
    const foodItems: FoodItem[] = [];
    querySnapshot.forEach((doc) => {
      foodItems.push({ id: doc.id, ...doc.data() as FoodItem });
    });
    return foodItems;
  }


  // Update a food item
  async updateFoodItem(id: string, updatedFoodItem: FoodItem): Promise<void> {
    const foodItemRef = doc(this.db, 'foodItems', id);
    await updateDoc(foodItemRef, {
      name: updatedFoodItem.name,
      description: updatedFoodItem.description,
      userId: updatedFoodItem.userId,
      used: updatedFoodItem.used, // Include "used" property in the update
    });
    console.log('Food item updated:', id);
  }

  // Delete a food item
  async deleteFoodItem(id: string): Promise<void> {
    const foodItemRef = doc(this.db, 'foodItems', id);
    await deleteDoc(foodItemRef);
    console.log('Food item deleted:', id);
  }

  // Clear all food items for a specific user
  async clearFoodItems(userId: string): Promise<void> {
    const foodItems = await this.getFoodItems(userId);
    for (const item of foodItems) {
      if (item.id) {
        await this.deleteFoodItem(item.id);
      } else {
        console.error('Food item does not have a valid ID:', item);
      }
    }
  }

  // Add a new shopping list item for the current user
  async addShoppingListItem(shoppingListItem: ShoppingListItem): Promise<void> {
    try {
      const user = getAuth().currentUser; // Get the current user
      if (!user) throw new Error('User is not authenticated');

      const docRef = await addDoc(collection(this.db, 'shoppingListItems'), {
        name: shoppingListItem.name,
        userId: shoppingListItem.userId,  // Ensure userId is set properly
        userEmail: user.email,  // Add email of the user
        used: shoppingListItem.used || false, // Set default for 'used' if not provided
      });
      console.log('Shopping List Item added with ID:', docRef.id);
      shoppingListItem.id = docRef.id; // Set the id of the FoodItem
    } catch (e) {
      console.error('Error adding shopping list item:', e);
    }
  }

  // Get shopping list items for a specific user
  async getShoppingListItems(userEmail: string): Promise<ShoppingListItem[]> {
    const shoppingListItemsCollection = collection(this.db, 'shoppingListItems');
    const q = query(shoppingListItemsCollection, where('userEmail', '==', userEmail)); // Filter by userEmail instead of userId
    const querySnapshot = await getDocs(q);
    const shoppingListItems: ShoppingListItem[] = [];
    querySnapshot.forEach((doc) => {
      shoppingListItems.push({ id: doc.id, ...doc.data() as FoodItem });
    });
    return shoppingListItems;
  }

  // Update a shopping list item
  async updateShoppingListItem(id: string, updatedShoppingListItem: ShoppingListItem): Promise<void> {
    const shoppingListItemRef = doc(this.db, 'shoppingListItems', id);
    await updateDoc(shoppingListItemRef, {
      name: updatedShoppingListItem.name,
      userId: updatedShoppingListItem.userId,
      used: updatedShoppingListItem.used, // Include "used" property in the update
    });
    console.log('Shopping list item updated:', id);
  }

  // Delete a shopping list item
  async deleteShoppingListItem(id: string): Promise<void> {
    const shoppingListItemRef = doc(this.db, 'shoppingListItems', id);
    await deleteDoc(shoppingListItemRef);
    console.log('Shopping List item deleted:', id);
  }

  // Clear all shopping items for a specific user
  async clearShoppingListItems(userId: string): Promise<void> {
    const shoppingListItems = await this.getShoppingListItems(userId);
    for (const item of shoppingListItems) {
      if (item.id) {
        await this.deleteShoppingListItem(item.id);
      } else {
        console.error('Shopping List item does not have a valid ID:', item);
      }
    }
  }

  // Search for users by email
  searchUsers(email: string): Promise<any[]> {
    const usersCollection = collection(this.db, 'users');

    return getDocs(query(usersCollection, where('email', '==', email)))
      .then(snapshot => {
        if (snapshot.empty) {
          return [];  // Return an empty array if no users match
        } else {
          // Properly type the snapshot and docs
          return snapshot.docs.map(doc => doc.data());
        }
      })
      .catch(error => {
        console.error('Error getting users:', error);
        throw new Error("Error retrieving users");
      });
  }

  // Send an invitation to another user
  async sendInvitation(email: string): Promise<void> {
    const user = this.auth.currentUser;
    if (!user) throw new Error('User not authenticated');

    try {
      await addDoc(collection(this.db, 'invitations'), {
        senderEmail: user.email,
        recipientEmail: email,
        status: 'pending', // Invitation is pending until accepted or declined
        timestamp: Timestamp.now(),
      });
      console.log(`Invitation sent to ${email}`);
    } catch (error) {
      console.error('Error sending invitation:', error);
      throw new Error('Error sending invitation');
    }
  }

  // Get received invitations for the current user
  async getReceivedInvitations(): Promise<any[]> {
    const user = this.auth.currentUser;
    if (!user) throw new Error('User not authenticated');

    const invitationsRef = collection(this.db, 'invitations');
    const invitationsQuery = query(invitationsRef, where('recipientEmail', '==', user.email), where('status', '==', 'pending'));

    try {
      const snapshot = await getDocs(invitationsQuery);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      console.error('Error fetching received invitations:', error);
      throw new Error('Error fetching invitations');
    }
  }

  // Accept an invitation
  async acceptInvitation(invitationId: string): Promise<void> {
    const invitationRef = doc(this.db, 'invitations', invitationId);
    try {
      await updateDoc(invitationRef, { status: 'accepted' });
      console.log(`Invitation ${invitationId} accepted`);
    } catch (error) {
      console.error('Error accepting invitation:', error);
      throw new Error('Error accepting invitation');
    }
  }

  // Decline an invitation
  async declineInvitation(invitationId: string): Promise<void> {
    const invitationRef = doc(this.db, 'invitations', invitationId);
    try {
      await updateDoc(invitationRef, { status: 'declined' });
      console.log(`Invitation ${invitationId} declined`);
    } catch (error) {
      console.error('Error declining invitation:', error);
      throw new Error('Error declining invitation');
    }
  }

  async getSharedUsers(): Promise<{ email: string; name: string }[]> {
    const user = this.auth.currentUser;
    if (!user) throw new Error('User not authenticated');

    const invitationsRef = collection(this.db, 'invitations');
    const usersRef = collection(this.db, 'users'); // Collection containing user data

    try {
      // Query invitations where the current user is the sender
      const senderQuery = query(
        invitationsRef,
        where('senderEmail', '==', user.email),
        where('status', '==', 'accepted')  // Exclude revoked status
      );
      const senderSnapshot = await getDocs(senderQuery);

      // Query invitations where the current user is the recipient
      const recipientQuery = query(
        invitationsRef,
        where('recipientEmail', '==', user.email),
        where('status', '==', 'accepted')
      );
      const recipientSnapshot = await getDocs(recipientQuery);

      // Extract emails from both queries
      const emails = [
        ...senderSnapshot.docs.map(doc => doc.data()['recipientEmail']),
        ...recipientSnapshot.docs.map(doc => doc.data()['senderEmail']),
      ];

      // Remove duplicate emails
      const uniqueEmails = [...new Set(emails)];

      // Fetch user details for the emails
      const userPromises = uniqueEmails.map(async email => {
        const userQuery = query(usersRef, where('email', '==', email));
        const userSnapshot = await getDocs(userQuery);
        const userDoc = userSnapshot.docs[0]; // Assume emails are unique

        if (userDoc) {
          const userData = userDoc.data();
          return { email, name: userData['name'] || 'Unknown' };
        } else {
          return { email, name: 'Unknown' };
        }
      });

      return await Promise.all(userPromises);
    } catch (error) {
      console.error('Error fetching shared users:', error);
      throw new Error('Error fetching shared users');
    }
  }

  async revokeAccess(email: string): Promise<void> {
    const user = this.auth.currentUser;
    if (!user) {
      console.error('No authenticated user');
      return; // Exit early if no user is authenticated
    }

    const invitationsRef = collection(this.db, 'invitations');

    // Query for accepted invitations where current user is either sender or recipient
    const revokeQuery = query(
      invitationsRef,
      where('status', '==', 'accepted'),
      where('senderEmail', 'in', [user.email, email]), // Either user is the sender
      where('recipientEmail', 'in', [user.email, email]) // Or user is the recipient
    );

    try {
      const snapshot = await getDocs(revokeQuery);
      console.log('Revoke Query Snapshot:', snapshot); // Log the snapshot to inspect the results

      if (!snapshot.empty) {
        const batch = writeBatch(this.db);
        snapshot.docs.forEach(doc => {
          batch.update(doc.ref, { status: 'revoked' }); // Set status to 'revoked' or delete as needed
        });
        await batch.commit();
        console.log(`Access revoked for ${email}`);
      } else {
        console.log('No access found to revoke');
      }
    } catch (error) {
      console.error('Error revoking access:', error);
      throw new Error('Error revoking access');
    }
  }
}

