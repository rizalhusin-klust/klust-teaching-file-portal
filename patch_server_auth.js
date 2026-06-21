import fs from 'fs';

let c = fs.readFileSync('server/server.js', 'utf8');

// Insert imports at the top
if (!c.includes('import jwt from')) {
  c = c.replace("import express from 'express';", "import express from 'express';\nimport jwt from 'jsonwebtoken';\nimport dotenv from 'dotenv';\ndotenv.config();");
}

// Insert authentication middleware
if (!c.includes('app.post(\'/api/auth/login\'')) {
  const middleware = `
const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_for_local_dev';
const APP_PASSWORD = process.env.APP_PASSWORD || 'password123';

app.post('/api/auth/login', (req, res) => {
  const { password } = req.body;
  if (password === APP_PASSWORD) {
    const token = jwt.sign({ authenticated: true }, JWT_SECRET, { expiresIn: '7d' });
    return res.json({ token });
  }
  return res.status(401).json({ error: 'Invalid password' });
});

app.use('/api', (req, res, next) => {
  if (req.path === '/auth/login') return next();
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized: No token provided' });
  }
  const token = authHeader.split(' ')[1];
  try {
    jwt.verify(token, JWT_SECRET);
    next();
  } catch (err) {
    return res.status(403).json({ error: 'Forbidden: Invalid or expired token' });
  }
});

// 1. Dashboard Summary Stats`;

  c = c.replace("// 1. Dashboard Summary Stats", middleware);
}

fs.writeFileSync('server/server.js', c, 'utf8');
console.log('Patched server.js with JWT authentication');
