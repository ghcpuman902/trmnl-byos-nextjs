import { TrainFrontTunnel } from 'lucide-react';
import { getLineStatusByMode } from '../actions/getLineStatusByMode';

const lineColorMap = {
    'bakerloo': '#B36305',
    'central': '#E32017',
    'circle': '#FFD300',
    'district': '#00782A',
    'hammersmith-city': '#F3A9BB',
    'jubilee': '#A0A5A9',
    'metropolitan': '#9B0056',
    'northern': '#000000',
    'piccadilly': '#003688',
    'victoria': '#0098D4',
    'waterloo-city': '#95CDBA',
    'dlr': '#00A4A7',
    'elizabeth': '#6950A1',
    'lioness': '#FC9D9A',
    'mildmay': '#0071FD',
    'suffragette': '#76B82A',
    'weaver': '#A45A2A',
    'windrush': '#EE2E24',
    'overground': '#0071FD'
} as const;

const severityNumbers = Array.from({ length: 21 }, (_, i) => i);
type SeverityNumber = typeof severityNumbers[number];

const severityMapping = {
    critical: [1, 2, 3, 16] as const, // 1: Closed, 2: Suspended, 3: Part Suspended, 16: Not Running
    severe: [4, 5, 6, 11, 12] as const, // 4: Planned Closure, 5: Part Closure, 6: Severe Delays, 11: Part Closed, 12: Exit Only
    minor: [7, 8, 9, 14, 15, 17] as const, // 7: Reduced Service, 8: Bus Service, 9: Minor Delays, 14: Change of frequency, 15: Diverted, 17: Issues Reported
    special: [0, 13, 19] as const, // 0: Special Service, 13: No Step Free Access, 19: Information
    good: [10, 18, 20] as const // 10: Good Service, 18: No Issues, 20: Service Closed for the night
} as const;

const isNormalSeverity = (statuses: Array<{ statusSeverity: number }>) => {
    return statuses.every(status => {
        const severity = status.statusSeverity as SeverityNumber;
        return severityMapping.good.includes(severity as typeof severityMapping.good[number]) ||
            severityMapping.special.includes(severity as typeof severityMapping.special[number]);
    });
}

const getSeverityClass = (severity: SeverityNumber) => {
    if (severityMapping.critical.includes(severity as typeof severityMapping.critical[number])) return 'text-red-700 animate-[pulse_1s_ease-in-out_infinite]';
    if (severityMapping.severe.includes(severity as typeof severityMapping.severe[number])) return 'text-orange-700 animate-[pulse_1.5s_ease-in-out_infinite]';
    if (severityMapping.minor.includes(severity as typeof severityMapping.minor[number])) return 'text-yellow-700 animate-[pulse_2s_ease-in-out_infinite]';
    if (severityMapping.special.includes(severity as typeof severityMapping.special[number])) return 'text-blue-700';
    return 'text-green-700';
};

const getSeverityAnimation = (severity: SeverityNumber) => {
    if (severityMapping.critical.includes(severity as typeof severityMapping.critical[number])) return "animate-[pulse_1s_ease-in-out_infinite]";
    if (severityMapping.severe.includes(severity as typeof severityMapping.severe[number])) return "animate-[pulse_1.5s_ease-in-out_infinite]";
    if (severityMapping.minor.includes(severity as typeof severityMapping.minor[number])) return "animate-[pulse_2s_ease-in-out_infinite]";
    return "";
};

const hasNightClosure = (statuses: Array<{ statusSeverity: number }>) => {
    return statuses.some(status => status.statusSeverity === 20);
};

export default async function StatusPage() {
    const lineStatuses = await getLineStatusByMode(['tube', 'elizabeth-line', 'dlr', 'overground']);

    // Sort line statuses by lowest (most severe) status severity
    const sortedLineStatuses = lineStatuses.sort((a, b) => {
        const aMinSeverity = Math.min(...a.lineStatuses.map(s => s.statusSeverity));
        const bMinSeverity = Math.min(...b.lineStatuses.map(s => s.statusSeverity));
        return aMinSeverity - bMinSeverity; // Ascending order
    });

    return (
        <div className="container mx-auto p-4">
            <h1 className="text-2xl font-bold mb-6">TfL Line Status</h1>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {sortedLineStatuses.filter(line => !isNormalSeverity(line.lineStatuses)).map((line) => (
                    <div
                        key={line.id}
                        className="flex flex-col gap-0"
                    >

                        <h2 className="text-lg font-semibold">{line.name}</h2>
                        <div className="w-full h-[6px] relative">
                            {(line.modeName === 'overground' || line.modeName === 'elizabeth-line') ? (
                                <>
                                    <div className={`w-full h-[6px] ${line.id in lineColorMap
                                        ? `bg-[${lineColorMap[line.id as keyof typeof lineColorMap]}]`
                                        : 'bg-gray-400'
                                        } ${line.lineStatuses[0]?.statusSeverity < 7 ? getSeverityAnimation(line.lineStatuses[0].statusSeverity as SeverityNumber) + ' saturate-150' : ''}`} />
                                    <div className="absolute top-[2px] left-0 w-full h-[2px] bg-white" />
                                </>
                            ) : (
                                <div className={`w-full h-[6px] ${line.id in lineColorMap
                                    ? `bg-[${lineColorMap[line.id as keyof typeof lineColorMap]}]`
                                    : 'bg-gray-400'
                                    } ${line.lineStatuses[0]?.statusSeverity < 7 ? getSeverityAnimation(line.lineStatuses[0].statusSeverity as SeverityNumber) + ' saturate-150' : ''}`} />
                            )}
                        </div>

                        {line.lineStatuses.map((status, index) => {
                            const severityTitleClass = getSeverityClass(status.statusSeverity as SeverityNumber);
                            const statusDescription = status.statusSeverityDescription;

                            return (
                                <div
                                    key={index}
                                    className={`mt-2`}
                                >
                                    <div className="">
                                        <span className={`font-medium ${severityTitleClass} mr-2`}>
                                            {statusDescription}|{status.statusSeverity}
                                        </span>
                                        {status.reason && (
                                            <span className={`text-sm text-gray-600 mt-1 text-pretty`}>
                                                {status.reason?.replace(new RegExp(`^${line.name.toUpperCase()}( LINE)?: `, 'i'), '').replace(/^(Hammersmith and City Line: )|(London Overground: )|(Docklands Light Railway: )\s*/, '')}
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
                {sortedLineStatuses.filter(line => isNormalSeverity(line.lineStatuses)).map((line) => (
                    <div
                        key={line.id}
                        className="flex flex-col mb-2"
                    >
                        <div className="flex justify-between">
                            <h2 className="text-lg font-semibold">
                                {line.name}
                            </h2>
                            {hasNightClosure(line.lineStatuses) && (
                                <TrainFrontTunnel className={`w-[1lh] h-[1lh] ${line.id in lineColorMap ? `text-[${lineColorMap[line.id as keyof typeof lineColorMap]}]` : 'text-gray-400'}`} />
                            )}
                        </div>
                        <div className="w-full h-[6px] relative saturate-150">
                            {(line.modeName === 'overground' || line.modeName === 'elizabeth-line') ? (
                                <>
                                    <div className={`w-full h-[6px] ${line.id in lineColorMap
                                        ? `bg-[${lineColorMap[line.id as keyof typeof lineColorMap]}]`
                                        : 'bg-gray-400'
                                        }`} />
                                    <div className="absolute top-[2px] left-0 w-full h-[2px] bg-white" />
                                </>
                            ) : (
                                <div className={`w-full h-[6px] ${line.id in lineColorMap
                                    ? `bg-[${lineColorMap[line.id as keyof typeof lineColorMap]}]`
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
