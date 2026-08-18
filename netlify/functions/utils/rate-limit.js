/* ==========================================================================
   Columbia HVAC Co. — Best-effort in-memory rate limiter
   --------------------------------------------------------------------------
   Simple fixed-key sliding-window counter, kept in a module-level Map so it
   persists for the lifetime of a warm function container.

   IMPORTANT LIMITATION (documented honestly, not hidden):
   Netlify Functions (like most serverless platforms) can run multiple
   container instances concurrently, and any instance can be recycled
   ("cold start") at any time, which resets its counters. This means an
   in-memory limiter like this one:
     - DOES protect against a single client hammering the endpoint from one
       warm instance (the common case for a low/moderate-traffic site, and
       fully effective during local `netlify dev`, which runs one process).
     - Does NOT guarantee a hard global cap under high concurrency/scale,
       because different requests can land on different instances that
       don't share memory.
   For production-grade, guaranteed-global rate limiting, pair this with
   Netlify's own traffic/rate-limiting controls (Site configuration >
   Traffic & security, available on qualifying plans) and/or an external
   store such as Upstash Redis. This in-process limiter is a genuinely
   useful first line of defense, not a complete solution on its own.
   ========================================================================== */

function createRateLimiter(options) {
  var windowMs = (options && options.windowMs) || 60000;
  var max = (options && options.max) || 10;
  var hits = new Map(); // key -> array of timestamps (ms)

  // Periodically forget stale keys so the Map can't grow unbounded on a
  // long-lived warm container.
  function sweep(now) {
    hits.forEach(function (timestamps, key) {
      var fresh = timestamps.filter(function (t) { return now - t < windowMs; });
      if (fresh.length === 0) {
        hits.delete(key);
      } else {
        hits.set(key, fresh);
      }
    });
  }

  return {
    /** Returns { allowed, remaining, retryAfterSeconds }. */
    check: function (key) {
      var now = Date.now();
      if (hits.size > 5000) sweep(now); // cheap bound on memory growth

      var timestamps = hits.get(key) || [];
      timestamps = timestamps.filter(function (t) { return now - t < windowMs; });

      if (timestamps.length >= max) {
        var oldest = timestamps[0];
        var retryAfterMs = windowMs - (now - oldest);
        return {
          allowed: false,
          remaining: 0,
          retryAfterSeconds: Math.max(1, Math.ceil(retryAfterMs / 1000))
        };
      }

      timestamps.push(now);
      hits.set(key, timestamps);
      return { allowed: true, remaining: max - timestamps.length, retryAfterSeconds: 0 };
    }
  };
}

module.exports = { createRateLimiter: createRateLimiter };
