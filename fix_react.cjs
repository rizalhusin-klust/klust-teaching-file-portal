const fs = require('fs');
let content = fs.readFileSync('client/src/components/ObeDashboard.tsx', 'utf8');
content = content.replace(/import \{ useState, useEffect, Fragment \} from 'react';/, "import React, { useState, useEffect, Fragment } from 'react';");
fs.writeFileSync('client/src/components/ObeDashboard.tsx', content, 'utf8');
console.log('Fixed React import');
