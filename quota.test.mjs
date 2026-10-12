import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createQuota } from "./quota.mjs";

test("daily quota survives restart and resets at UTC midnight", () => {
    const dir = mkdtempSync(join(tmpdir(), "this-way-quota-"));
    const file = join(dir, "quota.json");
    let time = Date.parse("2026-10-11T12:00:00Z");
    const options = { file, dailyLimit: 1, now: () => time };
    try {
        const first = createQuota(options).reserve();
        assert.equal(typeof first.release, "function");
        first.release();
        const restarted = createQuota(options);
        assert.match(restarted.reserve().error, /Today's/);
        time += 86400000;
        assert.equal(typeof restarted.reserve().release, "function");
    } finally { rmSync(dir, { recursive: true, force: true }); }
});

test("concurrency releases once and rolling minute blocks attempts", () => {
    let time = 100000;
    const quota = createQuota({ minuteLimit: 2, concurrency: 1, now: () => time });
    const first = quota.reserve();
    assert.ok(quota.reserve().error);
    first.release();
    first.release();
    const second = quota.reserve();
    second.release();
    assert.ok(quota.reserve().error);
    time += 60001;
    assert.equal(typeof quota.reserve().release, "function");
});

test("invalid storage and unsafe limit settings fail closed", () => {
    assert.throws(() => createQuota({ dailyLimit: 0 }));
    const dir = mkdtempSync(join(tmpdir(), "this-way-quota-"));
    try {
        const file = join(dir, "quota.json");
        writeFileSync(file, "broken");
        assert.throws(() => createQuota({ file }));
        const quota = createQuota({ file: join(dir, "absent", "quota.json") });
        writeFileSync(join(dir, "absent"), "blocks directory creation");
        assert.throws(() => quota.reserve());
    } finally { rmSync(dir, { recursive: true, force: true }); }
});
