const fs = require('fs');

// 1. Update API_BASE in App.tsx to use relative path
let appTsx = fs.readFileSync('client/src/App.tsx', 'utf8');
appTsx = appTsx.replace(
  "const API_BASE = import.meta.env.VITE_API_URL || 'https://klust-teaching-file-portal.onrender.com/api';",
  "const API_BASE = '/api';"
);
fs.writeFileSync('client/src/App.tsx', appTsx, 'utf8');

// 2. Update server.js to serve the Vite app
let serverJs = fs.readFileSync('server/server.js', 'utf8');

if (!serverJs.includes('../client/dist')) {
  // Serve static assets
  const staticServe = `
// Serve the built Vite frontend
app.use(express.static(path.join(__dirname, '../client/dist')));
`;
  serverJs = serverJs.replace(
    "app.use('/uploads', express.static(path.join(__dirname, 'uploads')));",
    "app.use('/uploads', express.static(path.join(__dirname, 'uploads')));\n" + staticServe
  );

  // Catch-all route for SPA routing
  const catchAll = `
// Catch-all to serve index.html for React SPA
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/dist/index.html'));
});
`;
  // Insert before the server start
  serverJs = serverJs.replace(
    "export const api = onRequest({ cors: true, maxInstances: 10 }, app);",
    catchAll + "\nexport const api = onRequest({ cors: true, maxInstances: 10 }, app);"
  );
  
  fs.writeFileSync('server/server.js', serverJs, 'utf8');
}

// 3. Update root package.json (if exists) or server package.json to build the client
let serverPkg = JSON.parse(fs.readFileSync('server/package.json', 'utf8'));
serverPkg.scripts.build = "cd ../client && npm install && npm run build";
serverPkg.scripts.start = "node server.js";
fs.writeFileSync('server/package.json', JSON.stringify(serverPkg, null, 2), 'utf8');

console.log('Unified deployment configured');
