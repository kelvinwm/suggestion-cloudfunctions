const functions = require("firebase-functions");
const admin = require('firebase-admin');
const { customAlphabet } = require("nanoid");
admin.initializeApp();

const FieldValue = admin.firestore.FieldValue;
const db = admin.firestore();

exports.makeVote = functions.firestore.document('/votes/{documentId}')
    .onCreate((snap, context) => {
        // Grab the current value of what was written to Firestore.
        const complainID = snap.data().complainId;
        const voteType = snap.data().status;

        // Initialize document
        const votesRef = db.collection('complains').doc(complainID);
        try {
            if (voteType == 1) {
                votesRef.update({
                    "vote": FieldValue.increment(1)
                })
            } else if (voteType == -1) {
                votesRef.update({
                    "dislike": FieldValue.increment(1)
                })
            } else if (voteType == 3) {
                votesRef.update({
                    "report": FieldValue.increment(1)
                })
            }
            console.log('Transaction success!');
        } catch (e) {
            console.log('Transaction failure:', e);
        }

        // You must return a Promise when performing asynchronous tasks inside a Functions such as
        // writing to Firestore.
        // Setting an 'uppercase' field in Firestore document returns a Promise.
        return null;
    });

exports.updateVote = functions.firestore.document('/votes/{documentId}')
    .onUpdate((change, context) => {
        // Grab the current value of what was written to Firestore.
        const after = change.after.data();
        const beforedata = change.before.data()
        const complainID = after.complainId;
        const BvoteType = beforedata.status;
        const AvoteType = after.status;
        const votesRef = db.collection('complains').doc(complainID);
        // Access the parameter `{documentId}` with `context.params`
        functions.logger.log('Uppercasing beforedata', beforedata, BvoteType);
        functions.logger.log('Uppercasing after', after, AvoteType);
        try {
            if (BvoteType == -1 && AvoteType == 1) {
                votesRef.update({
                    "vote": FieldValue.increment(1),
                    "dislike": FieldValue.increment(-1)
                })
            } else if (BvoteType == 1 && AvoteType == -1) {
                votesRef.update({
                    "dislike": FieldValue.increment(1),
                    "vote": FieldValue.increment(-1)
                })
            } else if (AvoteType == 3) {
                votesRef.update({
                    "report": FieldValue.increment(1)
                })
            }

            console.log('Transaction success!');
        } catch (e) {
            console.log('Transaction failure:', e);
        }

        return null;
    });

exports.deleteVote = functions.firestore.document('/votes/{documentId}')
    .onDelete((snap, context) => {
        // Get an object representing the document prior to deletion
        const deletedValue = snap.data();
        const voteType = deletedValue.status;
        const complainID = snap.data().complainId;
        functions.logger.log('deleted data', voteType, voteType);
        const votesRef = db.collection('complains').doc(complainID);
        try {
            if (voteType == 1) {
                votesRef.update({
                    "vote": FieldValue.increment(-1)
                })
            } else if (voteType == -1) {
                votesRef.update({
                    "dislike": FieldValue.increment(-1)
                })
            }
            else if (voteType == 3) {
                votesRef.update({
                    "report": FieldValue.increment(-1)
                })
            }
            console.log('Transaction success!');
        } catch (e) {
            console.log('Transaction failure:', e);
        }
        return null;
    });


exports.createAccountNumber = functions.firestore.document('/complains/{documentId}')
    .onCreate((snap, context) => {
        // Grab the current value of what was written to Firestore.
        const complainID = context.params.documentId;

        let nanoid = customAlphabet('ABCDEFGHJKLMNPQRSTUVWXYZ123456789', 10);
        let accountNumber = `SH${nanoid()}`;
        // Initialize document
        const votesRef = db.collection('complains').doc(complainID);
        try {
            votesRef.update({
                "accountNumber": accountNumber,
                "amount": 0
            })
            console.log('Transaction success!');
        } catch (e) {
            console.log('Transaction failure:', e);
        }
        return null;
    });

exports.makePayment = functions.https.onRequest(async (req, res) => {
    // Grab the text parameter.
    const accountNumber = req.body['accountNumber'];
    console.log('Transaction accountNumber:', accountNumber);
    const votesRef = db.collection('complains').where('accountNumber', '==', accountNumber).get();
    try {
        votesRef.then(response => {
            response.docs.forEach(async (doc) => {
                await db.collection('complains').doc(doc.id).update({ "comment_status": 1 })
                // Send back a message that we've successfully written the message
                console.log(`Doc with ID: ${doc.id} added.`);
                res.json({ result: true });
            })
        })
    } catch (e) {
        console.log('Transaction failure:', e);
        res.json({ result: false });
    }

});