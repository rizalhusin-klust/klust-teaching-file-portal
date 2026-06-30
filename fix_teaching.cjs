const fs = require('fs');
let content = fs.readFileSync('client/src/components/TeachingMaterials.tsx', 'utf8');

// Change links state to array of strings
content = content.replace(
  'const [links, setLinks] = useState<{ [key: number]: string }>({});',
  'const [links, setLinks] = useState<{ [key: number]: string[] }>({});'
);

// Update load logic
content = content.replace(
  'const loadedLinks: { [key: number]: string } = {};\n        for (let w = 1; w <= 14; w++) {\n          const key = `teaching_material_week_${w}`;\n          if (parsed[key]?.type === \'link\' && parsed[key]?.value) {\n            loadedLinks[w] = parsed[key].value;\n          }\n        }',
  'const loadedLinks: { [key: number]: string[] } = {};\n        for (let w = 1; w <= 14; w++) {\n          const key = `teaching_material_week_${w}`;\n          if (parsed[key]?.type === \'links\' && Array.isArray(parsed[key]?.value)) {\n            loadedLinks[w] = parsed[key].value;\n          } else if (parsed[key]?.type === \'link\' && parsed[key]?.value) {\n            loadedLinks[w] = [parsed[key].value];\n          }\n        }'
);

// Update handleLinkChange
content = content.replace(
  'const handleLinkChange = (week: number, value: string) => {\n    setLinks(prev => ({ ...prev, [week]: value }));\n  };',
  'const handleLinkChange = (week: number, index: number, value: string) => {\n    setLinks(prev => {\n      const updated = prev[week] ? [...prev[week]] : [\'\'];\n      updated[index] = value;\n      return { ...prev, [week]: updated };\n    });\n  };\n  const handleAddLink = (week: number) => {\n    setLinks(prev => ({ ...prev, [week]: [...(prev[week] || [\'\']), \'\'] }));\n  };\n  const handleRemoveLink = (week: number, index: number) => {\n    setLinks(prev => {\n      const updated = prev[week] ? [...prev[week]] : [];\n      updated.splice(index, 1);\n      return { ...prev, [week]: updated };\n    });\n  };'
);

// Update handleSave
content = content.replace(
  'if (links[w] && links[w].trim() !== \'\') {\n          currentPortfolio[key] = { type: \'link\', value: links[w].trim() };\n        } else {\n          delete currentPortfolio[key];\n        }',
  'const weekLinks = (links[w] || []).map(l => l.trim()).filter(l => l !== \'\');\n        if (weekLinks.length > 0) {\n          currentPortfolio[key] = { type: \'links\', value: weekLinks };\n        } else {\n          delete currentPortfolio[key];\n        }'
);

// Update render
content = content.replace(
  '<div style={{ flex: 1, display: \'flex\', gap: \'8px\' }}>\n              <input\n                className="no-print"\n                type="url"\n                placeholder="https://..."\n                value={links[week] || \'\'}\n                onChange={e => handleLinkChange(week, e.target.value)}\n                style={{\n                  flex: 1,\n                  background: \'var(--bg-input)\',\n                  border: \'1px solid var(--border-color)\',\n                  color: \'var(--text-active)\',\n                  padding: \'8px 12px\',\n                  borderRadius: \'4px\',\n                  fontSize: \'0.9rem\',\n                  outline: \'none\'\n                }}\n              />\n              {links[week] && (\n                <>\n                  <a \n                    href={links[week]} \n                    target="_blank" \n                    rel="noopener noreferrer"\n                    className="btn btn-secondary no-print"\n                    style={{ textDecoration: \'none\', display: \'flex\', alignItems: \'center\' }}\n                  >\n                    ?? Open\n                  </a>',
  '<div style={{ flex: 1, display: \'flex\', flexDirection: \'column\', gap: \'8px\' }}>\n              {(links[week] && links[week].length > 0 ? links[week] : [\'\']).map((link, index) => (\n                <div key={index} style={{ display: \'flex\', gap: \'8px\', width: \'100%\' }}>\n                  <input\n                    className="no-print"\n                    type="url"\n                    placeholder="https://..."\n                    value={link}\n                    onChange={e => handleLinkChange(week, index, e.target.value)}\n                    style={{\n                      flex: 1,\n                      background: \'var(--bg-input)\',\n                      border: \'1px solid var(--border-color)\',\n                      color: \'var(--text-active)\',\n                      padding: \'8px 12px\',\n                      borderRadius: \'4px\',\n                      fontSize: \'0.9rem\',\n                      outline: \'none\'\n                    }}\n                  />\n                  {link && (\n                    <a \n                      href={link} \n                      target="_blank" \n                      rel="noopener noreferrer"\n                      className="btn btn-secondary no-print"\n                      style={{ textDecoration: \'none\', display: \'flex\', alignItems: \'center\', padding: \'0 12px\' }}\n                    >\n                      ??\n                    </a>\n                  )}\n                  <button className="btn btn-secondary no-print" onClick={() => handleRemoveLink(week, index)} style={{ padding: \'0 10px\', color: \'var(--danger)\' }}>?</button>\n                </div>\n              ))}\n              <button className="btn btn-secondary no-print" style={{ alignSelf: \'flex-start\', fontSize: \'0.8rem\', padding: \'4px 8px\' }} onClick={() => handleAddLink(week)}>+ Add Link</button>\n            </div>\n            {/* Print View */}\n            <div className="print-only" style={{ display: \'none\' }}>\n              {links[week] && links[week].length > 0 ? (\n                <ul style={{ margin: 0, paddingLeft: \'20px\' }}>\n                  {links[week].map((l, i) => <li key={i}><a href={l}>{l}</a></li>)}\n                </ul>\n              ) : (\n                <span style={{ color: \'#888\' }}>None</span>\n              )}\n            </div>\n            <div style={{ display: \'none\' }}>'
);

// We need to fix the print-only div properly.
// The replace above leaves a dangling `<div style={{ display: 'none' }}>` to consume the old `{links[week] && ( <> ` blocks.
// Wait, that might cause syntax errors!
