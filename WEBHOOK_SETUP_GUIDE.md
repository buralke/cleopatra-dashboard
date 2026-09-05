# 🚀 WhatsApp Webhook & Canlı Sohbet Kurulum Rehberi

Bu rehber, geliştirdiğimiz Node.js Webhook Sunucusunu çalıştırma, Meta Developer Console'a bağlama ve Chrome Eklentisi Dashboard'u üzerinden canlı çift yönlü WhatsApp mesajlaşmasını aktif etme adımlarını içerir.

---

## 🛠️ 1. Adım: Webhook Sunucusunu Çalıştırma

Proje klasörünüzde herhangi bir bağımlılık kurmanıza gerek kalmadan (saf Node.js ile hazırlanmıştır) komut satırında şu komutu çalıştırın:

```bash
node webhook-server.js
```

Başarılı şekilde çalıştığında terminalde şu çıktıyı göreceksiniz:

```text
=====================================================
🚀 WhatsApp Webhook Sunucusu Başlatıldı!
📍 Port: http://localhost:3000
🔑 Verify Token: my_secure_token_123
📩 Webhook URL: http://localhost:3000/webhook
=====================================================
```

---

## 🌐 2. Adım: İnternete Açma (ngrok veya Vercel/Render)

Meta sunucularının bilgisayarınızdaki `http://localhost:3000` adresine ulaşabilmesi için güvenli bir HTTPS tüneli açmanız gerekir:

1. **ngrok kullanıyorsanız:**
   ```bash
   ngrok http 3000
   ```
2. Çıktıdaki HTTPS URL'sini kopyalayın (Örn: `https://abcd-123.ngrok-free.app`).

---

## 📋 3. Adım: Meta Developer Console Ayarları

1. **[Meta Developer Console](https://developers.facebook.com/apps/1046986051594043/webhooks/)** sayfasına gidin.
2. Sol menüden **WhatsApp** -> **Configuration (Yapılandırma)** kısmına geçin.
3. **Edit (Düzenle)** butonuna tıklayın:
   - **Callback URL:** `https://abcd-123.ngrok-free.app/webhook` (ngrok adresiniz)
   - **Verify Token:** `my_secure_token_123`
4. **Verify and Save (Doğrula ve Kaydet)** butonuna basın.
5. Alt kısımdaki **Webhook fields (Webhook alanları)** bölümünde:
   - `messages` seçeneğinin yanındaki **Subscribe (Abone Ol)** butonunu aktif hale getirin.

---

## 💬 4. Adım: Dashboard Üzerinden Canlı Mesajlaşma

1. Chrome Eklentisi Dashboard'una (`dashboard.html`) girin.
2. WhatsApp sohbet penceresinde başlıkta **`🟢 Webhook Bağlı (Port 3000)`** rozetini göreceksiniz.
3. **Canlı Mesaj Gönderme:** Alt kısımdaki yazma alanına mesajınızı yazıp `Enter` veya `➤` butonuna bastığınızda mesaj doğrudan Meta Cloud API üzerinden alıcının WhatsApp'ına iletilir.
4. **Hızlı Şablon Gönderme:** `⚡ Şablon Gönder` butonuna tıklayarak önceden onaylı şablonlarınızı tek tıkla müşteriye gönderebilirsiniz.
5. **Gelen Mesajlar:** Müşteri yanıt verdiğinde Webhook sunucusu mesajı yakalar, veritabanına kaydeder ve Dashboard ekranında canlı olarak sohbet geçmişine ekler!
