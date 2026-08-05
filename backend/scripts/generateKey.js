'use strict';

const crypto = require('crypto');

const generateKey = (bytes = 64) => {
  const key = crypto.randomBytes(bytes).toString('hex');
  console.log('\n=== Generated Secure Keys ===');
  console.log(`JWT_ACCESS_SECRET=${key.slice(0, 64)}`);
  console.log(`JWT_REFRESH_SECRET=${key.slice(32, 96)}`);
  console.log(`JWT_VERIFY_SECRET=${crypto.randomBytes(32).toString('hex')}`);
  console.log(`JWT_RESET_SECRET=${crypto.randomBytes(32).toString('hex')}`);
  console.log(`ENCRYPTION_KEY=${crypto.randomBytes(16).toString('hex')}`);
  console.log('\n✅ Copy these into your .env file\n');
};

generateKey();
