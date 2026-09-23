import { auth, db } from './firebase-config.js';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { doc, serverTimestamp, setDoc } from 'firebase/firestore';

const registerForm = document.getElementById('registerForm');
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i;
const passwordRequirements = [
    { test: (password) => password.length >= 8, message: 'Password must be at least 8 characters long.' },
    { test: (password) => /[A-Za-z]/.test(password), message: 'Password must include at least one letter.' },
    { test: (password) => /\d/.test(password), message: 'Password must include at least one number.' },
    { test: (password) => /[^A-Za-z0-9\s]/.test(password), message: 'Password must include at least one symbol.' }
];

/**
 * Creates a Firebase Authentication user and its matching Firestore profile.
 * The document ID is the Firebase Auth UID, so profile data is easy to secure
 * with Firestore rules such as: request.auth.uid == userId.
 */
export async function registerUser({ email, password, displayName, role = 'student', grade = null }) {
    const normalizedEmail = email.trim().toLowerCase();
    const normalizedName = displayName.trim().replace(/\s+/g, ' ');

    const userCredential = await createUserWithEmailAndPassword(
        auth,
        normalizedEmail,
        password
    );

    const { user } = userCredential;

    // Store the name in Firebase Auth so it is available from auth.currentUser.
    await updateProfile(user, { displayName: normalizedName });

    // Store application-specific data in Firestore under the same UID.
    await setDoc(doc(db, 'users', user.uid), {
        uid: user.uid,
        email: normalizedEmail,
        displayName: normalizedName,
        role,
        ...(grade ? { grade } : {}),
        createdAt: serverTimestamp()
    });

    return user;
}

if (registerForm) {
    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const emailInput = document.getElementById('registerEmail');
        const nameInput = document.getElementById('registerName');
        const passwordInput = document.getElementById('registerPassword');
        const gradeInput = document.getElementById('registerGrade');
        const roleInput = document.getElementById('role');
        const submitButton = registerForm.querySelector("button[type='submit']");
        const email = emailInput.value.trim();
        const name = nameInput.value.trim().replace(/\s+/g, ' ');
        const password = document.getElementById('registerPassword').value;
        const grade = gradeInput?.value;
        const role = (roleInput?.value || registerForm.dataset.role || 'student').toLowerCase();

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
            const user = await registerUser({
                email,
                password,
                displayName: name,
                role,
                grade
            });
            localStorage.setItem('userRole', role);
            alert('Registration successful. You can now log in.');
            console.log('Firebase user created:', user.uid);
        } catch (error) {
            const messages = {
                'auth/email-already-in-use': 'An account with this email already exists.',
                'auth/invalid-email': 'Please enter a valid email address.',
                'auth/weak-password': 'Password is too weak. Use at least 8 characters with letters, numbers, and symbols.'
            };

            console.error('Firebase registration error:', error);
            alert('Registration failed: ' + (messages[error.code] || 'Unable to create the account. Please try again.'));
        } finally {
            if (submitButton) submitButton.disabled = false;
        }
    });
}