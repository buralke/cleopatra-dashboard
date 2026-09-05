const http = require('http');
const https = require('https');

console.log('=== WEBHOOK DURUM KONTROL ===\n');

// 1. Webhook sunucusu çalışıyor mu?
const serverCheck = new Promise((resolve) => {
  const req = http.get('http://localhost:3000/api/messages?since=0', (res) => {
    let data = '';
    res.on('data', c => data += c);
    res.on('end', () => {
      try {
        const parsed = JSON.parse(data);
        const incoming = parsed.messages.filter(m => m.direction === 'incoming');
        console.log('✅ 1. Webhook Sunucusu: ÇALIŞIYOR (localhost:3000)');
        console.log(`   Toplam kayıtlı mesaj: ${parsed.count}`);
        console.log(`   Gelen (incoming) mesaj: ${incoming.length}`);
        if (incoming.length > 0) {
          const last = incoming[incoming.length - 1];
          console.log(`   Son gelen: "${last.text}" | ${last.from} | ${new Date(last.timestamp).toLocaleTimeString('tr-TR')}`);
        }
        resolve(true);
      } catch(e) {
        console.log('❌ 1. Webhook Sunucusu: JSON parse hatası');
        resolve(false);
      }
    });
  });
  req.on('error', () => {
    console.log('❌ 1. Webhook Sunucusu: ÇALIŞMIYOR (localhost:3000 yanıt vermiyor)');
    resolve(false);
  });
  req.setTimeout(3000, () => { req.destroy(); resolve(false); });
});

// 2. ngrok çalışıyor mu?
const ngrokCheck = new Promise((resolve) => {
  const req = http.get('http://localhost:4040/api/tunnels', (res) => {
    let data = '';
    res.on('data', c => data += c);
    res.on('end', () => {
      try {
        const parsed = JSON.parse(data);
        const tunnel = parsed.tunnels && parsed.tunnels[0];
        if (tunnel) {
          console.log(`✅ 2. ngrok Tüneli: ÇALIŞIYOR`);
          console.log(`   Canlı URL: ${tunnel.public_url}`);
          console.log(`   Webhook URL: ${tunnel.public_url}/webhook`);
          resolve(tunnel.public_url);
        } else {
          console.log('❌ 2. ngrok Tüneli: Aktif tünel bulunamadı');
          resolve(null);
        }
      } catch(e) {
        console.log('❌ 2. ngrok Tüneli: ÇALIŞMIYOR (port 4040 yanıt vermiyor)');
        resolve(null);
      }
    });
  });
  req.on('error', () => {
    console.log('❌ 2. ngrok Tüneli: ÇALIŞMIYOR');
    resolve(null);
  });
  req.setTimeout(3000, () => { req.destroy(); resolve(null); });
});

// 3. ngrok'a gelen Meta POST isteklerini kontrol et
const postCheck = new Promise((resolve) => {
  const req = http.get('http://localhost:4040/api/requests/http', (res) => {
    let data = '';
    res.on('data', c => data += c);
    res.on('end', () => {
      try {
        const parsed = JSON.parse(data);
        const requests = parsed.requests || [];
        const metaPosts = requests.filter(r => 
          r.request.method === 'POST' && 
          r.request.uri === '/webhook'
        );
        const metaGets = requests.filter(r => 
          r.request.method === 'GET' && 
          r.request.uri.includes('/webhook')
        );
        
        console.log(`\n✅ 3. ngrok İstek Geçmişi:`);
        console.log(`   Meta webhook doğrulama (GET): ${metaGets.length} adet`);
        console.log(`   Meta mesaj iletimi (POST): ${metaPosts.length} adet`);
        
        if (metaPosts.length === 0) {
          console.log('\n⚠️  META HENÜZ HİÇ MESAJ POST\'U GÖNDERMEMİŞ!');
          console.log('   Olası sebepler:');
          console.log('   - messages webhook\'u Subscribe edilmemiş');
          console.log('   - Uygulama development modunda, test numarası eklenmemiş');
          console.log('   - Farklı bir webhook URL\'si kayıtlı olabilir');
        } else {
          console.log(`\n✅ Meta ${metaPosts.length} adet gerçek mesaj göndermiş!`);
          const last = metaPosts[metaPosts.length - 1];
          console.log(`   Son POST: ${last.start} - Status: ${last.response.status_code}`);
        }
        resolve(metaPosts.length);
      } catch(e) {
        console.log('❌ 3. ngrok istek geçmişi okunamadı');
        resolve(0);
      }
    });
  });
  req.on('error', () => {
    console.log('❌ 3. ngrok API erişilemiyor');
    resolve(0);
  });
  req.setTimeout(3000, () => { req.destroy(); resolve(0); });
});

Promise.all([serverCheck, ngrokCheck, postCheck]).then(() => {
  console.log('\n=============================');
  console.log('Kontrol tamamlandı.');
});
