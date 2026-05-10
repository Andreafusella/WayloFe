import 'dotenv/config';

export default {
  expo: {
    name: 'Waylo',
    slug: 'waylo',
    version: '1.0.0',
    jsEngine: 'hermes',
    orientation: 'portrait',
    icon: './assets/images/icon.png',
    scheme: 'waylo',
    userInterfaceStyle: 'automatic',
    newArchEnabled: true,
    ios: {
      buildNumber: '3',
      supportsTablet: false,
      bundleIdentifier: 'com.andrea17473.waylo',
      googleServicesFile: './GoogleService-Info.plist',
      jsEngine: 'hermes',
      infoPlist: {
        ITSAppUsesNonExemptEncryption: false,
        NSLocationWhenInUseUsageDescription: 'Waylo ha bisogno della tua posizione per funzionare.',
      },
    },
    android: {
      versionCode: 3,
      adaptiveIcon: {
        backgroundColor: '#E6F4FE',
        foregroundImage: './assets/images/android-icon-foreground.png',
        backgroundImage: './assets/images/android-icon-background.png',
        monochromeImage: './assets/images/android-icon-monochrome.png',
      },
      edgeToEdgeEnabled: true,
      predictiveBackGestureEnabled: false,
      package: 'com.andrea17473.waylo',
      googleServicesFile: './google-services.json',
      jsEngine: 'hermes',
      permissions: [
        'ACCESS_FINE_LOCATION',
        'ACCESS_COARSE_LOCATION',
      ],
    },
    web: {
      output: 'static',
      favicon: './assets/images/favicon.png',
    },
    plugins: [
      'expo-router',
      "expo-apple-authentication",
      [
        "@react-native-google-signin/google-signin",
        {
          "iosImageUrl": "./assets/images/icon.png",
          "iosUrlScheme": "com.googleusercontent.apps.955699645229-kcckb6c0pgvu5u99gp9rk9vl206koiol"
        }
      ],
      [
        'expo-splash-screen',
        {
          image: './assets/images/splash-icon.png',
          imageWidth: 200,
          resizeMode: 'contain',
          backgroundColor: '#ffffff',
          dark: {
            backgroundColor: '#000000',
          },
        },
      ],
      ['@rnmapbox/maps', { RNMapboxMapsImpl: 'mapbox' }],
      'expo-secure-store',
    ],
    experiments: {
      typedRoutes: true,
      reactCompiler: true,
    },
    extra: {
      router: {},
      eas: {
        projectId: '67fafec1-2194-47fc-80b4-e7888bd245c8',
      },
    },
    owner: 'andrea17473',
  },
};