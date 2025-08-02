export interface LocationError {
  code: number;
  message: string;
}

export class LocationService {
  static async getUserLocation(): Promise<[number, number]> {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject({
          code: -1,
          message: 'Geolocation is not supported by this browser.'
        });
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { longitude, latitude } = position.coords;
          const location: [number, number] = [longitude, latitude];
          console.log('User location obtained:', location);
          resolve(location);
        },
        (error) => {
          console.error('Error getting location:', error);
          
          // Show user-friendly error message
          let errorMessage = 'Unable to get your location.';
          if (error.code === 1) {
            errorMessage = 'Location permission denied. Please allow location access in your browser settings.';
          } else if (error.code === 2) {
            errorMessage = 'Location unavailable. Please check your device location settings.';
          } else if (error.code === 3) {
            errorMessage = 'Location request timed out. Please try again.';
          }
          
          reject({
            code: error.code,
            message: errorMessage
          });
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000 // 5 minutes
        }
      );
    });
  }

  static isLocationSupported(): boolean {
    return !!navigator.geolocation;
  }
} 