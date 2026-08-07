// Zone resolution tests (node built-in runner: npm test)
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { resolveZoneFromPincode } from '../utils/zoneResolver.js';

test('Delhi pincode resolves to NCR', () => {
  assert.equal(resolveZoneFromPincode('110001'), 'NCR');
});

test('Gurgaon pincode resolves to NCR', () => {
  assert.equal(resolveZoneFromPincode('122001'), 'NCR');
});

test('Chandigarh/Punjab pincode resolves to NORTH', () => {
  assert.equal(resolveZoneFromPincode('141001'), 'NORTH'); // Ludhiana
});

test('Mumbai pincode resolves to ROI', () => {
  assert.equal(resolveZoneFromPincode('400001'), 'ROI');
});

test('Guwahati (Assam) resolves to NE_SPL', () => {
  assert.equal(resolveZoneFromPincode('781001'), 'NE_SPL');
});

test('invalid pincode falls back to ROI', () => {
  assert.equal(resolveZoneFromPincode('000000'), 'ROI');
  assert.equal(resolveZoneFromPincode(''), 'ROI');
  assert.equal(resolveZoneFromPincode('abc'), 'ROI');
});
