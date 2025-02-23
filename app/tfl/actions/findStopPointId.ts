"use server";

interface TflLine {
    id: string;
    name: string;
    uri: string;
    type: string;
    routeType: string;
    status: string;
}

interface TflStopPointMatch {
    parentId: string;
    stationId: string;
    icsId: string;
    towards: string;
    modes: string[];
    stopType: string;
    stopLetter: string;
    lines: TflLine[];
    status: boolean;
    id: string;
    name: string;
    lat: number;
    lon: number;
}

interface TflStopPointSearch {
    query: string;
    total: number;
    matches: TflStopPointMatch[];
}

interface ProcessedBusStop {
    id: string;
    name: string;
    status: boolean;
    location: {
        lat: number;
        lon: number;
    };
    details: {
        towards: string | null;
        stopLetter: string | null;
        stopType: string;
    };
    lines: {
        id: string;
        name: string;
        status: string;
    }[];
    rawData: TflStopPointMatch;
}

interface SearchResult {
    stops: ProcessedBusStop[];
    total: number;
    message: string;
    rawData: TflStopPointSearch | null;
}

interface StopPointDetail {
    id: string;
    commonName: string;
    placeType: string;
    additionalProperties: Array<{
        key: string;
        value: string;
    }>;
    children: Array<{
        naptanId: string;
        indicator: string;
        stopLetter: string;
        modes: string[];
        icsCode: string;
        stopType: string;
        stationNaptan: string;
        lines: Array<{
            id: string;
            name: string;
            uri: string;
            type: string;
            crowding: Record<string, unknown>;
            routeType: string;
            status: string;
        }>;
        lineGroup: Array<{
            naptanIdReference: string;
            stationAtcoCode: string;
            lineIdentifier: string[];
        }>;
        lineModeGroups: Array<{
            modeName: string;
            lineIdentifier: string[];
        }>;
        status: boolean;
        commonName: string;
        placeType: string;
        additionalProperties: Array<{
            category: string;
            key: string;
            sourceSystemKey: string;
            value: string;
        }>;
        lat: number;
        lon: number;
    }>;
    lat: number;
    lon: number;
    lines: Array<{
        id: string;
        name: string;
        uri: string;
    }>;
    lineGroup: Array<{
        naptanIdReference: string;
        stationAtcoCode: string;
        lineIdentifier: string[];
    }>;
}

export interface StopDetailResult {
    details: StopPointDetail | null;
    message: string;
}

export async function findStopPointId(
    prevState: SearchResult,
    formData: FormData
): Promise<SearchResult> {
    const query = formData.get('query');

    if (!query || typeof query !== 'string') {
        throw new Error("Invalid search query");
    }

    const appId = process.env.TFL_APP_ID;
    const appKey = process.env.TFL_APP_KEY;

    if (!appId || !appKey) {
        throw new Error("Missing TFL API credentials");
    }

    try {
        const response = await fetch(
            `https://api.tfl.gov.uk/StopPoint/Search/${encodeURIComponent(query)}?app_id=${appId}&app_key=${appKey}`,
            {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
                next: { 
                    revalidate: 30,
                    tags: [`bus-stops-${query}`]
                },
            }
        );

        if (!response.ok) {
            if (response.status === 404) {
                return {
                    stops: [],
                    total: 0,
                    message: "No stops found",
                    rawData: null as TflStopPointSearch | null
                };
            }
            throw new Error(`Failed to search stop points. Status: ${response.status}`);
        }

        const data = (await response.json()) as TflStopPointSearch;

        // Transform the data into a more readable format
        const processedStops = data.matches
            .filter(match => match.stopType === "NaptanPublicBusCoachTram")
            .map(match => ({
                id: match.id,
                name: match.name,
                status: match.status,
                location: {
                    lat: match.lat,
                    lon: match.lon
                },
                details: {
                    towards: match.towards ?? null,
                    stopLetter: match.stopLetter ?? null,
                    stopType: match.stopType
                },
                lines: match.lines.map(line => ({
                    id: line.id,
                    name: line.name,
                    status: line.status
                })),
                rawData: match
            }));

        return {
            stops: processedStops,
            total: processedStops.length,
            message: processedStops.length > 0 ? "Stops found" : "No stops found",
            rawData: data
        };
    } catch (error) {
        console.error("Error searching for stop points:", error);
        throw new Error(
            error instanceof Error 
                ? error.message 
                : "Failed to search for stop points"
        );
    }
}

export async function getStopPointDetails(
    prevState: StopDetailResult,
    formData: FormData
): Promise<StopDetailResult> {
    const stopId = formData.get('stopId');

    if (!stopId || typeof stopId !== 'string') {
        return {
            details: null,
            message: "Invalid stop ID"
        };
    }

    const appId = process.env.TFL_APP_ID;
    const appKey = process.env.TFL_APP_KEY;

    if (!appId || !appKey) {
        throw new Error("Missing TFL API credentials");
    }

    try {
        const response = await fetch(
            `https://api.tfl.gov.uk/StopPoint/${stopId}?app_id=${appId}&app_key=${appKey}`,
            {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
                next: { 
                    revalidate: 30,
                    tags: [`stop-detail-${stopId}`]
                },
            }
        );

        if (!response.ok) {
            throw new Error(`Failed to fetch stop details. Status: ${response.status}`);
        }

        const data = await response.json() as StopPointDetail;

        return {
            details: data,
            message: "Stop details retrieved successfully"
        };
    } catch (error) {
        console.error("Error fetching stop details:", error);
        return {
            details: null,
            message: error instanceof Error ? error.message : "Failed to fetch stop details"
        };
    }
}