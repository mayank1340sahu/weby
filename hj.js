// c:\Users\Dell\AndroidStudioProjects\weby\index.js

const functions = require('firebase-functions');
const admin = require('firebase-admin');
const { deleteCollection } = require('./recursive-delete'); // Import the utility

// Initialize Firebase Admin SDK
admin.initializeApp();
const db = admin.firestore();

/**
 * Cloud Function triggered when a Firebase Auth user account is deleted.
 * This function handles the recursive deletion of all associated Firestore data
 * including transactions and budgets subcollections, and the main user document.
 */
exports.cleanupUserDataOnAccountDelete = functions.auth.user().onDelete(async (user) => {
    const userId = user.uid;
    const userRef = db.collection('users').doc(userId);
    const batchSize = 100; // Define batch size for deletion

    functions.logger.info(`Starting data cleanup for user: ${userId}`);

    try {
        // --- 1. Delete Subcollections ---
        
        // Delete Transactions subcollection: /users/{userId}/transactions
        const transactionsRef = userRef.collection('transactions');
        await deleteCollection(db, transactionsRef, batchSize);
        functions.logger.info(`Successfully deleted transactions subcollection for user: ${userId}`);

        // Delete Budgets subcollection: /users/{userId}/budgets
        const budgetsRef = userRef.collection('budgets');
        await deleteCollection(db, budgetsRef, batchSize);
        functions.logger.info(`Successfully deleted budgets subcollection for user: ${userId}`);

        // --- 2. Delete the main User Profile Document ---
        await userRef.delete();
        functions.logger.info(`Successfully deleted main user profile document for user: ${userId}`);

        return null; // Function completed successfully
    } catch (error) {
        functions.logger.error(`Error deleting data for user ${userId}:`, error);
        
        // Throw the error to indicate failure to the Cloud Functions logging system
        // IMPORTANT: The Auth profile is already deleted at this point, but logging 
        // the error is crucial for monitoring incomplete data cleanup.
        throw new Error(`Failed to delete all associated Firestore data for user ${userId}. Error: ${error.message}`);
    }
});