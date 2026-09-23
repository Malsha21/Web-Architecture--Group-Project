import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "./firebase-config.js";

const loginForm = document.getElementById("loginForm");
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i;
const roleRoutes = {
    student: "../pages/dashboard.html",
    parent: "../pages/parent-dashboard.html",
    teacher: "../pages/teacher-dashboard.html",
    admin: "../pages/admin-dashboard.html"
};

function getRoleRoute(role) {
    return roleRoutes[String(role).toLowerCase()] || roleRoutes.student;
}

if (loginForm) {
    loginForm.addEventListener("submit", async (e) => {
        e.preventDefault();

        const emailInput = document.getElementById("loginEmail");
        const passwordInput = document.getElementById("loginPassword");
        const submitButton = loginForm.querySelector("button[type='submit']");
        const email = emailInput.value.trim();
        const password = passwordInput.value;

        if (!emailPattern.test(email)) {
            alert("Please enter a valid email address.");
            emailInput.focus();
            return;
        }

        if (!password) {
            alert("Please enter your password.");
            passwordInput.focus();
            return;
        }

        if (submitButton) submitButton.disabled = true;

        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            const token = await userCredential.user.getIdTokenResult();
            const role = token.claims.role || "student";

            localStorage.setItem("userRole", String(role).toLowerCase());
            alert("Login Successful!");
            window.location.href = getRoleRoute(role);
        } catch (error) {
            const messages = {
                "auth/invalid-credential": "Invalid email or password.",
                "auth/user-not-found": "Invalid email or password.",
                "auth/wrong-password": "Invalid email or password.",
                "auth/invalid-email": "Please enter a valid email address.",
                "auth/user-disabled": "This account has been disabled."
            };

            alert("Login Failed: " + (messages[error.code] || "Unable to sign in. Please try again."));
            console.error("Firebase login error:", error);
        } finally {
            if (submitButton) submitButton.disabled = false;
        }
    });
}