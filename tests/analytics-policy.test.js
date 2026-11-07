import test from 'node:test';
import assert from 'node:assert/strict';
import handler, { requiresAnalyticsConsent } from '../api/analytics-policy.js';

test('only explicitly approved countries bypass opt-in; enforced and unknown regions stay protected', () => {
    assert.equal(requiresAnalyticsConsent('US', 'US, AU'), false);
    assert.equal(requiresAnalyticsConsent('AU', 'us, au'), false);
    for (const country of ['DE', 'GB', 'CH', 'NO', 'FR', 'AX', undefined, 'XX', 'EG']) {
        assert.equal(requiresAnalyticsConsent(country, 'US,AU,DE,GB,CH,NO,FR,AX'), true);
    }
    assert.equal(requiresAnalyticsConsent('US'), true);
});

test('policy endpoint returns no visitor identifiers and disables caching', () => {
    const res = { headers: {}, setHeader(key, value) { this.headers[key] = value; }, status(code) { this.code = code; return this; }, json(body) { this.body = body; return this; } };
    handler({ method: 'GET', headers: {} }, res);
    assert.equal(res.code, 200);
    assert.equal(res.headers['Cache-Control'], 'private, no-store');
    assert.deepEqual(res.body, { requiresConsent: true });
});
