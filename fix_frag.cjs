const fs = require('fs');
let obeContent = fs.readFileSync('client/src/components/ObeDashboard.tsx', 'utf8');
obeContent = obeContent.replace(/import \{ useState, useEffect \} from 'react';/g, "import { useState, useEffect, Fragment } from 'react';");
obeContent = obeContent.replace(/<React\.Fragment/g, "<Fragment");
obeContent = obeContent.replace(/<\/React\.Fragment>/g, "</Fragment>");
fs.writeFileSync('client/src/components/ObeDashboard.tsx', obeContent, 'utf8');
console.log('Fixed Fragment');
