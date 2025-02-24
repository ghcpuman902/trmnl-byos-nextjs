'use client';

import { useState } from 'react';

const parseAndFormatJson = (jsonString: Record<string, unknown> | string | undefined) => {
    if (!jsonString) return { formatted: '', preview: '', parsed: null };

    const isJsonString = (str: string) => {
        const jsonRegex = /^[\],:{}\s]*$/
            .test(str.replace(/\\["\\\/bfnrtu]/g, '@')
            .replace(/"[^"\\\n\r]*"|true|false|null|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?/g, ']')
            .replace(/(?:^|:|,)(?:\s*\[)+/g, ''));
        return jsonRegex;
    };

    if (typeof jsonString === 'string' && isJsonString(jsonString)) {
        const parsed = JSON.parse(jsonString);
        return {
            formatted: JSON.stringify(parsed, null, 2),
            preview: JSON.stringify(parsed).slice(0, 64) + "...",
            parsed
        };
    }

    if (typeof jsonString === 'string') {
        return {
            formatted: jsonString,
            preview: jsonString.slice(0, 50) + "...",
            parsed: null
        };
    }

    return {
        formatted: jsonString.toString(),
        preview: jsonString.toString().slice(0, 50) + "...",
        parsed: null
    };
};

export const LogMetadata = ({ metadata }: { metadata: Record<string, unknown> | string | undefined }) => {
    const [isExpanded, setIsExpanded] = useState(false);

    if (!metadata) return <span className="text-gray-400">-</span>;

    const handleToggle = () => setIsExpanded(!isExpanded);
    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' || e.key === ' ') handleToggle();
    };

    const { formatted, preview, parsed } = parseAndFormatJson(metadata);

    return (
        <div className={`relative w-auto min-w-[500px] overflow-y-scroll overflow-x-auto
                    ${isExpanded ? 'h-full max-h-[80vh]' : 'h-[1lh]'}`}
            onKeyDown={handleKeyDown}
            aria-label={isExpanded ? "Collapse metadata" : "Expand metadata"}>
            <div className="h-full w-full">
                <pre className={`
                    whitespace-pre-wrap font-mono text-xs break-all w-full h-full
                    ${parsed ? '' : 'text-red-500'} // Apply red text color if not JSON
                    `}
                >
                    {isExpanded ? formatted : preview}
                </pre>
            </div>
            {/* {isExpanded && (
                <div 
                className="fixed inset-0 bg-black/50 z-5" 
                onClick={handleToggle}
                aria-hidden="true"
                />
            )} */}
            <div role="button" tabIndex={0} onClick={handleToggle} className="cursor-pointer hover:text-indigo-600 transition-colors absolute right-0 top-0 text-xs text-indigo-600 bg-white px-1">
                {isExpanded ? "Collapse" : "Expand"}
            </div>
        </div>
    );
}; 