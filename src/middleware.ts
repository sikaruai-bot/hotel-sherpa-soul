import { securityMiddleware } from './lib/securityMiddleware';

export { securityMiddleware as middleware };
export const config = { matcher: ['/api/:path*'] };

