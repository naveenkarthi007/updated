
module.exports = function(app) {
  app.use((req, res, next) => {
    // Setting COOP/COEP headers can break Google OAuth if set too strictly.
    // 'same-origin-allow-popups' should work, but if we get postMessage blocks,
    // it's safer to remove these headers or configure appropriately.
    res.setHeader('Cross-Origin-Opener-Policy', 'same-origin-allow-popups');
    res.setHeader('Cross-Origin-Embedder-Policy', 'unsafe-none');
    res.removeHeader('Cross-Origin-Opener-Policy'); // Disable to allow Google OAuth popup
    next();
  });
};
