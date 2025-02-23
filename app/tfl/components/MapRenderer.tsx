"use client";

import Map, { Marker } from "react-map-gl/mapbox";
import "mapbox-gl/dist/mapbox-gl.css";
import { MarkerPoint } from "../lib/types";

interface MapRendererProps {
    markerPoints: MarkerPoint[];
}

export function MapRenderer({ markerPoints }: MapRendererProps) {
    try {
        if (!process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN) {
            throw new Error("MAPBOX_ACCESS_TOKEN is not set");
        }

        const initialLatitude = markerPoints.reduce((sum, point) => sum + point.lat, 0) / markerPoints.length;
        const initialLongitude = markerPoints.reduce((sum, point) => sum + point.lon, 0) / markerPoints.length;

        return (
            <div className="h-[500px] rounded-lg overflow-hidden shadow-lg">
                <Map
                    mapboxAccessToken={process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN}
                    initialViewState={{
                        latitude: initialLatitude,
                        longitude: initialLongitude,
                        zoom: 15
                    }}
                    style={{ width: '100%', height: '100%' }}
                    mapStyle="mapbox://styles/mapbox/streets-v11"
                >
                    {markerPoints.map((point) => (
                        <Marker
                            key={point.id}
                            latitude={point.lat}
                            longitude={point.lon}
                        >
                            <div
                                style={{
                                    width: point.style.size,
                                    height: point.style.size,
                                    backgroundColor: point.style.color,
                                    borderColor: point.style.borderColor,
                                    borderWidth: point.style.borderWidth,
                                    opacity: point.style.opacity,
                                    zIndex: point.style.zIndex,
                                    borderStyle: point.style.borderWidth ? 'solid' : 'none',
                                }}
                                className={`
                                    ${point.style.shape === 'circle' ? 'rounded-full' : ''}
                                    ${point.style.shape === 'square' ? 'rounded-none' : ''}
                                    ${point.style.shape === 'triangle' ? 'clip-path-triangle' : ''}
                                    shadow-lg
                                `}
                                title={point.name}
                            />
                        </Marker>
                    ))}
                </Map>
            </div>
        );
    } catch (error) {
        console.error("Error rendering map:", error);
        return <div>Error rendering map</div>;
    }
}