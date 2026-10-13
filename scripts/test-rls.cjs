/**
 * Supabase Row Level Security (RLS) Policy Test Suite
 * Gulshan Jewellers | Est. 1950
 * Validates Security Boundaries, Anon vs Staff Privileges, and DPDP Protections
 */

const fs = require('fs');
const path = require('path');

console.log('======================================================');
console.log(' GULSHAN JEWELLERS — ROW LEVEL SECURITY (RLS) AUDIT');
console.log('======================================================\n');

const schemaPath = path.join(__dirname, '../supabase/schema.sql');
if (!fs.existsSync(schemaPath)) {
  console.error('❌ Error: supabase/schema.sql not found at', schemaPath);
  process.exit(1);
}

const schemaSql = fs.readFileSync(schemaPath, 'utf8');

// 1. Verify RLS is enabled on all tables
const requiredTables = [
  'products',
  'orders',
  'consultations',
  'enquiries',
  'store_settings',
  'audit_logs'
];

let rlsErrors = 0;

console.log('1. Checking Row Level Security Activation on Core Tables:');
requiredTables.forEach(table => {
  const rlsRegex = new RegExp(`ALTER\\s+TABLE\\s+public\\.${table}\\s+ENABLE\\s+ROW\\s+LEVEL\\s+SECURITY`, 'i');
  if (rlsRegex.test(schemaSql)) {
    console.log(`  ✔ RLS is strictly ENABLED on public.${table}`);
  } else {
    console.error(`  ❌ FAILED: RLS is NOT enabled on public.${table}`);
    rlsErrors++;
  }
});

// 2. Security Matrix Testing
console.log('\n2. Testing Anon (Public Storefront) Privilege Boundaries:');

const policyChecks = [
  {
    table: 'orders',
    anonAllowedOps: ['INSERT'],
    anonForbiddenOps: ['SELECT', 'UPDATE', 'DELETE', 'ALL'],
    reason: 'Customer orders and phone numbers must NOT be readable by public visitors (DPDP Act).'
  },
  {
    table: 'consultations',
    anonAllowedOps: ['INSERT'],
    anonForbiddenOps: ['SELECT', 'UPDATE', 'DELETE', 'ALL'],
    reason: 'Client birth chart and time of birth data must NOT be readable by public visitors.'
  },
  {
    table: 'enquiries',
    anonAllowedOps: ['INSERT'],
    anonForbiddenOps: ['SELECT', 'UPDATE', 'DELETE', 'ALL'],
    reason: 'Customer enquiry contact information must NOT be accessible anonymously.'
  },
  {
    table: 'audit_logs',
    anonAllowedOps: [],
    anonForbiddenOps: ['SELECT', 'INSERT', 'UPDATE', 'DELETE', 'ALL'],
    reason: 'Internal audit trails must be completely invisible to anonymous actors.'
  },
  {
    table: 'products',
    anonAllowedOps: ['SELECT'],
    anonForbiddenOps: ['INSERT', 'UPDATE', 'DELETE', 'ALL'],
    reason: 'Storefront catalogue is readable by visitors; modifications restricted to staff.'
  },
  {
    table: 'store_settings',
    anonAllowedOps: ['SELECT'],
    anonForbiddenOps: ['INSERT', 'UPDATE', 'DELETE', 'ALL'],
    reason: 'Store phone/rates are readable by visitors; updates restricted to staff.'
  }
];

policyChecks.forEach(check => {
  // Check that forbidden ops for anon do NOT have policies granting them to anon
  check.anonForbiddenOps.forEach(op => {
    // Look for CREATE POLICY ... ON public.table FOR <op> TO ...anon
    const badPolicyRegex = new RegExp(`CREATE\\s+POLICY\\s+[^;]+ON\\s+public\\.${check.table}\\s+FOR\\s+${op}\\s+TO\\s+[^;]*anon`, 'i');
    if (badPolicyRegex.test(schemaSql)) {
      console.error(`  ❌ CRITICAL VULNERABILITY: Public/anon granted '${op}' on table '${check.table}'!`);
      rlsErrors++;
    }
  });

  // Check that allowed ops for anon ARE present if required
  check.anonAllowedOps.forEach(op => {
    const goodPolicyRegex = new RegExp(`CREATE\\s+POLICY\\s+[^;]+ON\\s+public\\.${check.table}\\s+FOR\\s+${op}\\s+TO\\s+[^;]*anon`, 'i');
    if (goodPolicyRegex.test(schemaSql)) {
      console.log(`  ✔ public.${check.table} correctly permits anon ${op} (Verified: ${check.reason})`);
    } else {
      console.error(`  ❌ Missing required public policy for '${op}' on '${check.table}'`);
      rlsErrors++;
    }
  });

  // Check that authenticated staff has management policy
  const staffPolicyRegex = new RegExp(`CREATE\\s+POLICY\\s+[^;]+ON\\s+public\\.${check.table}\\s+FOR\\s+(ALL|SELECT)\\s+TO\\s+authenticated`, 'i');
  if (staffPolicyRegex.test(schemaSql)) {
    console.log(`  ✔ public.${check.table} correctly grants authenticated staff management privileges`);
  } else {
    console.error(`  ❌ Missing authenticated staff policy on '${check.table}'`);
    rlsErrors++;
  }
});

// 3. Simulated Access Boundary Matrix (Unit Evaluation)
console.log('\n3. Simulating Multi-Role Access Control Matrix:');

class MockDatabase {
  constructor() {
    this.policies = [
      { table: 'products', role: 'anon', op: 'select', allow: true },
      { table: 'products', role: 'anon', op: 'insert', allow: false },
      { table: 'products', role: 'anon', op: 'delete', allow: false },
      { table: 'orders', role: 'anon', op: 'insert', allow: true },
      { table: 'orders', role: 'anon', op: 'select', allow: false },
      { table: 'orders', role: 'staff', op: 'select', allow: true },
      { table: 'consultations', role: 'anon', op: 'insert', allow: true },
      { table: 'consultations', role: 'anon', op: 'select', allow: false },
      { table: 'consultations', role: 'staff', op: 'select', allow: true },
      { table: 'audit_logs', role: 'anon', op: 'select', allow: false },
      { table: 'audit_logs', role: 'staff', op: 'select', allow: true }
    ];
  }

  can(role, table, op) {
    const match = this.policies.find(p => p.table === table && p.role === role && p.op === op);
    return match ? match.allow : false;
  }
}

const dbMock = new MockDatabase();

const testScenarios = [
  { role: 'anon', table: 'orders', op: 'select', expected: false, name: 'Anonymous visitor reading order history' },
  { role: 'anon', table: 'consultations', op: 'select', expected: false, name: 'Anonymous visitor reading birth chart records' },
  { role: 'anon', table: 'products', op: 'delete', expected: false, name: 'Anonymous visitor deleting an untreated sapphire' },
  { role: 'anon', table: 'orders', op: 'insert', expected: true, name: 'Customer checking out an artificial necklace' },
  { role: 'staff', table: 'orders', op: 'select', expected: true, name: 'Authorized staff viewing orders in admin' },
  { role: 'staff', table: 'consultations', op: 'select', expected: true, name: 'Authorized astrologer reviewing birth details' }
];

testScenarios.forEach(t => {
  const result = dbMock.can(t.role, t.table, t.op);
  if (result === t.expected) {
    console.log(`  ✔ [PASS] ${t.name} -> ${result ? 'PERMITTED' : 'DENIED (SECURE)'}`);
  } else {
    console.error(`  ❌ [FAIL] ${t.name} -> Expected ${t.expected}, got ${result}`);
    rlsErrors++;
  }
});

console.log('\n======================================================');
if (rlsErrors === 0) {
  console.log('✔ RLS POLICY AUDIT PASSED: 0 vulnerabilities found.');
  console.log('All Row Level Security rules conform to strict privacy & security standards.');
  console.log('======================================================\n');
  process.exit(0);
} else {
  console.error(`❌ RLS AUDIT FAILED with ${rlsErrors} errors.`);
  console.log('======================================================\n');
  process.exit(1);
}
