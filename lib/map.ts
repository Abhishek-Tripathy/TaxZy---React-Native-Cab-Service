import { Driver, MarkerData } from "@/types/type";

const olaAPI = process.env.EXPO_PUBLIC_OLA_MAPS_API_KEY;

export const generateMarkersFromData = ({
  data,
  userLatitude,
  userLongitude,
}: {
  data: Driver[];
  userLatitude: number;
  userLongitude: number;
}): MarkerData[] => {
  return data.map((driver) => {
    const latOffset = (Math.random() - 0.5) * 0.01; // Random offset between -0.005 and 0.005
    const lngOffset = (Math.random() - 0.5) * 0.01; // Random offset between -0.005 and 0.005

    return {
      latitude: userLatitude + latOffset,
      longitude: userLongitude + lngOffset,
      title: `${driver.first_name} ${driver.last_name}`,
      // Initialize with default values to prevent NaN
      time: 5, // Default 5 minutes
      price: "12.50", // Default price
      ...driver,
    };
  });
};

export const calculateRegion = ({
  userLatitude,
  userLongitude,
  destinationLatitude,
  destinationLongitude,
}: {
  userLatitude: number | null;
  userLongitude: number | null;
  destinationLatitude?: number | null;
  destinationLongitude?: number | null;
}) => {
  if (!userLatitude || !userLongitude) {
    return {
      latitude: 37.78825,
      longitude: -122.4324,
      latitudeDelta: 0.01,
      longitudeDelta: 0.01,
    };
  }

  if (!destinationLatitude || !destinationLongitude) {
    return {
      latitude: userLatitude,
      longitude: userLongitude,
      latitudeDelta: 0.01,
      longitudeDelta: 0.01,
    };
  }

  const minLat = Math.min(userLatitude, destinationLatitude);
  const maxLat = Math.max(userLatitude, destinationLatitude);
  const minLng = Math.min(userLongitude, destinationLongitude);
  const maxLng = Math.max(userLongitude, destinationLongitude);

  const latitudeDelta = (maxLat - minLat) * 1.3; // Adding some padding
  const longitudeDelta = (maxLng - minLng) * 1.3; // Adding some padding

  const latitude = (userLatitude + destinationLatitude) / 2;
  const longitude = (userLongitude + destinationLongitude) / 2;

  return {
    latitude,
    longitude,
    latitudeDelta,
    longitudeDelta,
  };
};

// Helper function to safely fetch directions using Ola Krutrim API
const fetchOlaDirections = async (originLat: number, originLng: number, destLat: number, destLng: number) => {
  try {
    const requestId = Math.random().toString(36).substring(7);
    const response = await fetch(
      `https://api.olamaps.io/routing/v1/directions?` +
      `origin=${originLat},${originLng}` +
      `&destination=${destLat},${destLng}` +
      `&api_key=${olaAPI}`,
      {
        method: 'POST',
        headers: {
          'X-Request-Id': requestId,
          'Content-Type': 'application/json'
        }
      }
    );
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    
    // Check if the API returned valid routes
    if (!data.routes || data.routes.length === 0) {
      console.warn('No routes found in Ola API response');
      return null;
    }
    
    const route = data.routes[0];
    if (!route.legs || route.legs.length === 0) {
      console.warn('No legs found in route');
      return null;
    }
    
    const leg = route.legs[0];
    if (!leg.duration || typeof leg.duration !== 'number') {
      console.warn('Invalid duration in route leg');
      return null;
    }
    
    return leg.duration; // Duration in seconds (assuming Ola returns seconds)
  } catch (error) {
    console.error('Error fetching Ola directions:', error);
    return null;
  }
};

// Helper function to calculate distance-based fallback time
const calculateFallbackTime = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
  // Haversine formula to calculate distance
  const R = 6371; // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c; // Distance in kilometers
  
  // Estimate time based on average speed (assume 30 km/h in city)
  const estimatedTimeMinutes = (distance / 30) * 60;
  return Math.max(estimatedTimeMinutes, 2); // Minimum 2 minutes
};

export const calculateDriverTimes = async ({
  markers,
  userLatitude,
  userLongitude,
  destinationLatitude,
  destinationLongitude,
}: {
  markers: MarkerData[];
  userLatitude: number | null;
  userLongitude: number | null;
  destinationLatitude: number | null;
  destinationLongitude: number | null;
}) => {
  if (
    !userLatitude ||
    !userLongitude ||
    !destinationLatitude ||
    !destinationLongitude
  ) {
    console.warn('Missing required coordinates for driver time calculation');
    return markers; // Return original markers with default values
  }

  // Check if API key is available
  if (!olaAPI) {
    console.warn('Ola Maps API key not found, using fallback calculations');
    // Use distance-based fallback
    return markers.map(marker => {
      const timeToUser = calculateFallbackTime(marker.latitude, marker.longitude, userLatitude, userLongitude);
      const timeToDestination = calculateFallbackTime(userLatitude, userLongitude, destinationLatitude, destinationLongitude);
      const totalTime = timeToUser + timeToDestination;
      const price = (totalTime * 0.5).toFixed(2);
      
      return { 
        ...marker, 
        time: Math.round(totalTime), 
        price: price 
      };
    });
  }

  try {
    const timesPromises = markers.map(async (marker) => {
      try {
        // Fetch time from driver to user using Ola API
        const timeToUser = await fetchOlaDirections(
          marker.latitude, 
          marker.longitude, 
          userLatitude, 
          userLongitude
        );

        // Fetch time from user to destination using Ola API
        const timeToDestination = await fetchOlaDirections(
          userLatitude, 
          userLongitude, 
          destinationLatitude, 
          destinationLongitude
        );

        let totalTime: number;
        
        // If either API call failed, use fallback calculation
        if (timeToUser === null || timeToDestination === null) {
          console.warn(`Ola API call failed for driver ${marker.id}, using fallback calculation`);
          const fallbackTimeToUser = calculateFallbackTime(marker.latitude, marker.longitude, userLatitude, userLongitude);
          const fallbackTimeToDestination = calculateFallbackTime(userLatitude, userLongitude, destinationLatitude, destinationLongitude);
          totalTime = fallbackTimeToUser + fallbackTimeToDestination;
        } else {
          totalTime = (timeToUser + timeToDestination) / 60; // Convert seconds to minutes
        }

        // Ensure totalTime is a valid number
        if (isNaN(totalTime) || totalTime <= 0) {
          totalTime = 10; // Default 10 minutes if calculation fails
        }

        const price = (totalTime * 0.5).toFixed(2); // Calculate price based on time
        
        return { 
          ...marker, 
          time: Math.round(totalTime), 
          price: price 
        };
      } catch (error) {
        console.error(`Error calculating time for driver ${marker.id}:`, error);
        // Return marker with fallback values
        const fallbackTime = calculateFallbackTime(marker.latitude, marker.longitude, userLatitude, userLongitude);
        return { 
          ...marker, 
          time: Math.round(fallbackTime), 
          price: (fallbackTime * 0.5).toFixed(2) 
        };
      }
    });

    const results = await Promise.all(timesPromises);
    return results;
  } catch (error) {
    console.error("Error calculating driver times:", error);
    // Return original markers with default values as fallback
    return markers.map(marker => ({
      ...marker,
      time: 8, 
      price: "15.00"
    }));
  }
};