'use client';

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { findStopPointId, getStopPointDetails } from "../actions/findStopPointId";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, ChevronDown, ChevronUp, ChevronRightCircle, Bus } from "lucide-react";
import { useState } from "react";
import { StopDetailResult } from "../actions/findStopPointId";
// Submit button with loading state
function SubmitButton() {
  const { pending } = useFormStatus();
  
  return (
    <Button 
      type="submit" 
      aria-disabled={pending}
      disabled={pending}
    >
      {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
      Search
    </Button>
  );
}

// Initial state for the form
const initialState = {
  message: '',
  stops: [],
  total: 0,
  rawData: null
};

function BusLine({ line }: { line: { id: string; name: string; status?: string } }) {
  return (
    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 mr-2 mb-2">
      <Bus className="w-3 h-3 mr-1" />
      {line.name}
    </span>
  );
}

function JsonDump({ data }: { data: StopDetailResult }) {
  const [isOpen, setIsOpen] = useState(false);

  if (!data) return null;

  return (
    <div className="mt-6 border rounded-lg overflow-hidden">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-2 text-left bg-gray-50 hover:bg-gray-100 
                 flex items-center justify-between font-mono text-sm"
        aria-expanded={isOpen}
      >
        <span>Raw API Response</span>
        {isOpen ? (
          <ChevronUp className="h-4 w-4" />
        ) : (
          <ChevronDown className="h-4 w-4" />
        )}
      </button>
      {isOpen && (
        <pre className="p-4 bg-gray-50 overflow-auto max-h-[500px] text-sm">
          <code>{JSON.stringify(data, null, 2)}</code>
        </pre>
      )}
    </div>
  );
}

export default function BusStopSearchForm() {
  const [state, formAction] = useActionState(findStopPointId, initialState);
  const [detailState, detailFormAction] = useActionState(getStopPointDetails, {
    details: null,
    message: ''
  });

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div>
        <form action={formAction} className="space-y-6">
          <div className="flex gap-2">
            <div className="flex-1">
              <label htmlFor="busStopSearch" className="sr-only">
                Enter bus stop name or area
              </label>
              <Input
                id="busStopSearch"
                name="query"
                placeholder="Enter bus stop name or area..."
                minLength={3}
                required
                aria-required="true"
                aria-invalid={!!state.message}
                aria-describedby={state.message ? "search-error" : undefined}
              />
            </div>
            <SubmitButton />
          </div>
        </form>

        {state.message && (
          <div 
            id="search-error"
            className="mt-4 p-4 bg-red-50 text-red-600 rounded-md"
            role="alert"
            aria-live="polite"
          >
            {state.message}
          </div>
        )}

        {state.stops.length > 0 && (
          <div className="mt-6 space-y-4">
            <h2 className="text-lg font-semibold">
              Found {state.total} bus stops
            </h2>
            <ul 
              className="divide-y divide-gray-200"
              role="list"
              aria-label="Bus stops search results"
            >
              {state.stops.map((stop) => (
                <li
                  key={stop.id}
                  className="py-4 hover:bg-gray-50 rounded-md px-4 transition-colors"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-medium">{stop.name}</h3>
                        <p>ID: {stop.id}</p>
                        {stop.details.towards && (
                          <p className="text-sm text-gray-500 flex items-center mt-1">
                            <ChevronRightCircle className="w-4 h-4 mr-1" />
                            {stop.details.towards}
                          </p>
                        )}
                      </div>
                      <span 
                        className={`px-2 py-1 rounded-full text-sm ${
                          stop.status 
                            ? "bg-green-100 text-green-800" 
                            : "bg-red-100 text-red-800"
                        }`}
                        role="status"
                      >
                        {stop.status ? "Active" : "Inactive"}
                      </span>
                    </div>
                    
                    <div className="text-sm text-gray-500">
                      {stop.details.stopLetter && (
                        <p>Stop Letter: {stop.details.stopLetter}</p>
                      )}
                      <p className="mt-1">
                        Location: {stop.location.lat.toFixed(5)}, {stop.location.lon.toFixed(5)}
                      </p>
                    </div>

                    {stop.lines.length > 0 && (
                      <div className="flex flex-wrap mt-2">
                        {stop.lines.map((line) => (
                          <BusLine key={line.id} line={line} />
                        ))}
                      </div>
                    )}
                  </div>
                </li>
              ))}
            </ul>
            
            {state.rawData && <JsonDump data={state as unknown as StopDetailResult} />}
          </div>
        )}
      </div>

      <div className="space-y-6">
        <form action={detailFormAction} className="space-y-4">
          <div>
            <label 
              htmlFor="stopId" 
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Stop ID
            </label>
            <div className="flex gap-2">
              <Input
                id="stopId"
                name="stopId"
                placeholder="Enter stop ID..."
                required
                aria-required="true"
                aria-invalid={!!detailState.message}
                aria-describedby={detailState.message ? "detail-error" : undefined}
              />
              <Button 
                type="submit"
                aria-disabled={useFormStatus().pending}
                disabled={useFormStatus().pending}
              >
                {useFormStatus().pending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Get Details
              </Button>
            </div>
          </div>
        </form>

        {detailState.message && (
          <div 
            id="detail-error"
            className="p-4 bg-red-50 text-red-600 rounded-md"
            role="alert"
            aria-live="polite"
          >
            {detailState.message}
          </div>
        )}

        {detailState.details && (
          <div className="space-y-4 border rounded-lg p-4">
            <h2 className="text-lg font-semibold">{detailState.details.commonName}</h2>
            
            <div className="space-y-2">
              <p className="text-sm text-gray-600">
                Location: {detailState.details.lat.toFixed(5)}, {detailState.details.lon.toFixed(5)}
              </p>
              
              {/* {detailState.details.additionalProperties?.length > 0 && (
                <div className="space-y-1">
                  <h3 className="text-sm font-medium">Additional Properties</h3>
                  <dl className="grid grid-cols-2 gap-2 text-sm">
                    {detailState.details.additionalProperties.map((prop) => (
                      <div key={prop.key} className="col-span-2">
                        <dt className="font-medium text-gray-500">{prop.key}</dt>
                        <dd>{prop.value}</dd>
                      </div>
                    ))}
                  </dl>
                </div>
              )}

              {detailState.details.lines?.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium mb-2">Serving Lines</h3>
                  <div className="flex flex-wrap gap-2">
                    {detailState.details.lines.map((line) => (
                      <BusLine key={line.id} line={line} />
                    ))}
                  </div>
                </div>
              )} */}
            </div>

            <JsonDump data={detailState as unknown as StopDetailResult} />
          </div>
        )}
      </div>
    </div>
  );
} 