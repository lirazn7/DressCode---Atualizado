require('dotenv').config();

module.exports = {
  expo: {
    name: 'dresscode',
    slug: 'snack-6bb6208d-7b54-4ccc-924b-ce3e55cf5ef7',
    owner: 'igorzn7', // <--- ADICIONE ESTA LINHA AQUI
    version: '1.0.0',
    extra: {
      firebaseApiKey: process.env.FIREBASE_API_KEY,
      firebaseAuthDomain: process.env.FIREBASE_AUTH_DOMAIN,
      firebaseProjectId: process.env.FIREBASE_PROJECT_ID,
      firebaseStorageBucket: process.env.FIREBASE_STORAGE_BUCKET,
      firebaseMessagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
      firebaseAppId: process.env.FIREBASE_APP_ID,
      firebaseMeasurementId: process.env.FIREBASE_MEASUREMENT_ID,
      googleWebClientId: process.env.GOOGLE_WEB_CLIENT_ID,
      googleAndroidClientId: process.env.GOOGLE_ANDROID_CLIENT_ID,
      openRouterApiKey: process.env.OPENROUTER_API_KEY,
      eas: {
        projectId: "93a997f2-f3eb-4576-bff6-692d41d21bf2"
      }
    },
    orientation: 'portrait',
    icon: './assets/icon.png',
    userInterfaceStyle: 'light',
    newArchEnabled: false,
    splash: {
      image: './assets/splash-icon.png',
      resizeMode: 'contain',
      backgroundColor: '#ffffff',
    },
    ios: {
      supportsTablet: true,
      bundleIdentifier: 'com.dresscode.app',
    },
    android: {
      adaptiveIcon: {
        foregroundImage: './assets/adaptive-icon.png',
        backgroundColor: '#ffffff',
      },
      edgeToEdgeEnabled: true,
      package: 'com.dresscode.app',
    },
    web: {
      favicon: './assets/favicon.png',
      bundler: 'metro',
      output: 'single',
    },
    scheme: 'dresscode',
    plugins: [
      'expo-web-browser'
    ],
  },
};