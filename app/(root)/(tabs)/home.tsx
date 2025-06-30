import GoogleTextInput from "@/components/GoogleTextInput";
import * as Location from "expo-location";
import Maps from "@/components/Maps";
import RideCard from "@/components/RideCard";
import { icons, images } from "@/constants";
import { useLocationStore } from "@/store";
import { SignedIn, useAuth, useUser } from "@clerk/clerk-expo";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ride } from "@/types/type";


export default function Page() {
  const { user } = useUser();
  const { signOut } = useAuth();
  const [loading, setLoading] = useState(true);
  const [recentRides, setRecentRides] = useState<Ride[]>([]);
  const [error, setError] = useState<string | null>(null);
  const { setUserLocation, setDestinationLocation } = useLocationStore();
  const [hasPermission, setHasPermission] = useState(false);

  const handleSignOut = () => {
    signOut();
    router.replace("/(auth)/sign-in");
  };

  const fetchRecentRides = async () => {
    if (!user?.id) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/(api)/(ride)/${user.id}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch rides: ${response.status}`);
      }

      const result = await response.json();
      if (result.error) {
        throw new Error(result.error);
      }

      // The response should now include distance and duration
      
      setRecentRides(result.data || []);
    } catch (err) {
      console.error("Error fetching rides at home:", err);
      setError(err.message || "Failed to load recent rides");
    } finally {
      setLoading(false);
    }
  };

  const requestLocation = async () => {
    let { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== "granted") {
      setHasPermission(false);
      return;
    }

    try {
      let location = await Location.getCurrentPositionAsync({});
      const address = await Location.reverseGeocodeAsync({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });

      setUserLocation({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        address: `${address[0]?.name || ""}, ${address[0]?.region || ""}`,
      });
      setHasPermission(true);
    } catch (err) {
      console.error("Location error:", err);
      setHasPermission(false);
    }
  };

  useEffect(() => {
    requestLocation();
    fetchRecentRides();
  }, [user?.id]);

  const handleDestinationPress = (location: {
    latitude: number;
    longitude: number;
    address: string;
  }) => {
    setDestinationLocation(location);
    router.push("/(root)/find-ride");
  };

  const handleRefresh = async () => {
    await fetchRecentRides();
  };

  return (
    <SafeAreaView className="bg-general-500">
      <FlatList
        data={recentRides}
        renderItem={({ item }) => <RideCard ride={item} />}
        keyExtractor={(item) => item.ride_id}
        className="px-5"
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingBottom: 100 }}
        refreshing={loading}
        onRefresh={handleRefresh}
        ListEmptyComponent={() => (
          <View className="flex flex-col items-center justify-center py-10">
            {loading ? (
              <ActivityIndicator size="large" color="#0000ff" />
            ) : error ? (
              <>
                <Image
                  source={images.error}
                  className="w-40 h-40"
                  alt="Error loading rides"
                  resizeMode="contain"
                />
                <Text className="text-sm text-red-500 mt-2">{error}</Text>
              </>
            ) : (
              <>
                <Image
                  source={images.noResult}
                  className="w-40 h-40"
                  alt="No recent rides found"
                  resizeMode="contain"
                />
                <Text className="text-sm text-gray-500 mt-2">
                  No recent rides found
                </Text>
              </>
            )}
          </View>
        )}
        ListHeaderComponent={
          <>
            <View className="flex flex-row items-center justify-between my-5">
              <Text className="text-2xl font-JakartaExtraBold capitalize">
                Welcome,{" "}
                {user?.firstName ||
                  user?.emailAddresses[0]?.emailAddress.split("@")[0]}{" "}
                👋
              </Text>
              <TouchableOpacity
                onPress={handleSignOut}
                className="justify-center items-center"
              >
                <Image source={icons.out} className="w-6 h-6" />
              </TouchableOpacity>
            </View>

            <GoogleTextInput
              icon={icons.search}
              containerStyle="bg-white shadow-md shadow-neutral-300"
              handlePress={handleDestinationPress}
            />

            <Text className="text-xl font-JakartaBold mt-5 mb-3">
              Your current location
            </Text>
            <View className="h-[300px] bg-gray-100 rounded-lg overflow-hidden">
              {hasPermission ? (
                <Maps />
              ) : (
                <View className="flex-1 justify-center items-center">
                  <Text>Location permission required</Text>
                </View>
              )}
            </View>

            <Text className="text-xl font-JakartaBold mt-5 mb-3">
              Recent Rides
            </Text>
          </>
        }
      />
    </SafeAreaView>
  );
}
