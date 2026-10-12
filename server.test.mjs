import test from "node:test";
import assert from "node:assert/strict";
import { Readable } from "node:stream";
import { createApp } from "./server.mjs";
import { createQuota } from "./quota.mjs";

function request(app, body, path = "/api/activity", method = "POST") {
    return new Promise(resolve => {
        const req = Readable.from([Buffer.from(body)]);
        req.url = path;
        req.method = method;
        const headers = {};
        const res = {
            setHeader(key, value) { headers[key] = value; },
            writeHead(status, extra) { this.status = status; Object.assign(headers, extra); },
            end(data) { resolve({ status: this.status, headers, body: JSON.parse(data) }); }
        };
        app.emit("request", req, res);
    });
}

test("invalid requests use no quota; valid requests are capped before Google", async () => {
    let calls = 0;
    const app = createApp({ apiKey: "test-only", quota: createQuota({ dailyLimit: 1 }), fetchModel: async () => {
        calls++;
        return { ok: true, json: async () => ({ candidates: [{ content: { parts: [{ text: "Take a walk." }] } }] }) };
    } });
    assert.equal((await request(app, "{")).status, 400);
    const person = { aboutMe: "Walking", friendType: "activity", availability: "weeknights" };
    const body = JSON.stringify({ profile: person, neighbor: person });
    assert.equal((await request(app, body)).body.activity, "Take a walk.");
    assert.equal((await request(app, body)).status, 200);
    const limited = await request(app, JSON.stringify({ profile: { ...person, aboutMe: "Gardening" }, neighbor: person }));
    assert.equal(limited.status, 429);
    assert.ok(Number(limited.headers["Retry-After"]) > 0);
    assert.equal(calls, 1);
    assert.equal((await request(app, "", "/health", "GET")).status, 200);
    assert.equal((await request(app, "", "/.env", "GET")).status, 404);
});
