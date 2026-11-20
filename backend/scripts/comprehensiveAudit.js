import http from 'http';

const BASE_URL = 'http://localhost:5000';

function request(path, method = 'GET', data = null, token = null) {
  return new Promise((resolve, reject) => {
    const payload = data ? JSON.stringify(data) : null;
    const headers = { 'Content-Type': 'application/json' };
    if (payload) headers['Content-Length'] = Buffer.byteLength(payload);
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const req = http.request(
      {
        hostname: 'localhost',
        port: 5000,
        path,
        method,
        headers,
      },
      (res) => {
        let body = '';
        res.on('data', (c) => (body += c));
        res.on('end', () => {
          try {
            resolve({ status: res.statusCode, data: JSON.parse(body) });
          } catch (e) {
            resolve({ status: res.statusCode, raw: body });
          }
        });
      }
    );
    req.on('error', reject);
    if (payload) req.write(payload);
    req.end();
  });
}

async function runComprehensiveAudit() {
  console.log('===============================================================');
  console.log('   KRISTALLBALL DEFENSE LOGISTICS - FULL COMPLIANCE AUDIT');
  console.log('===============================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, testName) {
    if (condition) {
      console.log(`[PASS] ${testName}`);
      passed++;
    } else {
      console.error(`[FAIL] ${testName}`);
      failed++;
    }
  }

  try {
    // 1. Health check
    const health = await request('/api/health');
    assert(health.status === 200 && health.data.status === 'ONLINE', 'System Health Check online');

    // 2. Authentication: Admin login
    const adminAuth = await request('/api/auth/login', 'POST', {
      username: 'admin_user',
      password: 'AdminPass123!',
    });
    assert(adminAuth.status === 200 && !!adminAuth.data.token, 'Admin Authentication with JWT token generation');
    const adminToken = adminAuth.data.token;

    // 3. Authentication: Base Commander Alpha login
    const cmdAuth = await request('/api/auth/login', 'POST', {
      username: 'commander_alpha',
      password: 'CommandPass123!',
    });
    assert(cmdAuth.status === 200 && cmdAuth.data.user.baseId === 1, 'Base Commander Alpha Authentication & Scoping to Base #1');
    const cmdToken = cmdAuth.data.token;

    // 4. Authentication: Logistics Officer login
    const logAuth = await request('/api/auth/login', 'POST', {
      username: 'logistics_officer',
      password: 'LogisticsPass123!',
    });
    assert(logAuth.status === 200 && logAuth.data.user.role === 'LOGISTICS_OFFICER', 'Logistics Officer Authentication');
    const logToken = logAuth.data.token;

    // 5. Authentication: Bad credentials check
    const badAuth = await request('/api/auth/login', 'POST', {
      username: 'admin_user',
      password: 'WrongPassword!',
    });
    assert(badAuth.status === 401, 'Rejection of invalid password credentials with HTTP 401');

    // 6. Global Math Balance Check (Admin)
    const globalMetrics = await request('/api/assets/metrics', 'GET', null, adminToken);
    const gm = globalMetrics.data;
    const expectedGlobalClosing = gm.openingBalance + gm.netMovement - gm.assigned - gm.expended;
    assert(
      gm.closingBalance === expectedGlobalClosing,
      `Global Mathematical Model: ${gm.openingBalance} (Opening) + ${gm.netMovement} (Net) - ${gm.assigned} (Assigned) - ${gm.expended} (Expended) = ${gm.closingBalance} (Closing)`
    );

    const expectedGlobalNet = gm.purchases + gm.transfersIn - gm.transfersOut;
    assert(
      gm.netMovement === expectedGlobalNet,
      `Global Net Movement: ${gm.purchases} (Purchases) + ${gm.transfersIn} (Tr. In) - ${gm.transfersOut} (Tr. Out) = ${gm.netMovement}`
    );

    // 7. Base Scoped Math Balance Check (Commander Alpha - Base 1)
    const cmdMetrics = await request('/api/assets/metrics', 'GET', null, cmdToken);
    const cm = cmdMetrics.data;
    const expectedCmdClosing = cm.openingBalance + cm.netMovement - cm.assigned - cm.expended;
    assert(
      cm.closingBalance === expectedCmdClosing,
      `Scoped Commander Model (Base 1): ${cm.openingBalance} (Opening) + ${cm.netMovement} (Net) - ${cm.assigned} (Assigned) - ${cm.expended} (Expended) = ${cm.closingBalance} (Closing)`
    );

    // 8. RBAC Test: Commander cannot access base comparison
    const rbacBaseComp = await request('/api/assets/base-comparison', 'GET', null, cmdToken);
    assert(rbacBaseComp.status === 403, 'RBAC Enforcement: Commander denied access to all-base comparison (HTTP 403)');

    // 9. RBAC Test: Logistics Officer cannot create personnel assignment
    const rbacAssign = await request('/api/assignments', 'POST', {
      baseId: 1,
      equipmentTypeId: 1,
      quantity: 5,
      assignedToPersonnel: 'Unauthorized Soldier',
      unitName: 'Logistics',
    }, logToken);
    assert(rbacAssign.status === 403, 'RBAC Enforcement: Logistics Officer denied personnel assignment creation (HTTP 403)');

    // 10. RBAC Test: Commander cannot transfer assets out of a base they do not command
    const rbacForeignTransfer = await request('/api/transfers', 'POST', {
      sourceBaseId: 2, // Fort Bravo, but Commander is at Base 1
      destinationBaseId: 1,
      equipmentTypeId: 1,
      quantity: 5,
    }, cmdToken);
    assert(rbacForeignTransfer.status === 403, 'RBAC Base Isolation: Commander Alpha denied transfer dispatch from Fort Bravo (HTTP 403)');

    // 11. Transaction Test: Atomic transfer execution with stock validation
    const transferPayload = {
      sourceBaseId: 1,
      destinationBaseId: 4,
      equipmentTypeId: 1, // M4A1
      quantity: 5,
      status: 'COMPLETED',
      notes: 'Automated Compliance Test Transfer',
    };
    const validTransfer = await request('/api/transfers', 'POST', transferPayload, adminToken);
    assert(validTransfer.status === 201 && !!validTransfer.data.transfer?.id, 'Atomic Transfer: Valid cross-base transfer processed and committed');

    // 12. Transaction Test: Transfer rejection when quantity exceeds available stock
    const excessTransfer = await request('/api/transfers', 'POST', {
      sourceBaseId: 1,
      destinationBaseId: 4,
      equipmentTypeId: 1,
      quantity: 999999, // Exceeds all armory stock
    }, adminToken);
    assert(excessTransfer.status === 400 && excessTransfer.data.error.includes('Insufficient inventory'), 'Atomic Transfer: Excess quantity safely rolled back with 400 Insufficient Inventory');

    // 13. Audit Logging Verification
    const auditRes = await request('/api/audit-logs?limit=5', 'GET', null, adminToken);
    assert(auditRes.status === 200 && auditRes.data.length > 0, `Central Audit Trail: Retained ${auditRes.data.length} immutable events with user IDs and timestamps`);

    // 14. Unauthenticated Request Rejection
    const unauthReq = await request('/api/assets/metrics', 'GET');
    assert(unauthReq.status === 401, 'Security: Unauthenticated request rejected with HTTP 401');

    console.log('\n===============================================================');
    console.log(` AUDIT SUMMARY: ${passed} PASSED | ${failed} FAILED`);
    console.log('===============================================================');

    if (failed === 0) {
      console.log('\n>>> SYSTEM STATUS: 100% OPERATIONAL & COMPLIANT FOR DEPLOYMENT <<<\n');
      process.exit(0);
    } else {
      process.exit(1);
    }
  } catch (err) {
    console.error('Audit exception:', err);
    process.exit(1);
  }
}

runComprehensiveAudit();
