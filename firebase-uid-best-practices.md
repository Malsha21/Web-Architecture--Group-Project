File: firebase-uid-best-practices.md

# EduLanka – Firebase UID & Firestore Best Practices

## 1. Use Firebase Authentication UID as the Firestore Document ID

Recommended structure:

users/{firebaseAuthUID}

Example:

users/
    abc123XYZ/
        userId: "abc123XYZ"
        fullName: "Kamal Perera"
        email: "kamal@gmail.com"
        role: "Student"
        createdDate: Timestamp

The Firebase Authentication UID should be used as the document ID instead of
creating a separate random ID.

## 2. Why use the Firebase UID?

Using the Authentication UID makes it easy to identify the currently logged-in user.

Example:

const uid = auth.currentUser.uid;

const userRef = doc(db, "users", uid);

This directly accesses:

users/{uid}

## 3. Keep Authentication and Firestore responsibilities separate

Firebase Authentication should handle:

- Email
- Password
- Authentication
- User UID
- Login/logout

Firestore should handle application profile information such as:

- Full Name
- Role
- Created Date
- Other EduLanka-specific user information

## 4. Do not create another user ID unnecessarily

Avoid:

users/
    randomDocumentID/
        userId: "Firebase_UID"

Prefer:

users/
    Firebase_UID/
        userId: "Firebase_UID"

This creates a direct relationship between Authentication and Firestore.

## 5. Role management

EduLanka roles:

- Student
- Teacher
- Parent
- Admin

The role can be stored in the Firestore user profile for application display
and normal profile logic.

For sensitive authorization, especially Admin permissions, use Firebase
Authentication custom claims managed by trusted server-side code.

## 6. Profile creation flow

The recommended flow is:

User enters registration information
            ↓
Firebase Authentication creates account
            ↓
Firebase returns Firebase UID
            ↓
Create users/{UID}
            ↓
Save profile information
            ↓
Registration completed

## 7. Important security principle

Never rely only on frontend code to protect Admin functionality.

For example, changing:

role: "Student"

to:

role: "Admin"

in a client request should not be enough to give a user Admin privileges.

Firestore Security Rules and/or Firebase Authentication custom claims should
control sensitive permissions.

## 8. Recommended EduLanka structure

Firebase Authentication
        │
        ├── UID
        │
        ▼
Firestore
        │
        └── users/{UID}
                ├── userId
                ├── fullName
                ├── email
                ├── role
                └── createdDate