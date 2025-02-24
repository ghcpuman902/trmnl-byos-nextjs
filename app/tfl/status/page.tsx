import { TrainFrontTunnel } from 'lucide-react';
import { getLineStatusByMode } from '../actions/getLineStatusByMode';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip"

const lineColorMap = {
    'bakerloo': { text: 'text-[var(--tfl-bakerloo)]', bg: 'bg-[var(--tfl-bakerloo)]' },
    'central': { text: 'text-[var(--tfl-central)]', bg: 'bg-[var(--tfl-central)]' },
    'circle': { text: 'text-[var(--tfl-circle)]', bg: 'bg-[var(--tfl-circle)]' },
    'district': { text: 'text-[var(--tfl-district)]', bg: 'bg-[var(--tfl-district)]' },
    'hammersmith-city': { text: 'text-[var(--tfl-hammersmith-city)]', bg: 'bg-[var(--tfl-hammersmith-city)]' },
    'jubilee': { text: 'text-[var(--tfl-jubilee)]', bg: 'bg-[var(--tfl-jubilee)]' },
    'metropolitan': { text: 'text-[var(--tfl-metropolitan)]', bg: 'bg-[var(--tfl-metropolitan)]' },
    'northern': { text: 'text-[var(--tfl-northern)]', bg: 'bg-[var(--tfl-northern)]' },
    'piccadilly': { text: 'text-[var(--tfl-piccadilly)]', bg: 'bg-[var(--tfl-piccadilly)]' },
    'victoria': { text: 'text-[var(--tfl-victoria)]', bg: 'bg-[var(--tfl-victoria)]' },
    'waterloo-city': { text: 'text-[var(--tfl-waterloo-city)]', bg: 'bg-[var(--tfl-waterloo-city)]' },
    'dlr': { text: 'text-[var(--tfl-dlr)]', bg: 'bg-[var(--tfl-dlr)]' },
    'elizabeth': { text: 'text-[var(--tfl-elizabeth)]', bg: 'bg-[var(--tfl-elizabeth)]' },
    'lioness': { text: 'text-[var(--tfl-lioness)]', bg: 'bg-[var(--tfl-lioness)]' },
    'mildmay': { text: 'text-[var(--tfl-mildmay)]', bg: 'bg-[var(--tfl-mildmay)]' },
    'suffragette': { text: 'text-[var(--tfl-suffragette)]', bg: 'bg-[var(--tfl-suffragette)]' },
    'weaver': { text: 'text-[var(--tfl-weaver)]', bg: 'bg-[var(--tfl-weaver)]' },
    'windrush': { text: 'text-[var(--tfl-windrush)]', bg: 'bg-[var(--tfl-windrush)]' },
    'overground': { text: 'text-[var(--tfl-overground)]', bg: 'bg-[var(--tfl-overground)]' }
} as const;

type SeverityNumber = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14 | 15 | 16 | 17 | 18 | 19 | 20;

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

const lineOrder = [
    'circle',
    'district',
    'windrush',
    'elizabeth',
    'dlr',
    'central',
    'northern',
    'piccadilly',
    'jubilee',
    'victoria',
    'bakerloo',
    'hammersmith-city',
    'metropolitan',
    'liberty',
    'lioness',
    'mildmay',
    'suffragette',
    'weaver'
] as const;

const getLineOrder = (lineId: string) => {
    const index = lineOrder.indexOf(lineId as typeof lineOrder[number]);
    return index === -1 ? lineOrder.length : index;
};

export default async function StatusPage() {
    const lineStatuses = await getLineStatusByMode(['tube', 'elizabeth-line', 'dlr', 'overground']);

    // Enhanced sorting logic
    const sortedLineStatuses = lineStatuses.sort((a, b) => {
        const aMinSeverity = Math.min(...a.lineStatuses.map(s => s.statusSeverity));
        const bMinSeverity = Math.min(...b.lineStatuses.map(s => s.statusSeverity));
        
        // If both lines have normal service, sort by predefined order
        if (isNormalSeverity(a.lineStatuses) && isNormalSeverity(b.lineStatuses)) {
            return getLineOrder(a.id) - getLineOrder(b.id);
        }
        
        // If severities are different, sort by severity
        if (aMinSeverity !== bMinSeverity) {
            return aMinSeverity - bMinSeverity;
        }
        
        // If both lines have the same severity level (but not normal),
        // still sort by predefined order as a fallback
        return getLineOrder(a.id) - getLineOrder(b.id);
    });

    return (
        <div className="container mx-auto p-4 flex flex-col gap-2">
            <h1 className="scroll-m-20 text-4xl font-extrabold tracking-tight lg:text-5xl">
                TfL Line Status
            </h1>
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
                                        ? `${lineColorMap[line.id as keyof typeof lineColorMap].bg}`
                                        : 'bg-gray-400'
                                        } ${line.lineStatuses[0]?.statusSeverity < 7 ? getSeverityAnimation(line.lineStatuses[0].statusSeverity as SeverityNumber) + ' saturate-150' : ''}`} />
                                    <div className="absolute top-[2px] left-0 w-full h-[2px] bg-white" />
                                </>
                            ) : (
                                <div className={`w-full h-[6px] ${line.id in lineColorMap
                                    ? `${lineColorMap[line.id as keyof typeof lineColorMap].bg}`
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
            <div className="grid lg:grid-cols-5 gap-4 justify-items-stretch">
                <div className="flex flex-col justify-end">
                    <h2 className="text-xl prose font-semibold leading-none">Good Service on all {sortedLineStatuses.filter(line => !isNormalSeverity(line.lineStatuses)).length > 0 && `other `}lines</h2>
                </div>
                {sortedLineStatuses.filter(line => isNormalSeverity(line.lineStatuses)).map((line) => (
                    <div
                        key={line.id}
                        className="flex flex-col"
                    >
                        <div className="flex justify-between">
                            <h2 className="text-lg font-semibold">
                                {line.name}
                            </h2>
                            {hasNightClosure(line.lineStatuses) && (
                                <TooltipProvider>
                                    <Tooltip>
                                        <TooltipTrigger>
                                            <TrainFrontTunnel className={`w-[1lh] h-[1lh] ${line.id in lineColorMap ? `${lineColorMap[line.id as keyof typeof lineColorMap].text}` : 'text-gray-400'}`} /></TooltipTrigger>
                                        <TooltipContent>
                                            <p>{line.lineStatuses.find(status => status.statusSeverity === 20) ?
                                                `${line.lineStatuses.find(status => status.statusSeverity === 20)?.statusSeverityDescription}, ${line.lineStatuses.find(status => status.statusSeverity === 20)?.reason?.replace(new RegExp(`^${line.name.toUpperCase()}( LINE)?: `, 'i'), '').replace(/^(Hammersmith and City Line: )|(London Overground: )|(Docklands Light Railway: )\s*/, '')}` : 'No night closures'}</p>
                                        </TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>

                            )}
                        </div>
                        <div className="w-full h-[6px] relative saturate-150">
                            {(line.modeName === 'overground' || line.modeName === 'elizabeth-line') ? (
                                <>
                                    <div className={`w-full h-[6px] ${line.id in lineColorMap
                                        ? `${lineColorMap[line.id as keyof typeof lineColorMap].bg}`
                                        : 'bg-gray-400'
                                        }`} />
                                    <div className="absolute top-[2px] left-0 w-full h-[2px] bg-white" />
                                </>
                            ) : (
                                <div className={`w-full h-[6px] ${line.id in lineColorMap
                                    ? `${lineColorMap[line.id as keyof typeof lineColorMap].bg}`
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
