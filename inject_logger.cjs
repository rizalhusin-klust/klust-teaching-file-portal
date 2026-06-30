const fs = require('fs');
const file = 'client/index.html';
let content = fs.readFileSync(file, 'utf8');

const script = `
<script>
  window.addEventListener('error', function(e) {
    fetch('http://localhost:3001/api/log-error', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: e.message, filename: e.filename, lineno: e.lineno, colno: e.colno, error: e.error ? e.error.stack : null })
    }).catch(err => console.error(err));
  });
  window.addEventListener('unhandledrejection', function(e) {
    fetch('http://localhost:3001/api/log-error', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: e.reason ? e.reason.message || String(e.reason) : 'Unhandled Rejection', error: e.reason ? e.reason.stack : null })
    }).catch(err => console.error(err));
  });
</script>
`;

if (!content.includes('log-error')) {
  content = content.replace('</head>', script + '\n</head>');
  fs.writeFileSync(file, content);
}
