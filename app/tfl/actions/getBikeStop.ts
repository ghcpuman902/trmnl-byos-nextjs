"use server";
import { ProcessedBikeData } from "../lib/types";

export async function getBikeStops(bikePointIds: string[]): Promise<ProcessedBikeData[]> {
    const appId = process.env.TFL_APP_ID;
    const appKey = process.env.TFL_APP_KEY;

    if (!appId || !appKey) {
        throw new Error("Missing TFL API credentials");
    }

    try {
        const bikePointsPromises = bikePointIds.map(async (id) => {
            // Ensure ID has correct prefix if not already present
            const formattedId = id.startsWith('BikePoints_') ? id : `BikePoints_${id}`;
            
            const response = await fetch(
                `https://api.tfl.gov.uk/BikePoint/${formattedId}?app_id=${appId}&app_key=${appKey}`,
                {
                    next: { revalidate: 60 },
                }
            );

            if (!response.ok) {
                throw new Error(`Failed to fetch bike point ${formattedId}`);
            }

            const point = await response.json();

            // Helper function to get property value with type assertion
            const getProp = <T>(key: string, defaultValue: T): T => {
                const prop = point.additionalProperties.find((p: unknown) => (p as { key: string }).key === key);
                if (!prop) return defaultValue;

                const value = (prop as { value: string }).value;
                
                if (typeof defaultValue === 'number') {
                    return Number(value) as T;
                } else if (typeof defaultValue === 'boolean') {
                    return (value === "true") as T;
                }
                return value as T;
            };

            // Calculate broken docks with proper typing
            const nbDocks = getProp<number>("NbDocks", 0);
            const nbBikes = getProp<number>("NbBikes", 0);
            const nbSpaces = getProp<number>("NbEmptyDocks", 0);
            const brokenDocks = nbDocks - (nbBikes + nbSpaces);

            // Get the latest modification time
            const latestModified = point.additionalProperties.reduce((latest: Date, prop: unknown) => {
                const propDate = new Date((prop as { modified: string }).modified);
                return propDate > latest ? propDate : latest;
            }, new Date(0));

            return {
                id: point.id as string,
                name: point.commonName as string,
                lat: point.lat as number,
                lon: point.lon as number,
                lastUpdated: latestModified.toLocaleString(),
                totalDocks: nbDocks,
                availableBikes: nbBikes,
                standardBikes: getProp<number>("NbStandardBikes", 0),
                eBikes: getProp<number>("NbEBikes", 0),
                emptyDocks: nbSpaces,
                noneBrokenDocks: nbDocks - brokenDocks,
                isLocked: getProp<boolean>("Locked", false),
                isTemporary: getProp<boolean>("Temporary", false),
                terminalName: getProp<string>("TerminalName", ""),
                brokenDocks: brokenDocks > 0 ? brokenDocks : 0,
                additionalProperties: point.additionalProperties as { key: string; value: string; modified: string }[],
            } satisfies ProcessedBikeData;
        });

        return Promise.all(bikePointsPromises);
    } catch (error) {
        console.error('Error fetching bike points:', error);
        throw error;
    }
}
