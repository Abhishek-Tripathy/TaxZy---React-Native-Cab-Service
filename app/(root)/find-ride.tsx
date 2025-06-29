import { View, Text } from "react-native";
import React from "react";
import { useLocationStore, useRouteStore } from "@/store";
import RideLayout from "@/components/RideLayout";
import { icons } from "@/constants";
import GoogleTextInput from "@/components/GoogleTextInput";
import CustomButton from "@/components/CustomButton";
import { router } from "expo-router";

export default function findRide() {
  const {
    userAddress,
    destinationAddress,
    setDestinationLocation,
    setUserLocation,
  } = useLocationStore();

  const { distance, duration } = useRouteStore();

  return (
    <RideLayout title="ride">
      <View className="my-3">
        <Text className="text-lg font-JakartaSemiBold mb-3">From</Text>
        <GoogleTextInput
          icon={icons.target}
          initialLocation={userAddress!}
          containerStyle="bg-neutral-100"
          textInputBackgroundColor="#f5f5f5"
          handlePress={(location) => setUserLocation(location)}
        />
      </View>
      <View className="my-3">
        <Text className="text-lg font-JakartaSemiBold mb-3">To</Text>

        <GoogleTextInput
          icon={icons.map}
          initialLocation={destinationAddress!}
          containerStyle="bg-neutral-100"
          textInputBackgroundColor="transparent"
          handlePress={(location) => setDestinationLocation(location)}
        />
      </View>

      {/* Add distance and duration display */}
      {(distance || duration) && (
        <View className="bg-neutral-100 rounded-lg p-4 my-4">
          <View className="flex-row justify-between items-center mb-2">
            <View className="flex-row items-center">
              <Text className="text-base font-JakartaSemiBold text-gray-500">
                Distance
              </Text>
            </View>
            <Text className="text-lg font-JakartaSemiBold text-primary">
              {distance || "--"} km
            </Text>
          </View>

          <View className="h-[1px] bg-neutral-200 my-2" />

          <View className="flex-row justify-between items-center mt-2">
            <View className="flex-row items-center">
              <Text className="text-base font-JakartaSemiBold text-gray-500">
                Duration
              </Text>
            </View>
            <Text className="text-lg font-JakartaSemiBold text-primary">
              {duration || "--"}
            </Text>
          </View>
        </View>
      )}

      <CustomButton
        title="Find Now"
        onPress={() => router.push("/(root)/confirm-ride")}
        className="mt-5"
      />
    </RideLayout>
  );
}
