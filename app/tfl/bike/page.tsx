import { getBikeStops } from "../actions/getBikeStop";
import { BikeStationSegments } from "../components/BikeStationSegments";
import { MapRenderer } from "../components/MapRenderer";
import { MarkerPoint, ProcessedBikeData } from "../lib/types";


const DEFAULT_BIKE_POINTS = ["BikePoints_237", "BikePoints_490", "BikePoints_46"];

const convertToMarkerPoint = (bikePoint: ProcessedBikeData): MarkerPoint => {
    // Determine color based on bike availability
    let color = '#9ca3af'; // gray-400 for no bikes available
    if (bikePoint.eBikes > 0) {
        color = '#3b82f6'; // blue-500 for e-bikes available
    } else if (bikePoint.standardBikes > 0) {
        color = '#ef4444'; // red-500 for only standard bikes available
    }

    return {
        id: bikePoint.id,
        name: bikePoint.name,
        lat: bikePoint.lat,
        lon: bikePoint.lon,
        style: {
            size: 16,
            color,
            borderColor: '#ffffff',
            borderWidth: 2,
            opacity: bikePoint.isTemporary ? 0.7 : 1,
            shape: 'circle',
            // Higher z-index for stations with e-bikes to make them more prominent
            zIndex: bikePoint.eBikes > 0 ? 3 : bikePoint.standardBikes > 0 ? 2 : 1,
        },
    };
};

export default async function BikePage() {
    const bikePoints = await getBikeStops(DEFAULT_BIKE_POINTS);
    const markerPoints = bikePoints.map(convertToMarkerPoint);

    return (
        <div className="container mx-auto p-4 h-[calc(100vh-2rem)]">
            <h1 className="text-2xl font-bold mb-6">TfL Bike Point Status</h1>
            <div className="grid lg:grid-cols-2 gap-4 h-[calc(100vh-4rem)]">
                <div className="w-full h-full min-h-[400px]">
                    <MapRenderer markerPoints={markerPoints} />
                </div>
                
                {/* Stations List */}
                <div className="overflow-y-auto overflow-x-visible max-h-[calc(100vh-8rem)] lg:max-h-full">
                    <div className="grid grid-cols-1 gap-4">
                        {bikePoints.map((point) => (
                            <BikeStationSegments key={point.id} station={point} />
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
} 