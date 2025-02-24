import { TflLineStatusResponse } from '../lib/types';

export const revalidate = 60; // 60 seconds

export async function getLineStatusByMode(modes: string[]): Promise<TflLineStatusResponse[]> {
    // Read the API credentials from environment variables
    const appId = process.env.TFL_APP_ID;
    const appKey = process.env.TFL_APP_KEY;

    if (!appId || !appKey) {
        throw new Error("Missing TFL API credentials");
    }

    try {
        // Join the modes with comma for the API request
        const modesString = modes.join(',');
        
        const response = await fetch(
            `https://api.tfl.gov.uk/Line/Mode/${modesString}/Status?app_id=${appId}&app_key=${appKey}&detail=false`,
        );

        if (!response.ok) {
            throw new Error(`Failed to fetch line status: ${response.statusText}`);
        }

        const data = await response.json() as TflLineStatusResponse[];
        return data;

    } catch (error) {
        console.error('Error fetching line status:', error);
        throw error;
    }
} 