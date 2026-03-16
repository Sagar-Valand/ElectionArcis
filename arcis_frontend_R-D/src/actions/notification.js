import { PushNotifications } from '@capacitor/push-notifications';

export const registerPushNotifications = async () => {
  console.log('Initializing push notification registration');

  // Request permission for push notifications
  const permissionStatus = await PushNotifications.requestPermissions();
  console.log('Permission status:', permissionStatus);

  if (permissionStatus.receive === 'granted') {
    await PushNotifications.register();

    // Handle successful registration and get the FCM token
    PushNotifications.addListener('registration',async (token) => {
      console.log('Push registration success, token:', token.value);
      const email = localStorage.getItem('email');
      // Send the token to your backend for sending notifications
      if (email) {
        console.log('Retrieved email from localStorage:', email);

        // Send the token and email to your backend
        try {
          const response = await fetch('https://alert.arcisai.io:5082/save-token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token: token.value, email }),
          });

          if (response.ok) {
            console.log('Token and email saved successfully');
          } else {
            console.error('Failed to save token and email:', response.statusText);
          }
        } catch (err) {
          console.error('Error saving token and email:', err);
        }
      } else {
        console.warn('No email found in localStorage');
      }
    });
  } else {
    console.warn('Push notifications permission not granted');
  }

  // Handle incoming notifications
  PushNotifications.addListener('pushNotificationReceived', (notification) => {
    console.log('Push notification received:', notification);
  });

  // Handle notifications tapped by the user
  PushNotifications.addListener('pushNotificationActionPerformed', (notification) => {
    console.log('Push notification action performed', notification);
  });
};
