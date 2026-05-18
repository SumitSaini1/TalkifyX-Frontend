importScripts('https://www.gstatic.com/firebasejs/10.7.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyC7wzEitred9snbKPPKpoyTNkY6xNIVgoc",        // your value
  authDomain: "talkifyx-30bb6.firebaseapp.com",
  projectId: "talkifyx-30bb6",
  storageBucket: "talkifyx-30bb6.firebasestorage.app",
  messagingSenderId: "409946370724",
  appId: "1:409946370724:web:99b9d09884b3e8a238ac31"
 
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  self.registration.showNotification(payload.notification.title, {
    body: payload.notification.body,
    icon: '/assets/logo.png'
  });
});