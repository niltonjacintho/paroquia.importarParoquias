const admin = require('firebase-admin');

const firebaseConfig = {
    apiKey: "AIzaSyDikppRvC3xGB2Jikx_u_STV5kCGUYP51M",
    authDomain: "paroquia.firebaseapp.com",
    databaseURL: "https://paroquia.firebaseio.com",
    projectId: "project-2297216869628270192",
    storageBucket: "project-2297216869628270192.appspot.com",
    messagingSenderId: "999243580674",
    appId: "1:999243580674:web:97bcb06337ef4d04352e1b",
    measurementId: "G-WDRBMW9B0L"
};


admin.initializeApp(firebaseConfig);

const firestore = admin.firestore();

module.exports = { firestore }; // Export only the firestore instance
