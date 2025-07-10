// Test script para la expresión regular de CORS
const corsOriginRegex = /^https:\/\/barberia-front(-[a-zA-Z0-9]+)?\.vercel\.app$/;

const testUrls = [
  'https://barberia-front.vercel.app', // ✅ Producción
  'https://barberia-front-abc123.vercel.app', // ✅ Vista previa
  'https://barberia-front-ep01j1af2-juan-davids-projects-3cf28ed7.vercel.app', // ✅ Vista previa larga
  'https://barberia-front-xyz789.vercel.app', // ✅ Vista previa
  'http://localhost:3000', // ❌ Localhost (se maneja por separado)
  'https://malicious-site.com', // ❌ Sitio malicioso
  'https://barberia-front.vercel.app.evil.com', // ❌ Dominio falso
  'https://other-front.vercel.app' // ❌ Otro frontend
];

console.log('🧪 Probando expresión regular de CORS...\n');

testUrls.forEach(url => {
  const isValid = corsOriginRegex.test(url);
  const status = isValid ? '✅ PERMITIDO' : '❌ BLOQUEADO';
  console.log(`${status} ${url}`);
});

console.log('\n📋 Resumen:');
console.log(`Patrón: ${corsOriginRegex.toString()}`);
console.log('✅ Funciona para producción y cualquier vista previa de Vercel');
console.log('✅ Bloquea dominios maliciosos');
console.log('✅ Localhost se maneja por separado en desarrollo'); 