import { View, Image, TextInput, TouchableOpacity, Text, ScrollView } from "react-native";
import { useState, useRef } from "react";
import { icons } from "@/constants";
import { GoogleInputProps } from "@/types/type";
import axios from "axios";
import Constants from "expo-constants";

const GoogleTextInput = ({
  icon,
  initialLocation,
  containerStyle,
  textInputBackgroundColor,
  handlePress,
}: GoogleInputProps) => {
  const [query, setQuery] = useState(initialLocation || "");
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [isFocused, setIsFocused] = useState(false);
  const debounceTimeout = useRef<NodeJS.Timeout>();

  const searchLocations = async (text: string) => {
    setQuery(text);
    
    if (text.length < 3) {
      setSuggestions([]);
      return;
    }

    if (debounceTimeout.current) {
      clearTimeout(debounceTimeout.current);
    }

    debounceTimeout.current = setTimeout(async () => {
      try {
        const response = await axios.get(
          'https://api.olamaps.io/places/v1/autocomplete',
          {
            params: {
              input: text,
              api_key: Constants?.expoConfig?.extra?.olaMapsApiKey,
            },
            headers: {
              'X-Request-Id': generateUUID(),
            }
          }
        );

        if (response.data.status === "ok") {
          setSuggestions(response.data.predictions || []);
        } else {
          console.error("Ola Maps API error:", response.data.error_message);
          setSuggestions([]);
        }
      } catch (error) {
        console.error("API request failed:", error);
        setSuggestions([]);
      }
    }, 300);
  };

  const handleItemPress = async (item: any) => {
    try {
      const detailsResponse = await axios.get(
        'https://api.olamaps.io/places/v1/details',
        {
          params: {
            place_id: item.place_id,
            api_key: Constants?.expoConfig?.extra?.olaMapsApiKey,
          },
          headers: {
            'X-Request-Id': generateUUID(),
          }
        }
      );

      if (detailsResponse.data.status === "ok" && detailsResponse.data.result) {
        const location = detailsResponse.data.result.geometry.location;
        handlePress({
          latitude: location.lat,
          longitude: location.lng,
          address: item.description,
        });
      }
      
      setQuery(item.structured_formatting?.main_text || item.description);
      setSuggestions([]);
      setIsFocused(false);
    } catch (error) {
      console.error("Error fetching place details:", error);
    }
  };

  const generateUUID = () => {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  };

  return (
    <View
      className={`flex flex-row items-center justify-center relative z-50 rounded-xl ${containerStyle}`}
    >
      <View className="flex-row items-center w-full">
        {icon && (
          <View className="justify-center items-center w-6 h-6 ml-3">
            <Image
              source={icon}
              className="w-6 h-6"
              resizeMode="contain"
            />
          </View>
        )}
        
        <TextInput
          value={query}
          onChangeText={searchLocations}
          placeholder={initialLocation ?? "Where do you want to go?"}
          placeholderTextColor="gray"
          className={`flex-1 ml-2 p-3 ${textInputBackgroundColor ? textInputBackgroundColor : "bg-white"}`}
          style={{
            borderRadius: 20,
            fontSize: 16,
            fontWeight: "400",
          }}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setTimeout(() => setIsFocused(false), 200)}
        />
      </View>

      {isFocused && suggestions.length > 0 && (
        <View className="absolute top-full left-0 right-0 mt-1 bg-white rounded-lg shadow-lg z-50">
          <ScrollView 
            nestedScrollEnabled
            keyboardShouldPersistTaps="always"
            style={{ maxHeight: 200 }}
            contentContainerStyle={{ paddingBottom: 8 }}
          >
            {suggestions.map((item) => (
              <TouchableOpacity
                key={item.place_id}
                className="px-4 py-3 border-b border-gray-100"
                onPress={() => handleItemPress(item)}
              >
                <Text 
                  className="text-base font-medium" 
                  numberOfLines={1} 
                  ellipsizeMode="tail"
                >
                  {item.structured_formatting?.main_text || item.description}
                </Text>
                {item.structured_formatting?.secondary_text && (
                  <Text 
                    className="text-sm text-gray-500 mt-1" 
                    numberOfLines={1} 
                    ellipsizeMode="tail"
                  >
                    {item.structured_formatting.secondary_text}
                  </Text>
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}
    </View>
  );
};

export default GoogleTextInput;