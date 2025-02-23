import { getData, callTflApi } from './actions/callTflApi';

export default async function TflApiPage() {
    const { data, error } = await getData();

    return (
        <div className="container mx-auto p-6 max-w-2xl">
            <h1 className="text-2xl font-bold mb-6">TfL API Explorer</h1>
            
            <form action={callTflApi} className="space-y-4">
                <div>
                    <label 
                        htmlFor="endpoint" 
                        className="block text-sm font-medium mb-2"
                    >
                        API Endpoint
                    </label>
                    <input
                        type="text"
                        id="endpoint"
                        name="endpoint"
                        placeholder="/Line/Meta/Modes"
                        className="w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        aria-label="TfL API endpoint"
                        required
                    />
                </div>
                
                <button
                    type="submit"
                    className="w-full bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                    aria-label="Submit API request"
                >
                    Send Request
                </button>
            </form>

            {error && (
                <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-md">
                    <p className="text-red-700">{error}</p>
                </div>
            )}

            {data && (
                <div className="mt-6 p-4 bg-white border rounded-md overflow-auto">
                    <pre className="text-sm">
                        {JSON.stringify(data, null, 2)}
                    </pre>
                </div>
            )}
        </div>
    );
} 