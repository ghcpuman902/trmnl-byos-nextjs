import { getLineStatusByMode } from '../actions/getLineStatusByMode';

const lineColorMap = {
    'bakerloo': 'bg-[#B36305]',
    'central': 'bg-[#E32017]',
    'circle': 'bg-[#FFD300]',
    'district': 'bg-[#00782A]',
    'hammersmith-city': 'bg-[#F3A9BB]',
    'jubilee': 'bg-[#A0A5A9]',
    'metropolitan': 'bg-[#9B0056]',
    'northern': 'bg-[#000000]',
    'piccadilly': 'bg-[#003688]',
    'victoria': 'bg-[#0098D4]',
    'waterloo-city': 'bg-[#95CDBA]',
    'dlr': 'bg-[#00A4A7]',
    'elizabeth': 'bg-[#6950A1]',
    'lioness': 'bg-[#FC9D9A]',
    'mildmay': 'bg-[#0071FD]',
    'suffragette': 'bg-[#76B82A]',
    'weaver': 'bg-[#A45A2A]',
    'windrush': 'bg-[#EE2E24]',
    'overground': 'bg-[#0071FD]'
} as const;

const getSeverityAnimation = (severity: number) => {
    if (severity <= 3) return "animate-[pulse_1s_ease-in-out_infinite]"; // Very fast pulse for severe disruptions
    if (severity <= 5) return "animate-[pulse_1.5s_ease-in-out_infinite]"; // Medium pulse for minor disruptions
    return "animate-[pulse_2s_ease-in-out_infinite]"; // Slow pulse for other issues
};

export default async function StatusPage() {
    const lineStatuses = await getLineStatusByMode(['tube', 'elizabeth-line', 'dlr', 'overground']);

    // Sort line statuses by severity (0 is most severe)
    const sortedLineStatuses = lineStatuses.sort((a, b) => {
        const aSeverity = a.lineStatuses[0]?.statusSeverity || 10; // Default to 10 if no status
        const bSeverity = b.lineStatuses[0]?.statusSeverity || 10; // Default to 10 if no status
        return aSeverity - bSeverity; // Ascending order
    });

    return (
        <div className="container mx-auto p-4">
            <h1 className="text-2xl font-bold mb-6">TfL Line Status</h1>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {sortedLineStatuses.filter(line => line.lineStatuses[0]?.statusSeverity !== 10).map((line) => (
                    <div
                        key={line.id}
                        className="flex flex-col gap-0"
                    >
                        <h2 className="text-lg font-semibold">{line.name}</h2>
                        <div className="w-full h-[6px] relative">
                            {(line.modeName === 'overground' || line.modeName === 'elizabeth-line') ? (
                                <>
                                    <div className={`w-full h-[6px] ${line.id in lineColorMap
                                        ? lineColorMap[line.id as keyof typeof lineColorMap]
                                        : 'bg-gray-400'
                                        } ${line.lineStatuses[0]?.statusSeverity < 7 ? getSeverityAnimation(line.lineStatuses[0].statusSeverity) + ' saturate-150' : ''}`} />
                                    <div className="absolute top-[2px] left-0 w-full h-[2px] bg-white" />
                                </>
                            ) : (
                                <div className={`w-full h-[6px] ${line.id in lineColorMap
                                    ? lineColorMap[line.id as keyof typeof lineColorMap]
                                    : 'bg-gray-400'
                                    } ${line.lineStatuses[0]?.statusSeverity < 7 ? getSeverityAnimation(line.lineStatuses[0].statusSeverity) + ' saturate-150' : ''}`} />
                            )}
                        </div>

                        {line.lineStatuses.map((status) => {
                            const severityTitleClass = status.statusSeverity >= 8
                                ? 'text-green-700'
                                : status.statusSeverity >= 5
                                    ? 'text-yellow-700'
                                    : 'text-red-700';
                            const statusDescription = status.statusSeverityDescription;

                            return (
                                <div
                                    key={status.id}
                                    className={`mt-2`}
                                >
                                    <div className="">
                                        <span className={`font-medium ${severityTitleClass} mr-2`}>
                                            {statusDescription}
                                        </span>
                                        {status.reason && (
                                            <span className={`text-sm text-gray-600 mt-1 text-pretty`}>
                                                {status.reason?.replace(new RegExp(`^${line.name.toUpperCase()} LINE: `, 'i'), '')}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ))}
            </div>
            <div className="grid lg:grid-cols-5 gap-4 mt-6 justify-items-stretch">
                <div className="flex flex-col justify-end">
                    <h2 className="text-xl prose font-semibold leading-none">Good Service on all other lines</h2>
                </div>
                {sortedLineStatuses.filter(line => line.lineStatuses[0]?.statusSeverity === 10).map((line) => (
                    <div
                        key={line.id}
                        className="flex flex-col mb-2"
                    >
                        <h2 className="text-lg font-semibold">{line.name}</h2>
                        <div className="w-full h-[6px] relative saturate-150">
                            {(line.modeName === 'overground' || line.modeName === 'elizabeth-line') ? (
                                <>
                                    <div className={`w-full h-[6px] ${line.id in lineColorMap
                                        ? lineColorMap[line.id as keyof typeof lineColorMap]
                                        : 'bg-gray-400'
                                        }`} />
                                    <div className="absolute top-[2px] left-0 w-full h-[2px] bg-white" />
                                </>
                            ) : (
                                <div className={`w-full h-[6px] ${line.id in lineColorMap
                                    ? lineColorMap[line.id as keyof typeof lineColorMap]
                                    : 'bg-gray-400'
                                    }`} />
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
