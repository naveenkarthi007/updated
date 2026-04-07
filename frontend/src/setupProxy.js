
module.exports = function(app) {
  app.use((req, res, next) => {
    // Match backend Helmet: allow Google OAuth postMessage; avoid strict COOP same-origin.
    res.setHeader('Cross-Origin-Opener-Policy', 'same-origin-allow-popups');
    res.setHeader('Cross-Origin-Embedder-Policy', 'unsafe-none');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    next();
  });
};
