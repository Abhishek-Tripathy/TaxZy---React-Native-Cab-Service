import { View, Text, FlatList } from 'react-native'
import React, { useState } from 'react'
import RideLayout from '@/components/RideLayout'
import CustomButton from '@/components/CustomButton';
import { router } from 'expo-router';
import { useDriverStore } from '@/store';
import DriverCard from '@/components/DriverCard';

export default function ConfirmRide() {
  const { drivers, selectedDriver, setSelectedDriver } = useDriverStore();

  return (
    <RideLayout title={"Choose a Rider"} snapPoints={["65%", "85%"]}>
      <FlatList
        data={drivers}
        keyExtractor={(item, index) => index.toString()}
        renderItem={({ item, index }) => (
          <DriverCard
            item={item}
            selected={selectedDriver!}
            setSelected={() => {setSelectedDriver(Number(item.id!)); }}
          />
        )}
        ListFooterComponent={() => (
          <View className="mx-5 mt-10">
            <CustomButton
              title="Select Ride"
              onPress={() => router.push("/(root)/book-ride")}
              disabled={!selectedDriver} // Disable if no driver selected
              className={!selectedDriver ? "opacity-50" : ""} // Visual feedback
            />
          </View>
        )}
      />
    </RideLayout>
  )
}