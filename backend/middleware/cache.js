const NodeCache = require('node-cache');

const cache = new NodeCache({ stdTTL: 300 }); // 5 min default cache

const cacheMiddleware = (duration = 300) => {
  return (req, res, next) => {
    const key = req.originalUrl;
    const cached = cache.get(key);

    if (cached) {
      return res.json({ ...cached, fromCache: true });
    }

    res.sendResponse = res.json;
    res.json = (body) => {
      cache.set(key, body, duration);
      res.sendResponse(body);
    };
    next();
  };
};

module.exports = { cacheMiddleware, cache };
