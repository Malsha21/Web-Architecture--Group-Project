// Turns Firestore error codes into friendly messages.
export function getFirestoreErrorMessage(error, fallback = "Something went wrong. Please try again.") {
    console.error("Firestore error:", error);

    switch (error?.code) {
        case "permission-denied":
            return "You do not have permission to do this.";
        case "not-found":
            return "The requested data was not found.";
        case "unavailable":
            return "Network error. Please check your internet connection.";
        default:
            return fallback;
    }
}

// Same as above but also shows an alert.
export function handleFirestoreError(error, fallback) {
    const message = getFirestoreErrorMessage(error, fallback);
    alert(message);
    return message;
}