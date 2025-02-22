/* The code snippet you provided is a comment block in TypeScript. It includes a series of curl
commands that are used to make HTTP requests to different endpoints on a local server
(http://localhost:3000). The comment indicates that both variations of the `/api/display` endpoint
should return a 200 OK response with the same content, and the same applies to other endpoints like
`/api/log/` and `/api/setup/`. */
// # Both of these should now return 200 OK with the same response
// curl -v "http://localhost:3000/api/display/"
// curl -v "http://localhost:3000/api/display"

// # Same for other endpoints
// curl -v "http://localhost:3000/api/log/"
// curl -v "http://localhost:3000/api/setup/"


import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// This function can be marked `async` if using `await` inside
export function middleware(request: NextRequest) {
  // Forward to existing route for testing purpose
  return NextResponse.next(); // This forwards the request to the next middleware or route handler
}

// See "Matching Paths" below to learn more
export const config = {
  matcher: '/about/:path*',
}