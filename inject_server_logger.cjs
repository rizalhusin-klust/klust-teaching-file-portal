const fs = require('fs');
const file = 'server/server.js';
let content = fs.readFileSync(file, 'utf8');

const logEndpoint = `
app.post('/api/log-error', (req, res) => {
  console.log('--- CLIENT ERROR LOG ---');
  console.log(req.body);
  console.log('------------------------');
  fs.appendFileSync('client-errors.log', JSON.stringify(req.body, null, 2) + '\\n');
  res.json({ ok: true });
});
`;

if (!content.includes('/api/log-error')) {
  content = content.replace('// Serve React SPA', logEndpoint + '\n// Serve React SPA');
  fs.writeFileSync(file, content);
}
