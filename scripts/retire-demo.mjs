import { unlinkSync } from 'node:fs';

for (const file of [
  '../src/components/experiences/ProductDemo.tsx',
  '../src/content/product-demo.ts',
  '../src/lib/site-configurator.ts',
]) {
  try {
    unlinkSync(new URL(file, import.meta.url));
  } catch (error) {
    if (error.code !== 'ENOENT') {
      console.warn('Eski uygulama dosyası kaldırılamadı:', file);
    }
  }
}
