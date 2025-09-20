#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'src/app/api/analysis/tier-specific/route.ts');

let content = fs.readFileSync(filePath, 'utf8');

// Replace redis.incr with cache operations
content = content.replace(
  /const current = await redis\.incr\(key\);/g,
  `const currentStr = await cache.get(key) || '0';
  const current = parseInt(currentStr) + 1;
  await cache.set(key, current.toString());`
);

// Replace redis.expire
content = content.replace(
  /await redis\.expire\(key, ([^)]+)\);/g,
  'await cache.set(key, current.toString(), $1);'
);

// Replace redis.ttl
content = content.replace(
  /const ttl = await redis\.ttl\(key\);/g,
  'const ttl = 60; // Default TTL when Redis is not available'
);

// Replace redis.setex
content = content.replace(
  /await redis\.setex\(/g,
  'await cache.set('
);

// Replace redis.get
content = content.replace(
  /await redis\.get\(/g,
  'await cache.get('
);

// Fix the setex calls (they have different parameter order)
content = content.replace(
  /await cache\.set\(\s*([^,]+),\s*([^,]+),\s*([^)]+)\)/g,
  (match, key, ttl, value) => {
    // Check if middle param is a number (TTL)
    if (/^\d+$/.test(ttl.trim()) || /limits\.window/.test(ttl)) {
      return `await cache.set(${key}, ${value}, ${ttl})`;
    }
    return match;
  }
);

fs.writeFileSync(filePath, content, 'utf8');
console.log('✅ Fixed Redis usage in tier-specific route');