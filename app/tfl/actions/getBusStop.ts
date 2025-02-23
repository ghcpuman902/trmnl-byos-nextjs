"use server";

import type { StopData, TflArrival, AdditionalProperty, ProcessedBusData, ChildStop, ProcessedChildStop, SanitizedArrival } from "../lib/types";




export async function getBusStops(stopIds: string[]): Promise<ProcessedBusData> {
    // Read the API credentials from environment variables
    const appId = process.env.TFL_APP_ID;
    const appKey = process.env.TFL_APP_KEY;

    if (!appId || !appKey) {
        throw new Error("Missing TFL API credentials");
    }

    try {
        const busStopsPromises = stopIds.map(async (stopId) => {
            const [stopInfo, arrivals] = await Promise.all([
                fetch(`https://api.tfl.gov.uk/StopPoint/${stopId}?app_id=${appId}&app_key=${appKey}`, {
                    next: { revalidate: 30 },
                }).then(async (res) => {
                    if (!res.ok) throw new Error(`Failed to fetch stop information for ${stopId}`);
                    const data = await res.json();
                    return data.details || data; // Handle both wrapped and unwrapped responses
                }),
                fetch(`https://api.tfl.gov.uk/StopPoint/${stopId}/Arrivals?app_id=${appId}&app_key=${appKey}`, {
                    next: { revalidate: 30 },
                }).then(async (res) => {
                    if (!res.ok) throw new Error(`Failed to fetch bus arrival times for ${stopId}`);
                    return res.json() as Promise<TflArrival[]>;
                }),
            ]);

            // Helper function to get property value from additionalProperties
            const getProp = (properties: AdditionalProperty[], category: string, key: string): string | undefined => {
                return properties.find(p => p.category === category && p.key === key)?.value;
            };

            // Helper function to sanitize and process objects
            const sanitizeObject = <T>(obj: unknown): T => {
                if (Array.isArray(obj)) {
                    return obj.map(item => sanitizeObject<T>(item)) as T;
                }
                if (typeof obj === 'object' && obj !== null) {
                    const newObj: Record<string, unknown> = {};
                    for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
                        // Skip $type and type fields
                        if (key === '$type' || key === 'type') {
                            continue;
                        }
                        
                        // Convert non-ASCII symbols to HTML entities
                        if (typeof value === 'string') {
                            newObj[key] = value.replace(/[^\x00-\x7F]/g, (char) => 
                                `&#${char.charCodeAt(0)};`
                            );
                        } else {
                            newObj[key] = sanitizeObject<unknown>(value);
                        }
                    }
                    return newObj as T;
                }
                return obj as T;
            };

            // Process child stops with sanitization
            const childStops = sanitizeObject<ChildStop[]>(stopInfo.children || []);
            const processedStops = childStops.map((child: ChildStop): ProcessedChildStop => ({
                id: child.naptanId,
                letter: child.stopLetter?.replace('->', '') || '',
                towards: getProp(child.additionalProperties, 'Direction', 'Towards') || '',
                lat: child.lat,
                lon: child.lon,
            }));

            // Sanitize arrivals data
            const sanitizedArrivals = sanitizeObject<SanitizedArrival[]>(arrivals);
            const sortedArrivals = sanitizedArrivals.sort((a, b) => 
                a.timeToStation - b.timeToStation
            );

            // Find relevant stop
            const relevantStop = processedStops.find((stop) => 
                stop.id === stopId
            ) || processedStops[0];

            return {
                id: stopId,
                name: stopInfo.commonName,
                letter: relevantStop?.letter || '',
                towards: relevantStop?.towards || '',
                stopInfo: sanitizeObject(stopInfo),
                allArrivals: sortedArrivals,
                lastUpdated: new Date().toLocaleString(),
                additionalProperties: sanitizeObject(stopInfo.additionalProperties),
                lat: relevantStop?.lat || stopInfo.lat,
                lon: relevantStop?.lon || stopInfo.lon,
            } satisfies StopData;
        });

        const stopDatas = await Promise.all(busStopsPromises);
        const ukTime = new Date().toLocaleString("en-US", { timeZone: "Europe/London" });
        const ukHour = new Date(ukTime).getHours();
        const ukMinutes = new Date(ukTime).getMinutes();
        const currentTime = ukHour + ukMinutes / 60;
        const isNightTime = currentTime > 0.42 && currentTime < 5.92; // 00:25 to 05:55
        const hasAnyBus100 = stopDatas.some(stop => stop.allArrivals?.some((arrival: TflArrival) => arrival.lineName === '100'));

        return {
            stopDatas,
            isNightTime,
            hasAnyBus100,
        };
    } catch (error) {
        console.error('Error fetching bus stops:', error);
        throw error;
    }
} 