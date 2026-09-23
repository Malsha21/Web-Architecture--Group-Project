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
}