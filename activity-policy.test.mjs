import test from "node:test";
import assert from "node:assert/strict";
import { createActivityPolicy } from "./activity-policy.mjs";

test("each visitor gets five attempts and becomes eligible after ten minutes", () => {
    let time = 1000000;
    const policy = createActivityPolicy({ now: () => time });
    for (let i = 0; i < 5; i++) {
        policy.begin("alice", String(i)).commit();
        policy.finish(String(i));
    }
    assert.ok(policy.begin("alice", "sixth").error);
    assert.equal(typeof policy.begin("bob", "sixth").commit, "function");
    time += 600001;
    assert.equal(typeof policy.begin("alice", "sixth").commit, "function");
});

test("cache expires and duplicate pending requests do not start twice", () => {
    let time = 0;
    const policy = createActivityPolicy({ now: () => time });
    policy.begin("alice", "profiles").commit();
    assert.ok(policy.begin("bob", "profiles").error);
    policy.finish("profiles", "Take a walk.");
    assert.equal(policy.get("profiles"), "Take a walk.");
    time = 600001;
    assert.equal(policy.get("profiles"), undefined);
});

test("signed visitor cookie is reused and tampered cookies are replaced", () => {
    const policy = createActivityPolicy({ secret: "test-secret" });
    let cookie;
    const response = { setHeader(name, value) { cookie = value; } };
    const id = policy.visitor({ headers: {} }, response);
    assert.equal(policy.visitor({ headers: { cookie } }, response), id);
    cookie = cookie.replace(id, "a".repeat(32));
    assert.notEqual(policy.visitor({ headers: { cookie } }, response), id);
});
