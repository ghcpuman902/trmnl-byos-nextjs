import { supabase } from '@/lib/supabase/client'

type LogLevel = 'info' | 'warn' | 'error' | 'debug'

interface LogOptions {
  source?: string
  metadata?: Record<string, unknown>
  trace?: string
}

export const log = async (
  level: LogLevel,
  message: string | Error,
  options: LogOptions = {}
) => {
  // Convert Error objects to strings if necessary
  const messageText = message instanceof Error ? message.message : message
  const trace = message instanceof Error ? message.stack : options.trace

  // Always do console logging first
  switch (level) {
    case 'info':
      console.log(messageText)
      break
    case 'warn':
      console.warn(messageText)
      break
    case 'error':
      console.error(messageText)
      break
    case 'debug':
      console.debug(messageText)
      break
  }

  // Then log to database without awaiting
  (async () => {
    try {
      const { error } = await supabase
        .from('system_logs')
        .insert({
          level,
          message: messageText,
          source: options.source,
          metadata: options.metadata,
          trace
        })

      if (error) {
        console.error('Failed to write to system_logs:', error)
      }
    } catch (err) {
      console.error('Error writing to system_logs:', err)
    }
  })()
}

// Convenience methods
export const logInfo = (message: string, options?: LogOptions) => log('info', message, options)
export const logWarn = (message: string, options?: LogOptions) => log('warn', message, options)
export const logError = (error: Error | string, options?: LogOptions) => log('error', error, options)
export const logDebug = (message: string, options?: LogOptions) => log('debug', message, options)

export type Log = {
  id: string
  created_at: string
  level: LogLevel
  message: string
  source?: string
  metadata?: Record<string, unknown>
  trace?: string
}

export const readLogs = async (limit = 100): Promise<Log[]> => {
  const { data: logs, error } = await supabase
    .from('system_logs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) {
    console.error('Failed to read system_logs:', error)
    return []
  }

  return logs as Log[]
} 