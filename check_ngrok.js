const http = require('http');
http.get('http://localhost:4040/api/requests/http', (res) => {
  let data = '';
  res.on('data', c => data += c);
  res.on('end', () => {
    const parsed = JSON.parse(data);
    if (!parsed.requests || parsed.requests.length === 0) {
      console.log('❌ Hiç istek yok - Meta webhook POST göndermemiş!');
      return;
    }
    console.log(`\nToplam ${parsed.requests.length} istek:\n`);
    parsed.requests.forEach((r, i) => {
      console.log(`[${i+1}] ${r.request.method} ${r.request.uri} → ${r.response.status_code} | ${r.start}`);
    });
    const posts = parsed.requests.filter(r => r.request.method === 'POST' && r.request.uri === '/webhook');
    if (posts.length === 0) {
      console.log('\n❌ /webhook yoluna hiç POST isteği gelmemiş.');
      console.log('📌 Sorun: Meta Developer Console\'da messages webhook\'u subscribe edilmemiş olabilir!');
    } else {
      console.log(`\n✅ ${posts.length} adet gerçek Meta webhook POST isteği alındı.`);
    }
  });
}).on('error', e => console.log('ngrok API hatası:', e.message));
