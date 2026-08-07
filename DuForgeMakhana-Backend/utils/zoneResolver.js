// zoneResolver.js

import { lookup } from 'india-pincode-lookup';

// Normalize helper
const norm = (v = '') => v.trim().toUpperCase();

// NCR districts (normalized)
const NCR_DISTRICTS = new Set([
  'DELHI',
  'NEW DELHI',
  'GURUGRAM',
  'GURGAON',
  'NOIDA',
  'GHAZIABAD',
  'FARIDABAD',
  'SONIPAT',
  'PANIPAT',
  'BAGHPAT',
  'MEERUT',
  'MUZAFFARNAGAR',
]);

// State groups (normalized)
const NORTH_STATES = new Set([
  'PUNJAB',
  'HARYANA',
  'HIMACHAL PRADESH',
  'UTTARAKHAND',
  'RAJASTHAN',
  'UTTAR PRADESH',
]);

const NE_STATES = new Set([
  'ASSAM',
  'MEGHALAYA',
  'MANIPUR',
  'MIZORAM',
  'NAGALAND',
  'TRIPURA',
  'ARUNACHAL PRADESH',
  'SIKKIM',
]);

export function resolveZoneFromPincode(pincode) {
  const data = lookup(pincode)?.[0];

  if (!data) {
    console.warn('⚠️ Pincode lookup failed:', pincode);
    return 'ROI';
  }

  const district = norm(data.districtName);
  const state = norm(data.stateName);

  console.log('📍 Pincode resolved:', { pincode, district, state });

  // 1️⃣ NCR (highest priority)
  if (NCR_DISTRICTS.has(district) || state === 'DELHI') {
    return 'NCR';
  }

  // 2️⃣ NORTH
  if (NORTH_STATES.has(state)) {
    return 'NORTH';
  }

  // 3️⃣ NE / SPECIAL
  if (NE_STATES.has(state)) {
    return 'NE_SPL';
  }

  // 4️⃣ Rest of India
  return 'ROI';
}
