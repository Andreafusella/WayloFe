import BouncyPressable from '@/components/BouncyPressable';
import { ThemedIcon } from '@/components/ThemedIcon';
import Mapbox from '@rnmapbox/maps';
import { View } from 'react-native';

Mapbox.setAccessToken(process.env.EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN || '');

/** Roma: fallback se il GPS non è ancora disponibile (web o cold start). */
const DEFAULT_CENTER: [number, number] = [12.4964, 41.9028];

export default function ExploreScreen() {

    const mapStyleURL = 'mapbox://styles/waylo/cmp504oa0000001s911nha8tx';
    return (
        <View style={{ flex: 1 }}>
            <Mapbox.MapView
                styleURL={mapStyleURL}
                style={{ flex: 1 }}
                logoEnabled={false}
                attributionEnabled={false}
                scaleBarEnabled={false}
                compassEnabled={false}
            >
                <Mapbox.UserLocation visible animated />
                <Mapbox.Camera
                    zoomLevel={12}
                    followUserLocation={true}
                    followZoomLevel={17}
                    followPitch={45}
                    followUserMode={Mapbox.UserTrackingMode.Follow}
                    pitch={45}
                />
            </Mapbox.MapView>
            <BouncyPressable style={{ backgroundColor: 'red', padding: 10, borderRadius: 10 }}>
                <ThemedIcon family="ionicons" name="arrow-back" size={24} />
            </BouncyPressable>
        </View>
    );
}


