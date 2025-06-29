import React, { useEffect, useState, useRef } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Text,
  View,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import MapView, { Marker, Polyline, PROVIDER_DEFAULT } from "react-native-maps";
import { icons } from "@/constants";
import { useFetch } from "@/lib/fetch";
import {
  calculateDriverTimes,
  calculateRegion,
  generateMarkersFromData,
} from "@/lib/map";
import { useDriverStore, useLocationStore, useRouteStore } from "@/store";
import { Driver, MarkerData } from "@/types/type";

// Helper function to decode polyline
const decodePolyline = (encoded) => {
  const poly = [];
  let index = 0;
  const len = encoded.length;
  let lat = 0;
  let lng = 0;

  while (index < len) {
    let b;
    let shift = 0;
    let result = 0;
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    const dlat = (result & 1) !== 0 ? ~(result >> 1) : result >> 1;
    lat += dlat;

    shift = 0;
    result = 0;
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    const dlng = (result & 1) !== 0 ? ~(result >> 1) : result >> 1;
    lng += dlng;

    poly.push({
      latitude: lat / 1e5,
      longitude: lng / 1e5,
    });
  }

  return poly;
};

const Maps = () => {
  const mapRef = useRef<MapView>(null);

  // Location store
  const {
    userLatitude,
    userLongitude,
    destinationLatitude,
    destinationLongitude,
  } = useLocationStore();

  // Driver store
  const { selectedDriver, setDrivers } = useDriverStore();

  //Distance and Duration
  const { setRouteDistance, setRouteDuration } = useRouteStore.getState();

  // Fetch drivers
  const { data: drivers, loading, error } = useFetch<Driver[]>("/(api)/driver");

  // State declarations
  const [markers, setMarkers] = useState<MarkerData[]>([]);
  const [routeCoords, setRouteCoords] = useState([]);
  const [loadingRoute, setLoadingRoute] = useState(false);

  // Safe coordinate extraction
  const origin = {
    latitude: userLatitude || 0,
    longitude: userLongitude || 0,
  };

  const destination = {
    latitude: destinationLatitude || 0,
    longitude: destinationLongitude || 0,
  };

  // Fetch Ola Directions
  const fetchRoute = async () => {
  if (!origin.latitude || !destination.latitude) return;

  setLoadingRoute(true);

  try {
    const requestId = Math.random().toString(36).substring(7);
    const apiKey = process.env.EXPO_PUBLIC_OLA_MAPS_API_KEY;

    // Verify API key exists
    if (!apiKey) {
      throw new Error("API key is missing");
    }

    // Construct URL with required parameters
    const baseUrl = "https://api.olamaps.io/routing/v1/directions";
    const params = new URLSearchParams({
      origin: `${origin.latitude},${origin.longitude}`,
      destination: `${destination.latitude},${destination.longitude}`,
      api_key: apiKey,
    });

    const url = `${baseUrl}?${params.toString()}`;

    const response = await fetch(url, {
      method: "POST", // Must be POST as per docs
      headers: {
        "Content-Type": "application/json",
        "X-Request-Id": requestId,
      },
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || `API request failed with status ${response.status}`);
    }

    // Extract distance (assuming it's in the first leg)
    const distanceInKM = data.routes?.[0]?.legs?.[0]?.readable_distance;
    const duration = data.routes?.[0]?.legs?.[0]?.readable_duration;

    setRouteDistance(distanceInKM)
    setRouteDuration(duration)

    // Process successful response
    if (data.routes?.[0]?.overview_polyline) {
      const decodedCoords = decodePolyline(data.routes[0].overview_polyline);
      setRouteCoords(decodedCoords);
    } else {
      setRouteCoords([origin, destination]); // Fallback
    }
  } catch (error) {
    console.error("Routing Error:", error);
    Alert.alert("Routing Error", error.message);
    setRouteCoords([origin, destination]);
  } finally {
    setLoadingRoute(false);
  }
};

  // Generate markers from drivers data
  useEffect(() => {
    if (Array.isArray(drivers)) {
      if (!userLatitude || !userLongitude) return;

      const newMarkers = generateMarkersFromData({
        data: drivers,
        userLatitude,
        userLongitude,
      });
      setMarkers(newMarkers);
    }
  }, [drivers, userLatitude, userLongitude]);

  // Calculate driver times and set drivers in store
  useEffect(() => {
    if (
      markers.length > 0 &&
      destinationLatitude !== undefined &&
      destinationLongitude !== undefined
    ) {
      calculateDriverTimes({
        markers,
        userLatitude,
        userLongitude,
        destinationLatitude,
        destinationLongitude,
      }).then((driversWithTimes) => {
        setDrivers(driversWithTimes as MarkerData[]);
        // console.log("Map page Driver", driversWithTimes)
      });
    }
  }, [markers, destinationLatitude, destinationLongitude]);

  // Fetch route when origin and destination change
  useEffect(() => {
    if (origin.latitude && destination.latitude) {
      fetchRoute();
    }
  }, [
    origin.latitude,
    origin.longitude,
    destination.latitude,
    destination.longitude,
  ]);

  // Calculate region for map
  const region = calculateRegion({
    userLatitude,
    userLongitude,
    destinationLatitude,
    destinationLongitude,
  });

  // Loading state
  if (loading || (!userLatitude && !userLongitude)) {
    return (
      <View className="flex justify-center items-center w-full h-full">
        <ActivityIndicator size="large" color="#0286FF" />
        <Text className="mt-2">Loading map...</Text>
      </View>
    );
  }

  // Error state
  if (error) {
    return (
      <View className="flex justify-center items-center w-full h-full">
        <Text className="text-red-500">Error: {error}</Text>
      </View>
    );
  }

  // Render
  return (
    <View style={{ flex: 1 }}>
      <MapView
        ref={mapRef}
        provider={PROVIDER_DEFAULT}
        style={{ flex: 1 }}
        initialRegion={region}
        tintColor="black"
        // mapType="mutedStandard"
        showsPointsOfInterest={false}
        showsUserLocation={true}
        userInterfaceStyle="light"
        className="w-full h-full rounded-2xl"
      >
        {/* Driver Markers */}
        {markers.map((marker) => (
          <Marker
            key={marker.id}
            coordinate={{
              latitude: marker.latitude,
              longitude: marker.longitude,
            }}
            title={marker.title}
            image={
              selectedDriver === +marker.id
                ? icons.selectedMarker
                : icons.marker
            }
          />
        ))}

        {/* Route Polyline */}
        {routeCoords.length > 0 && (
          <Polyline
            coordinates={routeCoords}
            strokeColor="#0286FF"
            strokeWidth={3}
            lineDashPattern={[0]} // Solid line
          />
        )}

        {/* Destination Marker */}
        {destinationLatitude && destinationLongitude && (
          <Marker
            key="destination"
            coordinate={{
              latitude: destinationLatitude,
              longitude: destinationLongitude,
            }}
            title="Destination"
            image={icons.pin}
          />
        )}
      </MapView>

      {/* Loading Route Indicator */}
      {loadingRoute && (
        <View style={styles.routeLoadingContainer}>
          <ActivityIndicator size="large" color="#0286FF" />
          <Text style={styles.routeLoadingText}>Loading route...</Text>
        </View>
      )}
    </View>
  );
};

export default Maps;

const styles = StyleSheet.create({
  locationButton: {
    position: "absolute",
    bottom: 20,
    right: 20,
    backgroundColor: "white",
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  routeLoadingContainer: {
    position: "absolute",
    top: 20,
    alignSelf: "center",
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    padding: 10,
    borderRadius: 8,
    alignItems: "center",
  },
  routeLoadingText: {
    marginTop: 5,
    fontSize: 12,
    color: "#0286FF",
  },
});
