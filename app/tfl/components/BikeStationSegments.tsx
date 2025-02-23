import { Zap } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

// Predefined styles for consistent UI
const styles = {
    // Text styles
    counter: {
        base: "absolute -top-5 text-sm font-medium flex items-center",
        eBike: "text-sky-500 dark:text-sky-400",
        standard: "text-red-600 dark:text-red-400",
        broken: "text-yellow-500",
        total: "text-gray-500 dark:text-gray-400"
    },
    // Bar segment styles
    segment: {
        base: "flex-1 border-r border-white dark:border-gray-700",
        eBike: "bg-sky-500 dark:bg-sky-600",
        standard: "bg-red-600 dark:bg-red-500",
        broken: "bg-yellow-300 dark:bg-yellow-600",
        empty: "bg-gray-200 dark:bg-gray-600"
    }
} as const;

import { ProcessedBikeData } from "../lib/types";

export function BikeStationSegments({ station }: { station: ProcessedBikeData }) {
    const brokenDocks = station.brokenDocks || 0;
    const availableDocks = station.totalDocks - brokenDocks;
    const segments = Array(station.totalDocks).fill(null);

    return (
        <div className="p-2 rounded-md md:rounded-lg shadow-lg border border-gray-100 dark:border-gray-700">
            <div className="flex justify-between items-baseline mb-1">
                <div className="text-sm font-medium text-gray-800 dark:text-gray-200">{station.name}</div>
            </div>
            <div className="relative mt-6">
                <div className="flex items-start absolute w-full">
                    {station.eBikes > 0 && (
                        <div className={`${styles.counter.base} ${styles.counter.eBike}`}>
                            <Zap className="w-4 h-4 mr-1" />
                            <span>{station.eBikes}</span>
                        </div>
                    )}
                    {station.standardBikes > 0 && (
                        <div
                            className={`${styles.counter.base} ${styles.counter.standard}`}
                            style={{
                                left: `${(station.eBikes / station.totalDocks) * 100}%`,
                            }}
                        >
                            {station.standardBikes}
                        </div>
                    )}
                    {brokenDocks > 0 && (
                        <div
                            className={`${styles.counter.base} ${styles.counter.broken}`}
                            style={{
                                left: `${((station.eBikes + station.standardBikes) / station.totalDocks) * 100}%`,
                            }}
                        >
                            {brokenDocks}
                        </div>
                    )}
                    <div
                        className={`${styles.counter.base} ${styles.counter.total}`}
                        style={{
                            right: "0",
                        }}
                    >
                        {station.availableBikes}/{availableDocks}
                    </div>
                </div>
                <div className="flex h-4 rounded-sm overflow-hidden">
                    {segments.map((_, index) => {
                        const getSegmentStyle = () => {
                            if (index < station.eBikes) {
                                return styles.segment.eBike;
                            }
                            if (index < station.eBikes + station.standardBikes) {
                                return styles.segment.standard;
                            }
                            if (index < station.eBikes + station.standardBikes + brokenDocks) {
                                return styles.segment.broken;
                            }
                            return styles.segment.empty;
                        };

                        return (
                            <div 
                                key={index} 
                                className={`${styles.segment.base} ${getSegmentStyle()}`}
                            />
                        );
                    })}
                </div>
            </div>
            <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Updated {formatDistanceToNow(new Date(station.lastUpdated), { addSuffix: true })}
                {station.isLocked && <span className="ml-2 text-red-500">Locked</span>}
                {station.isTemporary && <span className="ml-2 text-blue-500">Temporary</span>}
            </div>
        </div>
    );
} 