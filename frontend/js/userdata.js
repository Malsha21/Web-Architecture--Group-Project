import { db } from "./firebase-config.js";
import { doc, getDoc, updateDoc, deleteDoc } from "firebase/firestore";

// Get the full profile of a user (name, email, role, grade)
export async function getUserProfile(userId) {
    try {
        const userSnap = await getDoc(doc(db, "users", userId));
        return userSnap.exists() ? userSnap.data() : null;
    } catch (error) {
        console.error("Error getting user profile:", error);
        return null;
    }
}

// Get only the role (student / parent / teacher / admin)
export async function getUserRole(userId) {
    const profile = await getUserProfile(userId);
    return profile ? profile.role : null;
}

// Update profile fields. Protected fields are removed so "role" can't be changed.
export async function updateUserData(userId, newData) {
    try {
        const { role, uid, email, createdAt, ...safeData } = newData;
        await updateDoc(doc(db, "users", userId), safeData);
        return true;
    } catch (error) {
        console.error("Error updating user data:", error);
        return false;
    }
}

// Admin only (Firestore rules enforce this).
// NOTE: this deletes only the Firestore profile, not the Firebase Auth account.
export async function deleteUserData(userId) {
    try {
        await deleteDoc(doc(db, "users", userId));
        return true;
    } catch (error) {
        console.error("Error deleting user data:", error);
        return false;
    }
}