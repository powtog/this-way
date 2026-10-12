import { createHash, createHmac, randomBytes, timingSafeEqual } from "node:crypto";

// Signed browser identifiers avoid trusting client-supplied forwarding headers.
export function createActivityPolicy({ secret = randomBytes(32), now = Date.now } = {}) {
    const visitors = new Map();
    const cache = new Map();
    const pending = new Set();
    const ttl = 10 * 60 * 1000;
    const sign = id => createHmac("sha256", secret).update(id).digest("hex");
    return {
        visitor(request, response) {
            const token = /(?:^|;\s*)thisway_visitor=([a-f0-9]{32}\.[a-f0-9]{64})(?:;|$)/.exec(request.headers?.cookie || "")?.[1];
            if (token) {
                const [id, signature] = token.split(".");
                if (timingSafeEqual(Buffer.from(signature, "hex"), Buffer.from(sign(id), "hex"))) return id;
            }
            const id = randomBytes(16).toString("hex");
            response.setHeader("Set-Cookie", `thisway_visitor=${id}.${sign(id)}; Path=/api/activity; HttpOnly; SameSite=Strict; Max-Age=86400${process.env.NODE_ENV === "production" ? "; Secure" : ""}`);
            return id;
        },
        key(profile, neighbor) {
            const fields = person => [person.aboutMe, person.friendType, person.availability];
            return createHash("sha256").update(JSON.stringify([fields(profile), fields(neighbor)])).digest("hex");
        },
        get(key) {
            const entry = cache.get(key);
            if (entry && entry.expires > now()) return entry.activity;
            cache.delete(key);
        },
        begin(visitor, key) {
            const time = now();
            for (const [id, times] of visitors) {
                const recent = times.filter(t => t > time - ttl);
                if (recent.length) visitors.set(id, recent);
                else visitors.delete(id);
            }
            const times = visitors.get(visitor) || [];
            if (times.length >= 5) return { retry: Math.max(1, Math.ceil((times[0] + ttl - time) / 1000)), error: "You've requested five activity ideas. Please try again in a few minutes." };
            if (pending.has(key)) return { retry: 5, error: "This activity idea is already being prepared. Please try again shortly." };
            if (!visitors.has(visitor) && visitors.size >= 10000) return { retry: 60, error: "Activity suggestions are busy. Please try again in a minute." };
            return { commit() { visitors.set(visitor, [...times, time]); pending.add(key); } };
        },
        finish(key, activity) {
            pending.delete(key);
            if (activity) {
                if (cache.size >= 500) cache.delete(cache.keys().next().value);
                cache.set(key, { activity, expires: now() + ttl });
            }
        }
    };
}
