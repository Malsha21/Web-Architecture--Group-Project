import { db } from './firebase-config.js';
import { doc, getDoc } from 'firebase/firestore';

// Read user data - login unu student kenage data database eken genawa
export async function readUserData(userId) {
  try {
    const docRef = doc(db, 'users', userId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      console.log('User data:', docSnap.data());
      return docSnap.data();
    } else {
      console.log('No user found with this ID');
      return null;
    }
  } catch (error) {
    console.error('Error reading user data:', error.message);
    return null;
  }
}import { updateDoc } from 'firebase/firestore';

// Update user data - student ge data wenas karana kotasa
export async function updateUserData(userId, newData) {
  try {
    const docRef = doc(db, 'users', userId);
    await updateDoc(docRef, newData);
    console.log('User data updated successfully');
    return true;
  } catch (error) {
    console.error('Error updating user data:', error.message);
    return false;
  }
}import { doc, deleteDoc } from "firebase/firestore";
import { db } from "./firebase-config.js";

// Delete user data function eka
async function deleteUserData(userId) {
    try {
        const userRef = doc(db, "users", userId);
        await deleteDoc(userRef);
        console.log("User data deleted successfully!");
        alert("User account deleted successfully!");
        return true;
    } catch (error) {
        console.error("Error deleting user data: ", error);
        alert("Failed to delete user account.");
        return false;
    }
}