import { TimeAgo } from '@/app/components/TimeAgo'
import { LogMetadata } from '@/app/components/LogMetadata'
import { readLogs, type Log } from '@/lib/logger'
import { Fragment } from 'react'

async function getData(): Promise<Log[]> {
  'use server'
  return readLogs()
}

async function handleRefresh() {
  'use server'
  // Import revalidatePath from next/cache
  const { revalidatePath } = await import('next/cache')
  // Revalidate the current page
  revalidatePath('/log')
}

export const revalidate = 5 // Revalidate every 5 seconds

type LogGroup = {
  timestamp: Date;
  logs: Log[];
};

const groupLogsByTime = (logs: Log[], timeWindowMs: number = 5000): LogGroup[] => {
  if (!logs?.length) return [];
  
  // Sort logs by timestamp in descending order (newest first)
  const sortedLogs = [...logs].sort((a, b) => 
    new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
  
  return sortedLogs.reduce((groups: LogGroup[], log) => {
    const logTime = new Date(log.created_at);
    const lastGroup = groups[groups.length - 1];
    
    // Check if we should add to existing group or create new one
    if (lastGroup && Math.abs(logTime.getTime() - lastGroup.timestamp.getTime()) <= timeWindowMs) {
      lastGroup.logs.push(log);
      // Update group timestamp to the latest time in the group
      lastGroup.timestamp = new Date(Math.max(
        lastGroup.timestamp.getTime(),
        logTime.getTime()
      ));
    } else {
      groups.push({ timestamp: logTime, logs: [log] });
    }
    
    return groups;
  }, []);
};

export default async function LogsPage() {
  const logs = await getData()
  const logGroups = groupLogsByTime(logs)

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">System Logs</h1>
          <form action={handleRefresh}>
            <button
              type="submit"
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              aria-label="Refresh logs"
            >
              Refresh Logs
            </button>
          </form>
        </div>
        
        <div className="bg-white shadow-sm rounded-lg overflow-hidden">
          {!logs?.length ? (
            <div className="p-8 text-center">
              <p className="text-gray-500 text-lg">No logs found</p>
              <p className="text-gray-400 text-sm mt-2">New logs will appear here as they are generated</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50 sticky top-0 z-10">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Level</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Source</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Message</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Metadata</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {logGroups.map((group) => (
                    <Fragment key={group.timestamp.toISOString()}>
                      {group.logs.map((log, logIndex) => (
                        <tr 
                          key={log.id} 
                          className={`
                            hover:bg-gray-50 transition-colors
                            ${logIndex === 0 ? 'border-t-2 border-gray-100' : ''}
                          `}
                        >
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {logIndex === 0 && <TimeAgo date={group.timestamp} />}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`
                              inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                              ${log.level === 'error' && 'bg-red-100 text-red-800'}
                              ${log.level === 'warn' && 'bg-yellow-100 text-yellow-800'}
                              ${log.level === 'info' && 'bg-blue-100 text-blue-800'}
                              ${log.level === 'debug' && 'bg-gray-100 text-gray-800'}
                            `}>
                              {log.level}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {log.source}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-900">
                            {log.message}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-500">
                            <LogMetadata metadata={log.metadata} />
                          </td>
                        </tr>
                      ))}
                    </Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
} 