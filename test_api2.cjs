const http = require('http');
http.get('http://127.0.0.1:3001/api/courses', (res) => {
  let data = '';
  res.on('data', (chunk) => { data += chunk; });
  res.on('end', () => {
    console.log("STATUS:", res.statusCode);
    console.log("BODY:", data);
  });
}).on("error", (err) => {
  console.log("Error: " + err.message);
});
