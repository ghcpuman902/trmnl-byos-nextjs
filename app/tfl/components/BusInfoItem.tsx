interface ArrivalInfo {
    lineName: string;
    destinationName: string;
    timeToStation: number;
}

export function BusInfoItem({ lineName, destinationName, timeToStation }: ArrivalInfo) {
    return (
        <div className="flex items-center justify-between p-2 border-b last:border-0 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700">
            <div className="flex items-center gap-2">
                <span className="flex items-center justify-center w-12 h-12 rounded bg-red-600 dark:bg-red-800 text-white font-extrabold text-lg">
                    {lineName}
                </span>
                <span className="text-sm dark:text-gray-300">
                    {destinationName.split(',')[0]}
                </span>
            </div>
            <span className="text-sm font-medium dark:text-gray-300">
                {Math.floor(timeToStation / 60)}m
            </span>
        </div>
    );
} 