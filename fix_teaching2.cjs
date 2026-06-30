const fs = require('fs');

let content = fs.readFileSync("client/src/components/TeachingMaterials.tsx", "utf8");

// State
content = content.replace(
    'const [links, setLinks] = useState<{ [key: number]: string }>({});',
    'const [links, setLinks] = useState<{ [key: number]: string[] }>({});'
);

// Load
const old_load = "        const loadedLinks: { [key: number]: string } = {};\n        for (let w = 1; w <= 14; w++) {\n          const key = `teaching_material_week_${w}`;\n          if (parsed[key]?.type === 'link' && parsed[key]?.value) {\n            loadedLinks[w] = parsed[key].value;\n          }\n        }";
const new_load = "        const loadedLinks: { [key: number]: string[] } = {};\n        for (let w = 1; w <= 14; w++) {\n          const key = `teaching_material_week_${w}`;\n          if (parsed[key]?.type === 'links' && Array.isArray(parsed[key]?.value)) {\n            loadedLinks[w] = parsed[key].value;\n          } else if (parsed[key]?.type === 'link' && parsed[key]?.value) {\n            loadedLinks[w] = [parsed[key].value];\n          }\n        }";
content = content.replace(old_load, new_load);

// handleLinkChange
const old_change = "  const handleLinkChange = (week: number, value: string) => {\n    setLinks(prev => ({ ...prev, [week]: value }));\n  };";
const new_change = "  const handleLinkChange = (week: number, index: number, value: string) => {\n    setLinks(prev => {\n      const updated = prev[week] ? [...prev[week]] : [''];\n      updated[index] = value;\n      return { ...prev, [week]: updated };\n    });\n  };\n\n  const handleAddLink = (week: number) => {\n    setLinks(prev => ({ ...prev, [week]: [...(prev[week] || []), ''] }));\n  };\n\n  const handleRemoveLink = (week: number, index: number) => {\n    setLinks(prev => {\n      const updated = prev[week] ? [...prev[week]] : [];\n      updated.splice(index, 1);\n      return { ...prev, [week]: updated };\n    });\n  };";
content = content.replace(old_change, new_change);

// handleSave
const old_save = "      // Update with new links\n      for (let w = 1; w <= 14; w++) {\n        const key = `teaching_material_week_${w}`;\n        if (links[w] && links[w].trim() !== '') {\n          currentPortfolio[key] = { type: 'link', value: links[w].trim() };\n        } else {\n          delete currentPortfolio[key];\n        }\n      }";
const new_save = "      // Update with new links\n      for (let w = 1; w <= 14; w++) {\n        const key = `teaching_material_week_${w}`;\n        const weekLinks = (links[w] || []).map(l => l.trim()).filter(l => l !== '');\n        if (weekLinks.length > 0) {\n          currentPortfolio[key] = { type: 'links', value: weekLinks };\n        } else {\n          delete currentPortfolio[key];\n        }\n      }";
content = content.replace(old_save, new_save);

// Render inputs
const old_render = `            <div style={{ flex: 1, display: 'flex', gap: '8px' }}>
              <input
                className="no-print"
                type="url"
                placeholder="https://..."
                value={links[week] || ''}
                onChange={e => handleLinkChange(week, e.target.value)}
                style={{
                  flex: 1,
                  background: 'var(--bg-input)',
                  border: '1px solid var(--border-color)',
                  color: 'var(--text-active)',
                  padding: '8px 12px',
                  borderRadius: '4px',
                  fontSize: '0.9rem',
                  outline: 'none'
                }}
              />
              {links[week] && (
                <>
                  <a 
                    href={links[week]} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="btn btn-secondary no-print"
                    style={{ textDecoration: 'none', display: 'flex', alignItems: 'center' }}
                  >
                    ?? Open
                  </a>
                  <a 
                    href={links[week]} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="only-print"
                    style={{ textDecoration: 'underline', color: '#3b82f6', wordBreak: 'break-all' }}
                  >
                    {links[week]}
                  </a>
                </>
              )}
              {!links[week] && (
                <span className="only-print" style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                  No link provided
                </span>
              )}
            </div>`;

const new_render = `            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {(links[week] && links[week].length > 0 ? links[week] : ['']).map((link, index) => (
                <div key={index} style={{ display: 'flex', gap: '8px', width: '100%' }}>
                  <input
                    className="no-print"
                    type="url"
                    placeholder="https://..."
                    value={link}
                    onChange={e => handleLinkChange(week, index, e.target.value)}
                    style={{
                      flex: 1,
                      background: 'var(--bg-input)',
                      border: '1px solid var(--border-color)',
                      color: 'var(--text-active)',
                      padding: '8px 12px',
                      borderRadius: '4px',
                      fontSize: '0.9rem',
                      outline: 'none'
                    }}
                  />
                  {link && (
                    <a 
                      href={link} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="btn btn-secondary no-print"
                      style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', padding: '0 12px' }}
                    >
                      ?? Open
                    </a>
                  )}
                  <button className="btn btn-secondary no-print" onClick={() => handleRemoveLink(week, index)} style={{ padding: '0 10px', color: 'var(--danger)' }}>?</button>
                </div>
              ))}
              <button className="btn btn-secondary no-print" style={{ alignSelf: 'flex-start', fontSize: '0.8rem', padding: '4px 8px' }} onClick={() => handleAddLink(week)}>+ Add Link</button>
              
              <div className="only-print">
                {links[week] && links[week].some(l => l.trim() !== '') ? (
                  <ul style={{ margin: 0, paddingLeft: '20px' }}>
                    {links[week].filter(l => l.trim() !== '').map((l, i) => (
                      <li key={i}><a href={l} style={{ textDecoration: 'underline', color: '#3b82f6', wordBreak: 'break-all' }}>{l}</a></li>
                    ))}
                  </ul>
                ) : (
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>No links provided</span>
                )}
              </div>
            </div>`;

content = content.replace(old_render, new_render);

fs.writeFileSync("client/src/components/TeachingMaterials.tsx", content, "utf8");
console.log("done");
