import { readFileSync, writeFileSync, renameSync, mkdirSync } from "node:fs";
import { dirname } from "node:path";

// Single-process deployment only. Reserve quota before contacting the provider.
export function createQuota({ file, dailyLimit = 250, minuteLimit = 60, concurrency = 4, now = Date.now } = {}) {
    for (const value of [dailyLimit, minuteLimit, concurrency]) {
        if (!Number.isSafeInteger(value) || value < 1) throw new Error("Invalid AI request limit");
    }
    let state = { day: "", count: 0, recent: [] };
    if (file) {
        try {
            state = JSON.parse(readFileSync(file, "utf8"));
            if (typeof state.day !== "string" || !Number.isSafeInteger(state.count) || state.count < 0 ||
                !Array.isArray(state.recent) || !state.recent.every(Number.isFinite)) throw new Error("Invalid quota file");
        } catch (error) {
            if (error.code !== "ENOENT") throw error;
        }
    }
    let active = 0;
    return {
        reserve() {
            const time = now();
            const day = new Date(time).toISOString().slice(0, 10);
            const count = state.day === day ? state.count : 0;
            const recent = state.recent.filter(t => t > time - 60000);
            if (count >= dailyLimit) return { retry: Math.max(1, Math.ceil((Date.parse(`${day}T00:00:00Z`) + 86400000 - time) / 1000)), error: "Today's activity limit has been reached. Please try again tomorrow." };
            if (recent.length >= minuteLimit || active >= concurrency) return { retry: 60, error: "Activity suggestions are busy. Please try again in a minute." };
            const next = { day, count: count + 1, recent: [...recent, time] };
            if (file) {
                mkdirSync(dirname(file), { recursive: true });
                writeFileSync(`${file}.tmp`, JSON.stringify(next), { mode: 0o600 });
                renameSync(`${file}.tmp`, file);
            }
            state = next;
            active++;
            let released = false;
            return { release() { if (!released) { active--; released = true; } } };
        }
    };
}
