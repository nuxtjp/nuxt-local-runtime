/** Resolve a dependency through the installed application graph, ignoring unused store entries. */
const fs = require('node:fs');
const path = require('node:path');
const { createRequire } = require('node:module');

function installedDependencies(root, target, version) {
  root = fs.realpathSync(root);
  const pending = [path.join(root, 'package.json')];
  const seen = new Set();
  const found = new Set();
  while (pending.length) {
    if (seen.size > 5000) throw new Error('Installed dependency graph exceeds verification budget');
    const file = pending.pop();
    if (seen.has(file)) continue;
    seen.add(file);
    const data = JSON.parse(fs.readFileSync(file, 'utf8'));
    if (data.name === target) {
      if (version !== undefined && data.version !== version) throw new Error('Dependency version changed; review its security patch');
      found.add(file);
    }
    const request = createRequire(file);
    const names = Object.keys({ ...data.dependencies, ...data.optionalDependencies, ...data.peerDependencies,
      ...(file === path.join(root, 'package.json') ? data.devDependencies : {}) });
    for (const name of names) {
      for (const location of request.resolve.paths(name) ?? []) {
        const candidate = path.join(location, name, 'package.json');
        if (!fs.existsSync(candidate)) continue;
        const real = fs.realpathSync(candidate);
        if (!real.startsWith(path.join(root, 'node_modules') + path.sep)) {
          throw new Error('Dependency resolves outside the selected project; select the workspace root');
        }
        pending.push(real);
        break;
      }
    }
  }
  if (found.size === 0) throw new Error('Dependency not present in the installed application graph');
  return [...found].sort();
}
module.exports = { installedDependencies };
