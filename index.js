// c:\Users\Dell\AndroidStudioProjects\weby\recursive-delete.js

/**
 * Deletes a collection or subcollection in batches recursively.
 * @param {admin.firestore.Firestore} db The Firestore database instance.
 * @param {admin.firestore.CollectionReference} collectionRef The reference to the collection to delete.
 * @param {number} batchSize The maximum number of documents to delete in a single batch.
 * @returns {Promise<void>} A promise that resolves when the deletion is complete.
 */
async function deleteCollection(db, collectionRef, batchSize = 100) {
    const query = collectionRef.limit(batchSize);

    return new Promise((resolve, reject) => {
        deleteQueryBatch(db, query, resolve).catch(reject);
    });
}

/**
 * Handles the actual batch deletion of documents from the query result.
 * @param {admin.firestore.Firestore} db 
 * @param {admin.firestore.Query} query 
 * @param {function(): void} resolve 
 */
async function deleteQueryBatch(db, query, resolve) {
    const snapshot = await query.get();

    // When there are no documents left, we are done
    if (snapshot.size === 0) {
        resolve();
        return;
    }

    // Delete documents in a batch
    const batch = db.batch();
    snapshot.docs.forEach((doc) => {
        batch.delete(doc.ref);
    });

    await batch.commit();

    // Use process.nextTick to avoid exhausting the call stack
    process.nextTick(() => {
        deleteQueryBatch(db, query, resolve);
    });
}

module.exports = {
    deleteCollection
};