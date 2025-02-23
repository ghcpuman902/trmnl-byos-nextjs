'use server'

import { revalidatePath } from "next/cache";
import { logError, logInfo } from "@/lib/logger";

// Define a generic type for TfL API responses
export type TflApiResponse = {
  [key: string]: unknown;
}

// Store API responses in memory (or could use database like logs)
let lastApiResponse: TflApiResponse | null = null;
let lastApiError: string | null = null;

// Separate the API call logic from the form action
async function fetchTflApi(endpoint: string): Promise<TflApiResponse> {
    const appId = process.env.TFL_APP_ID;
    const appKey = process.env.TFL_APP_KEY;

    if (!appId || !appKey) {
        throw new Error("Missing TFL API credentials");
    }

    endpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    const response = await fetch(
        `https://api.tfl.gov.uk${endpoint}?app_id=${appId}&app_key=${appKey}`,
        {
            cache: 'no-store',
        }
    );

    if (!response.ok) {
        throw new Error(`Failed to fetch data: ${response.statusText}`);
    }

    return response.json();
}

export async function getData(): Promise<{ data: TflApiResponse | null, error: string | null }> {
    'use server'
    return {
        data: lastApiResponse,
        error: lastApiError
    };
}

// Form action that doesn't return a value
export async function callTflApi(formData: FormData): Promise<void> {
    'use server';
    
    try {
        const endpoint = formData.get('endpoint') as string;
        
        if (!endpoint) {
            throw new Error("Endpoint is required");
        }

        const data = await fetchTflApi(endpoint);
        
        // Store the response
        lastApiResponse = data;
        lastApiError = null;
        
        // Log successful API call
        logInfo('TFL API call successful', {
            source: 'tfl-api',
            metadata: { endpoint }
        });

        revalidatePath('/tfl');
    } catch (error) {
        // Store the error
        lastApiResponse = null;
        lastApiError = error instanceof Error ? error.message : 'An unknown error occurred';
        
        // Log the error
        logError(error instanceof Error ? error : new Error(String(error)), {
            source: 'tfl-api',
            metadata: { endpoint: formData.get('endpoint') }
        });

        revalidatePath('/tfl');
    }
} 