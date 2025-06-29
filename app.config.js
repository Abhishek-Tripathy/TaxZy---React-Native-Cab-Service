export default {
  name: "TaxZy",
  slug: "taxzy",
  version: "1.0.0",
  orientation: "portrait",
  icon: "./assets/images/icon.png",
  scheme: "myapp",
  userInterfaceStyle: "automatic",
  newArchEnabled: true,
  splash: {
    image: "./assets/images/splash.png",
    resizeMode: "contain",
    backgroundColor: "#2f80ed",
  },
  ios: {
    supportsTablet: true,
  },
  android: {
    adaptiveIcon: {
      foregroundImage: "./assets/images/adaptive-icon.png",
      backgroundColor: "#ffffff",
    },
    edgeToEdgeEnabled: true,
    package: "com.abhishek_00.taxzy",
  },
  web: {
    bundler: "metro",
    output: "server",
    favicon: "./assets/images/favicon.png",
  },
  plugins: [
    [
      "expo-router",
      {
        origin: "https://uber.com/",
      },
    ],
  ],
  experiments: {
    typedRoutes: true,
  },
  extra: {
    clerkPublishableKey: process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY,
    serverUrl: process.env.EXPO_PUBLIC_SERVER_URL,
    geoapifyApiKey: process.env.EXPO_PUBLIC_GEOAPIFY_API_KEY,
    placesApiKey: process.env.EXPO_PUBLIC_PLACES_API_KEY,
    olaMapsApiKey: process.env.EXPO_PUBLIC_OLA_MAPS_API_KEY,
    stripePublishableKey: process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY,

    databaseUrl: process.env.DATABASE_URL,
    stripeSecretKey: process.env.STRIPE_SECRET_KEY,
    router: {
      origin: "https://uber.com/",
    },
    eas: {
      projectId: "5eee273c-5065-4ef2-a030-9617fb443ef8",
    },
  },
};
