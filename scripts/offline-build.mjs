import { readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { resolve, relative, sep, basename } from 'node:path';
import { createHash } from 'node:crypto';

const walk = directory => readdirSync(directory).sort().flatMap(name => {
  const file = resolve(directory, name);
  return statSync(file).isDirectory() ? walk(file) : [file];
});

export function offlineBuild() {
  let config;
  return {
    name: 'galactic-jumpers-offline',
    apply: 'build',
    configResolved(resolved) { config = resolved; },
    writeBundle() {
      const base = config.base;
      if (!base.startsWith('/') || !base.endsWith('/')) throw new Error('Use an absolute base path such as / or /jumpers/ in vite.config.js.');
      const directory = resolve(config.root, config.build.outDir);
      const files = walk(directory).filter(file => /\.(?:html|js|css|json|webmanifest|webp|png|svg|ico|woff2?)$/.test(file) && basename(file) !== 'sw.js');
      const hash = createHash('sha256');
      const paths = files.map(file => {
        const name = relative(directory, file).split(sep).join('/');
        hash.update(name).update(readFileSync(file));
        return base + name;
      });
      const template = readFileSync(resolve(config.root, 'src/service-worker.js'), 'utf8');
      hash.update(template).update(base);
      const prefix = 'galactic-jumpers-' + createHash('sha256').update(base).digest('hex').slice(0,8) + '-';
      const offline = {
        cachePrefix: prefix,
        cacheName: prefix + hash.digest('hex').slice(0,16),
        base,
        files: [base, ...paths],
        legacyCaches: base === '/' ? ['galactic-jumpers-v1', 'galactic-jumpers-v1-1'] : [],
      };
      writeFileSync(resolve(directory, 'sw.js'), template.replace('__OFFLINE_CONFIG__', JSON.stringify(offline)));
      console.log(`Offline cache generated for ${offline.files.length} URLs.`);
    },
  };
}
