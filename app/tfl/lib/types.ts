import { CSSProperties } from "react";

interface ProcessedBikeData {
    id: string;
    name: string;
    lat: number;
    lon: number;
    lastUpdated: string;
    totalDocks: number;
    availableBikes: number;
    standardBikes: number;
    eBikes: number;
    emptyDocks: number;
    noneBrokenDocks: number;
    isLocked: boolean;
    isTemporary: boolean;
    terminalName: string;
    brokenDocks?: number; // Optional broken docks property
    additionalProperties: Array<{
        key: string;
        value: string;
        modified: string;
    }>;
}

interface MarkerPoint {
    id: string;
    name: string;
    lat: number;
    lon: number;
    style: {
        size: number;           // size in pixels
        color: string;         // primary color (hex, rgb, or tailwind class)
        borderColor?: string;  // optional border color
        borderWidth?: number;  // optional border width in pixels
        opacity?: number;      // optional opacity (0-1)
        shape?: 'circle' | 'square' | 'triangle';  // optional shape type
        zIndex?: number;      // optional z-index for marker layering
    };
}

interface Stop {
    id: string;
    name: string;
    letter: string;
    towards: string;
}
// Add new interface for additional properties
interface AdditionalProperty {
    key: string;
    value: string;
    modified: string;
    category?: string;
}

interface TflStopInfo {
    $type?: string;
    naptanId: string;
    indicator?: string;
    stopLetter?: string;
    modes: string[];
    icsCode: string;
    stopType: string;
    stationNaptan: string;
    status: boolean;
    id: string;
    commonName: string;
    placeType: string;
    additionalProperties: AdditionalProperty[];
    children: TflStopInfo[];
    lat: number;
    lon: number;
    lines?: {
        id: string;
        name: string;
        uri: string;
        type: string;
    }[];
    lineGroup?: {
        naptanIdReference: string;
        stationAtcoCode: string;
        lineIdentifier: string[];
    }[];
    lineModeGroups?: {
        modeName: string;
        lineIdentifier: string[];
    }[];
}

interface TflArrival {
    id: string;
    lineName: string;
    timeToStation: number;
    destinationName: string;
    towards: string;
    expectedArrival: string;
    vehicleId: string;
}

interface StopData extends Stop {
    stopInfo: TflStopInfo;
    allArrivals: TflArrival[];
    lastUpdated: string;
    additionalProperties: AdditionalProperty[];
    lat: number;
    lon: number;
}

interface ProcessedBusData {
    stopDatas: StopData[]
    isNightTime: boolean
    hasAnyBus100: boolean
}

interface ChildStop {
    naptanId: string;
    stopLetter?: string;
    additionalProperties: AdditionalProperty[];
    lat: number;
    lon: number;
}

interface ProcessedChildStop {
    id: string;
    letter: string;
    towards: string;
    lat: number;
    lon: number;
}

interface SanitizedArrival extends Omit<TflArrival, 'timeToStation'> {
    timeToStation: number;
}

type SimplifiedBusLine = {
    id: string
    name: string
}

type SimplifiedBusStop = {
    id: string
    name: string
    letter: string
    towards: string
    lat: number
    lon: number
    lines: SimplifiedBusLine[]
    arrivals: {
        vehicleId: string
        destination: string
        expectedArrival: string
        timeToStation: number
    }[]
}

type SimplifiedDashboardResponse = {
    bikeData: ProcessedBikeData[]
    busData: {
        stops: SimplifiedBusStop[]
        isNightTime: boolean
        hasAnyBus100: boolean
    }
    timestamp: string
}

interface TflLineStatus {
    id: number;
    lineId: string;
    statusSeverity: number;
    statusSeverityDescription: string;
    reason?: string;
    created: string;
    modified: string;
    validityPeriods: {
        fromDate: string;
        toDate: string;
        isNow: boolean;
    }[];
    disruption?: TflDisruption;
}

interface TflDisruption {
    category: string;
    type: string;
    categoryDescription: string;
    description: string;
    summary: string;
    additionalInfo?: string;
    created: string;
    lastUpdate: string;
    affectedRoutes: TflAffectedRoute[];
    affectedStops: TflStopInfo[];
    closureText?: string;
}

interface TflAffectedRoute {
    id: string;
    lineId: string;
    routeCode: string;
    name: string;
    lineString: string;
    direction: string;
    originationName: string;
    destinationName: string;
    via?: {
        ordinal: number;
        stopPoint: TflStopInfo;
    };
    isEntireRouteSection: boolean;
    validTo: string;
    validFrom: string;
    routeSectionNaptanEntrySequence: {
        ordinal: number;
        stopPoint: TflStopInfo;
    }[];
}

interface TflLineServiceType {
    name: string;
    uri: string;
}

interface TflRouteSection {
    routeCode: string;
    name: string;
    direction: string;
    originationName: string;
    destinationName: string;
    originator: string;
    destination: string;
    serviceType: string;
    validTo: string;
    validFrom: string;
}

interface TflCrowding {
    passengerFlows: {
        timeSlice: string;
        value: number;
    }[];
    trainLoadings: {
        line: string;
        lineDirection: string;
        platformDirection: string;
        direction: string;
        naptanTo: string;
        timeSlice: string;
        value: number;
    }[];
}

interface TflLineStatusResponse {
    id: string;
    name: string;
    modeName: string;
    disruptions: TflDisruption[];
    created: string;
    modified: string;
    lineStatuses: TflLineStatus[];
    routeSections: TflRouteSection[];
    serviceTypes: TflLineServiceType[];
    crowding: TflCrowding;
}

const explicitFlexForDiv: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  width: 'auto',
  height: 'auto',
  padding: 0,
  margin: 0,
}

export type {
    MarkerPoint,
    ProcessedBikeData,
    Stop,
    StopData,
    TflArrival,
    TflStopInfo,
    AdditionalProperty,
    ProcessedBusData,
    ChildStop,
    ProcessedChildStop,
    SanitizedArrival,
    SimplifiedBusLine,
    SimplifiedBusStop,
    SimplifiedDashboardResponse,
    TflLineStatusResponse,
    TflLineStatus,
    TflDisruption,
    TflAffectedRoute,
    TflLineServiceType,
    TflRouteSection,
    TflCrowding,
};

export { explicitFlexForDiv };