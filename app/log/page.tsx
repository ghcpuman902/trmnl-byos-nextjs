import { TimeAgo } from '@/app/components/TimeAgo'
import { readLogs, type Log } from '@/lib/logger'

async function getData(): Promise<Log[]> {
  'use server'
  return readLogs()
}

async function handleRefresh() {
  'use server'
  await getData()
}

export const revalidate = 5 // Revalidate every 5 seconds

export default async function LogsPage() {
  const logs = await getData()

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
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Level</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Source</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Message</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Metadata</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {logs.map((log) => (
                    <tr key={log.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <TimeAgo date={log.created_at} />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
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
                        <pre className="whitespace-pre-wrap font-mono text-xs">
                          {log.metadata ? JSON.stringify(log.metadata, null, 2) : '-'}
                        </pre>
                      </td>
                    </tr>
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