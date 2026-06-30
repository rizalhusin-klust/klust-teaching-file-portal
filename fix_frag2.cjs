const fs = require('fs');
let content = fs.readFileSync('client/src/components/ObeDashboard.tsx', 'utf8');
content = content.replace(/import React, \{ useState/g, "import { useState");
content = content.replace(/React\.Fragment/g, "Fragment");
content = content.replace(/import \{ useState, useEffect \} from 'react';/g, "import { useState, useEffect, Fragment } from 'react';");
fs.writeFileSync('client/src/components/ObeDashboard.tsx', content, 'utf8');
console.log('Fixed Fragment!');
