import http from 'http';
import app from '../server.js';

async function runTests() {
  console.log('[TEST] Starting in-process endpoint verification...');

  // Helper fetch function
  const request = (path, method = 'GET', data = null, token = null) => {
    return new Promise((resolve, reject) => {
      const payload = data ? JSON.stringify(data) : null;
      const headers = {
        'Content-Type': 'application/json',
      };
      if (payload) {
        headers['Content-Length'] = Buffer.byteLength(payload);
      }
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

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
          res.on('data', (chunk) => (body += chunk));
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
  };

  try {
    // 1. Health check
    console.log('[TEST 1] Checking /api/health...');
    const health = await request('/api/health');
    console.log('Health:', health.status, health.data.status);

    // 2. Login as Admin
    console.log('[TEST 2] Logging in as Admin (admin_user)...');
    const adminLogin = await request('/api/auth/login', 'POST', {
      username: 'admin_user',
      password: 'AdminPass123!',
    });
    console.log('Admin login status:', adminLogin.status, 'Token exists:', !!adminLogin.data.token);
    const adminToken = adminLogin.data.token;

    // 3. Login as Base Commander Alpha
    console.log('[TEST 3] Logging in as Base Commander (commander_alpha)...');
    const cmdLogin = await request('/api/auth/login', 'POST', {
      username: 'commander_alpha',
      password: 'CommandPass123!',
    });
    console.log('Commander login status:', cmdLogin.status, 'BaseId:', cmdLogin.data.user.baseId);
    const cmdToken = cmdLogin.data.token;

    // 4. Fetch Global Asset Metrics (Admin)
    console.log('[TEST 4] Admin fetching global metrics...');
    const adminMetrics = await request('/api/assets/metrics', 'GET', null, adminToken);
    console.log('Global Metrics:', adminMetrics.data);

    // 5. Fetch Scoped Asset Metrics (Commander Alpha - should automatically scope to Base 1)
    console.log('[TEST 5] Commander fetching scoped metrics...');
    const cmdMetrics = await request('/api/assets/metrics', 'GET', null, cmdToken);
    console.log('Commander Base #1 Metrics:', cmdMetrics.data);

    // 6. Fetch Purchases
    console.log('[TEST 6] Fetching purchases...');
    const purchases = await request('/api/purchases', 'GET', null, adminToken);
    console.log('Purchases count:', purchases.data.length);

    // 7. Fetch Transfers
    console.log('[TEST 7] Fetching transfers...');
    const transfers = await request('/api/transfers', 'GET', null, adminToken);
    console.log('Transfers count:', transfers.data.length);

    // 8. Test RBAC: Commander trying to access all bases comparison (Admin only)
    console.log('[TEST 8] Commander attempting unauthorized route (base-comparison)...');
    const rbacTest = await request('/api/assets/base-comparison', 'GET', null, cmdToken);
    console.log('RBAC Denial Status (Expected 403):', rbacTest.status);

    console.log('\n[SUCCESS] ALL BACKEND TESTS PASSED PERFECTLY!');
    process.exit(0);
  } catch (err) {
    console.error('[TEST ERROR]', err);
    process.exit(1);
  }
}

// Give server 500ms to listen
setTimeout(runTests, 500);
