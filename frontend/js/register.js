import { auth, db } from './firebase-config.js';
import { createUserWithEmailAndPassword, updateProfile, deleteUser, signOut } from 'firebase/auth';
import { doc, serverTimestamp, setDoc } from 'firebase/firestore';

const registerForm = document.getElementById('registerForm');
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i;

// Symbol rule removed, so it is easier for children
const passwordRequirements = [
    { test: (password) => password.length >= 8, message: 'Password must be at least 8 characters long.' },
    { test: (password) => /[A-Za-z]/.test(password), message: 'Password must include at least one letter.' },
    { test: (password) => /\d/.test(password), message: 'Password must include at least one number.' }
];

/**
 * Creates a Firebase Authentication user and its matching Firestore profile.
 * The document ID is the Firebase Auth UID.
 * Role is always "student". Teacher/admin roles are set manually in the Firebase console.
 */
export async function registerUser({ email, password, displayName, grade = null }) {
    const normalizedEmail = email.trim().toLowerCase();
    const normalizedName = displayName.trim().replace(/\s+/g, ' ');

    const userCredential = await createUserWithEmailAndPassword(auth, normalizedEmail, password);
    const { user } = userCredential;

    try {
        await updateProfile(user, { displayName: normalizedName });

        await setDoc(doc(db, 'users', user.uid), {
            uid: user.uid,
            email: normalizedEmail,
            displayName: normalizedName,
            role: 'student', // must match firestore.rules
            ...(grade ? { grade } : {}),
            createdAt: serverTimestamp()
        });
    } catch (error) {
        // If saving the profile fails, remove the new Auth account too
        await deleteUser(user).catch(() => {});
        throw error;
    }

    return user;
}

if (registerForm) {
    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const emailInput = document.getElementById('registerEmail');
        const nameInput = document.getElementById('registerName');
        const passwordInput = document.getElementById('registerPassword');
        const gradeInput = document.getElementById('registerGrade');
        const submitButton = registerForm.querySelector("button[type='submit']");

        if (!emailInput || !nameInput || !passwordInput) {
            console.error('Register form is missing #registerEmail, #registerName or #registerPassword.');
            alert('Registration form is not configured correctly.');
            return;
        }

        const email = emailInput.value.trim();
        const name = nameInput.value.trim().replace(/\s+/g, ' ');
        const password = passwordInput.value;
        const grade = gradeInput?.value;

        if (!name) {
            alert('Please enter your full name.');
            nameInput.focus();
            return;
        }

        if (!emailPattern.test(email)) {
            alert('Please enter a valid email address.');
            emailInput.focus();
            return;
        }

        const failedRequirement = passwordRequirements.find((requirement) => !requirement.test(password));
        if (failedRequirement) {
            alert(failedRequirement.message);
            passwordInput.focus();
            return;
        }

        if (!grade) {
            alert('Please select your grade.');
            gradeInput?.focus();
            return;
        }

        if (submitButton) submitButton.disabled = true;

        try {
            const user = await registerUser({ email, password, displayName: name, grade });
            console.log('Firebase user created:', user.uid);
            alert('Registration successful. You can now log in.');

            // Firebase signs the user in after registering; sign out so they log in properly
            await signOut(auth);
            window.location.href = '../pages/login.html';
        } catch (error) {
            const messages = {
                'auth/email-already-in-use': 'An account with this email already exists.',
                'auth/invalid-email': 'Please enter a valid email address.',
                'auth/weak-password': 'Password is too weak. Use at least 8 characters with letters and numbers.',
                'permission-denied': 'Registration was blocked. Please contact your teacher.'
            };

            console.error('Firebase registration error:', error);
            alert('Registration failed: ' + (messages[error.code] || 'Unable to create the account. Please try again.'));
        } finally {
            if (submitButton) submitButton.disabled = false;
        }
    });
}