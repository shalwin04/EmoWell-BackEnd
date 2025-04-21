// utils/cache.ts
import NodeCache from "node-cache";

// You can give a TTL (in seconds) or keep it unlimited
const cache = new NodeCache();

export default cache;
