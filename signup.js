import {
  createUserWithEmailAndPassword,
  updateProfile
} from "firebase/auth";

import {
  doc,
  setDoc,
  serverTimestamp
} from "firebase/firestore";

import { auth, db } from "./firebase";

export async function registerUser(
  fullName,
  email,
  password,
  role
) {
  try {
    // 1. Create Firebase Authentication account
    const userCredential =
      await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );

    const user = userCredential.user;

    // 2. Save display name in Firebase Authentication
    await updateProfile(user, {
      displayName: fullName
    });

    // 3. Create Firestore user profile
    await setDoc(doc(db, "users", user.uid), {
      userId: user.uid,
      fullName: fullName,
      email: user.email,
      role: role,
      createdDate: serverTimestamp()
    });

    console.log("User registered successfully!");

    return user;

  } catch (error) {
    console.error("Registration error:", error);
    throw error;
  }
}