// Express 4 does not catch rejected promises from async handlers — an unhandled
// rejection would leave the request hanging forever. Every async route handler in
// src/routes/** is wrapped in this so failures reach the error middleware instead.
export const ah = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

// Next.js route handlers read filters off `new URL(req.url).searchParams`; Express
// gives a plain object on req.query. This bridges the two so ported filter-building
// code (e.g. buildLeadsWhere) keeps working unchanged.
export function qs(req) {
  const params = new URLSearchParams();
  for (const [k, v] of Object.entries(req.query)) {
    if (Array.isArray(v)) v.forEach((x) => params.append(k, String(x)));
    else if (v !== undefined) params.append(k, String(v));
  }
  return params;
}

// `role`-gated guard mirroring the `if (!isAdmin) return 403` prelude the Next.js
// routes repeat inline.
export function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ error: "Forbidden" });
    }
    next();
  };
}
