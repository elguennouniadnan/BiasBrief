// Simple in-memory article cache
// This will persist for the lifetime of the client session (until reload)
export const articleCache: { [id: string]: import("@/lib/types").Article } = {};
