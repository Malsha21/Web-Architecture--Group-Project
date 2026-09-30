import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth } from "./firebase-config.js";
import { getUserProfile } from "./userdata.js";

// Use on protected pages. Optionally pass allowed roles, e.g. ["student"].
export function requireAuth(callback, allowedRoles = null) {
    onAuthStateChanged(auth, async (user) => {
        if (!user) {
            window.location.href = "../pages/login.html";
            return;
        }

        const profile = await getUserProfile(user.uid);
        const role = profile?.role || "student";

        if (allowedRoles && !allowedRoles.includes(role)) {
            window.location.href = "../pages/login.html";
            return;
        }

        callback(user, profile);
    });
}

export async function logout() {
    await signOut(auth);
    localStorage.removeItem("userRole");
    window.location.href = "../pages/login.html";
}