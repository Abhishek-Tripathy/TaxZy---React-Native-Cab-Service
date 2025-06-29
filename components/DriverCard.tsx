import React, { useEffect, useState } from "react";
import { Image, Text, TouchableOpacity, View } from "react-native";
import { icons } from "@/constants";
import { formatTime } from "@/lib/utils";
import { DriverCardProps } from "@/types/type";

const DriverCard = ({ item, selected, setSelected }: DriverCardProps) => {
  const [formattedPrice, setFormattedPrice] = useState<string>("");

  useEffect(()=>{
    const formatPrice = () => {
      if (item?.price) {
        // Convert string price to number, multiply by 100, and add ₹ symbol
        const priceInPaise = Math.round(parseFloat(item.price) * 100)
        setFormattedPrice(`₹${priceInPaise}`);
      }
    };
    formatPrice()
  }, [item?.price])

  return (
    <TouchableOpacity
      onPress={setSelected}
      className={`${
        selected === item.id ? "bg-general-600" : "bg-white"
      } flex flex-row items-center justify-between py-5 px-3 rounded-xl mb-2`} // Added mb-2 for spacing
    >
      <Image
        source={{ uri: item.profile_image_url }}
        className="w-14 h-14 rounded-full"
      />

      <View className="flex-1 flex flex-col items-start justify-center mx-3">
        <View className="flex flex-row items-center justify-start mb-1">
          <Text className="text-lg font-JakartaRegular">
            {item.first_name} {item.last_name}
          </Text>
          <View className="flex flex-row items-center space-x-1 ml-2">
            <Image source={icons.star} className="w-3.5 h-3.5" />
            <Text className="text-sm font-JakartaRegular">{item.rating || 4}</Text>
          </View>
        </View>

        <View className="flex flex-row items-center justify-start">
          <View className="flex flex-row items-center">
            <Image source={icons.dollar} className="w-4 h-4" />
            <Text className="text-sm font-JakartaRegular ml-1">
              {formattedPrice || "₹0"}
            </Text>
          </View>
          <Text className="text-sm font-JakartaRegular text-general-800 mx-1">|</Text>
          <Text className="text-sm font-JakartaRegular text-general-800">
            {formatTime(parseInt(`${item?.time!}`) || 5)}
          </Text>
          <Text className="text-sm font-JakartaRegular text-general-800 mx-1">|</Text>
          <Text className="text-sm font-JakartaRegular text-general-800">
            {item.car_seats} seats
          </Text>
        </View>
      </View>

      <Image
        source={{ uri: item.car_image_url }}
        className="h-14 w-14"
        resizeMode="contain"
      />
    </TouchableOpacity>
  );
};

export default DriverCard;