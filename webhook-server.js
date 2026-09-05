/**
 * WhatsApp Cloud API Webhook Server & Dashboard Proxy
 * Pure Node.js implementation (Zero external dependencies required!)
 *
 * Usage:
 *   node webhook-server.js
 *
 * Default Port: 3000
 * Webhook Verification Token: my_secure_token_123
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const PORT = process.env.PORT || 3000;
const VERIFY_TOKEN = process.env.VERIFY_TOKEN || 'cleopatra_wh_9f8a7c6b5a4d3e2f1a0b9c8d7e6f5a4b';
const DB_FILE = path.join(__dirname, 'webhook-messages.json');
const BOT_RULES_FILE = path.join(__dirname, 'auto-reply-rules.json');
const USER_LANGS_FILE = path.join(__dirname, 'user-languages.json');

// In-memory data store
let messageStore = [];
let statusStore = {};
let userLanguageStore = {};
let webhookStats = {
  totalEventsReceived: 0,
  lastEventTime: null,
  lastEventType: null,
  verifyAttempts: 0,
  lastVerifyTime: null,
  lastVerifySuccess: null,
  serverStartTime: Date.now()
};

let botRulesStore = {
  enabled: true,
  metaPhoneId: process.env.META_PHONE_ID || '1259356973928757',
  metaToken: process.env.META_TOKEN || 'EAAO4OmZBwpzsBSGfHh9ozCJOJuu8XjDwfiWqPIKzyj3yHkgdd43JykeBiZCoZAvQBFEbrbcoLcxs82PZAELYKo8iLT5OFuboIWd4Q0swS5aSDfYJjk7EW8SeHeHaVYdvEOsMqJCHJo87MuFZAZBIZCIZBTW2pQDJAIniAmNyFWWZAOlZBD4jWLgDgV8JFkBjaUwdTu4QZDZD',
  welcomeMessage: {
    enabled: true,
    text: "Merhaba! Cleopatra Ink Studio'ya hoş geldiniz. 🎨 Size nasıl yardımcı olabiliriz? (Dövme fiyatı, randevu saatleri veya stüdyo konumu hakkında bilgi alabilirsiniz.)",
    cooldownHours: 24
  },
  rules: []
};

// Load persisted messages if exists
if (fs.existsSync(DB_FILE)) {
  try {
    const raw = fs.readFileSync(DB_FILE, 'utf8');
    messageStore = JSON.parse(raw);
    console.log(`[DB] ${messageStore.length} adet geçmiş mesaj veritabanından yüklendi.`);
  } catch (e) {
    console.error('[DB Error] Veritabanı okunamadı:', e.message);
  }

  // (moved) Media Upload Proxy is implemented in the main request handler below
}

// Load bot rules if exists
if (fs.existsSync(BOT_RULES_FILE)) {
  try {
    const raw = fs.readFileSync(BOT_RULES_FILE, 'utf8');
    const parsed = JSON.parse(raw);
    botRulesStore = { ...botRulesStore, ...parsed };
    console.log(`[BOT] ${botRulesStore.rules ? botRulesStore.rules.length : 0} adet otomatik yanıt kuralı yüklendi.`);
  } catch (e) {
    console.error('[BOT Error] Bot kuralları okunamadı:', e.message);
  }
}

// Load user languages store if exists
if (fs.existsSync(USER_LANGS_FILE)) {
  try {
    const raw = fs.readFileSync(USER_LANGS_FILE, 'utf8');
    userLanguageStore = JSON.parse(raw);
    console.log(`[BOT] ${Object.keys(userLanguageStore).length} adet kullanıcı dili hafızadan yüklendi.`);
  } catch (e) {
    console.error('[BOT Error] Kullanıcı dilleri okunamadı:', e.message);
  }
}

function saveDB() {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(messageStore.slice(-500), null, 2), 'utf8');
  } catch (e) {
    console.error('[DB Error] Veritabanı kaydedilemedi:', e.message);
  }
}

function saveBotRules() {
  try {
    fs.writeFileSync(BOT_RULES_FILE, JSON.stringify(botRulesStore, null, 2), 'utf8');
    console.log('[BOT] Otomatik yanıt kuralları kaydedildi.');
  } catch (e) {
    console.error('[BOT Error] Bot kuralları kaydedilemedi:', e.message);
  }
}

function saveUserLanguages() {
  try {
    fs.writeFileSync(USER_LANGS_FILE, JSON.stringify(userLanguageStore, null, 2), 'utf8');
  } catch (e) {
    console.error('[BOT Error] Kullanıcı dilleri kaydedilemedi:', e.message);
  }
}

function generateCustomerCode() {
  const p1 = Math.floor(100 + Math.random() * 900);
  const p2 = Math.floor(10 + Math.random() * 90);
  return `RC-${p1}-${p2}`;
}

function formatReservationRedirectUrl(text, countryCode = 'tr') {
  if (!text || !text.includes('wa.me/905524278949')) return text;

  const ticketCode = generateCustomerCode();

  let prefilledText = '';
  switch (countryCode) {
    case 'de':
      prefilledText = `Hallo, ich möchte einen Tattoo-Termin vereinbaren.\n\n📌 Kundennummer: ${ticketCode}\n(⚠️ HINWEIS: Bitte diese Kundennummer und den Nachrichtentext nicht ändern.)`;
      break;
    case 'nl':
      prefilledText = `Hallo, ik wil graag een tatoeage-afspraak maken.\n\n📌 Klantnummer: ${ticketCode}\n(⚠️ WAARSCHUWING: Wijzig dit klantnummer en de berichttekst a.u.b. niet.)`;
      break;
    case 'en':
      prefilledText = `Hello, I would like to book a tattoo appointment.\n\n📌 Customer ID: ${ticketCode}\n(⚠️ WARNING: Please do not edit or remove this customer ID number.)`;
      break;
    case 'ru':
      prefilledText = `Здравствуйте, хочу записаться на сеанс тату.\n\n📌 Номер клиента: ${ticketCode}\n(⚠️ ВНИМАНИЕ: Пожалуйста, не изменяйте и не удаляйте этот номер клиента.)`;
      break;
    case 'tr':
    default:
      prefilledText = `Merhaba, dövme rezervasyonu yaptırmak istiyorum.\n\n📌 Müşteri Numarası: ${ticketCode}\n(⚠️ UYARI: Lütfen bu müşteri numarasını ve mesaj içeriğini değiştirmeden gönderiniz.)`;
      break;
  }

  const encodedPrefilled = encodeURIComponent(prefilledText);
  return text.replace(/https:\/\/wa\.me\/905524278949\?text=[^\s\n]+/g, `https://wa.me/905524278949?text=${encodedPrefilled}`);
}

// --- BOT AUTO-REPLY ENGINE ---
function sendAutoReply(toPhone, replyText, ruleName, locationData = null, buttons = null, countryCode = 'tr') {
  return new Promise((resolve) => {
    const phoneId = botRulesStore.metaPhoneId || '1259356973928757';
    const token = botRulesStore.metaToken || 'EAAO4OmZBwpzsBSGfHh9ozCJOJuu8XjDwfiWqPIKzyj3yHkgdd43JykeBiZCoZAvQBFEbrbcoLcxs82PZAELYKo8iLT5OFuboIWd4Q0swS5aSDfYJjk7EW8SeHeHaVYdvEOsMqJCHJo87MuFZAZBIZCIZBTW2pQDJAIniAmNyFWWZAOlZBD4jWLgDgV8JFkBjaUwdTu4QZDZD';

    const cleanTo = String(toPhone).replace(/\D/g, '');
    if (!phoneId || !token || !cleanTo) {
      console.error('[BOT ERROR] Eksik parametreler.');
      resolve(false);
      return;
    }

    let formattedReplyText = formatReservationRedirectUrl(String(replyText || '').trim(), countryCode);

    if (formattedReplyText.includes('wa.me/905524278949') || /randevu|rezervasyon|termin|afspraak|book|запись/i.test(ruleName || '')) {
      if (!botRulesStore.reservationAnalytics) botRulesStore.reservationAnalytics = [];
      const flags = { tr: '🇹🇷', de: '🇩🇪', nl: '🇳🇱', en: '🇬🇧', ru: '🇷🇺' };
      const names = { tr: 'Türkçe (+90)', de: 'Almanca (+49)', nl: 'Felemenkçe (+31)', en: 'İngilizce / Diğer', ru: 'Rusça (+7)' };
      botRulesStore.reservationAnalytics.unshift({
        id: `res_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
        timestamp: Date.now(),
        fromPhone: cleanTo,
        countryCode: countryCode,
        countryName: names[countryCode] || 'Diğer',
        flag: flags[countryCode] || '🌐',
        ruleName: ruleName
      });
      if (botRulesStore.reservationAnalytics.length > 500) {
        botRulesStore.reservationAnalytics = botRulesStore.reservationAnalytics.slice(0, 500);
      }
      saveBotRules();
      console.log(`📊 [ANALYTICS] Rezervasyon Tıklaması Kaydedildi: ${flags[countryCode] || '🌐'} ${cleanTo}`);
    }

    const metaUrl = `https://graph.facebook.com/v20.0/${phoneId}/messages`;

    let payloadObject;
    const urlMatch = formattedReplyText.match(/https?:\/\/[^\s\n]+/);

    if (buttons && Array.isArray(buttons) && buttons.length > 0) {
      payloadObject = {
        messaging_product: 'whatsapp',
        to: cleanTo,
        type: 'interactive',
        interactive: {
          type: 'button',
          body: { text: formattedReplyText },
          action: {
            buttons: buttons.slice(0, 3).map((btn, idx) => ({
              type: 'reply',
              reply: {
                id: btn.id || `btn_${idx}`,
                title: (btn.title || 'Seçenek').slice(0, 20)
              }
            }))
          }
        }
      };
    } else if (urlMatch) {
      const foundUrl = urlMatch[0];
      let btnLabel = '🔗 Linki Aç';
      if (foundUrl.includes('wa.me')) {
        btnLabel = {
          de: '📲 Termin buchen',
          nl: '📲 Afspraak maken',
          en: '📲 Book Appointment',
          ru: '📲 Записаться',
          tr: '📲 Rezervasyon Yap'
        }[countryCode] || '📲 Rezervasyon Yap';
      } else if (foundUrl.includes('google.com/maps') || foundUrl.includes('maps')) {
        btnLabel = {
          de: '🗺️ Karte Öffnen',
          nl: '🗺️ Open in Maps',
          en: '🗺️ Open Map',
          ru: '🗺️ Открыть карту',
          tr: '🗺️ Haritada Gör'
        }[countryCode] || '🗺️ Haritada Gör';
      }

      let cleanBodyText = formattedReplyText.replace(foundUrl, '').replace(/📲\s*$/gm, '').replace(/🗺️\s*$/gm, '').trim();

      payloadObject = {
        messaging_product: 'whatsapp',
        to: cleanTo,
        type: 'interactive',
        interactive: {
          type: 'cta_url',
          body: { text: cleanBodyText || formattedReplyText },
          action: {
            name: 'cta_url',
            parameters: {
              display_text: btnLabel.slice(0, 20),
              url: foundUrl
            }
          }
        }
      };
    } else if (locationData && locationData.latitude && locationData.longitude) {
      payloadObject = {
        messaging_product: 'whatsapp',
        to: cleanTo,
        type: 'location',
        location: {
          latitude: locationData.latitude,
          longitude: locationData.longitude,
          name: locationData.name || 'Stüdyo Konumu',
          address: locationData.address || formattedReplyText
        }
      };
    } else {
      payloadObject = {
        messaging_product: 'whatsapp',
        to: cleanTo,
        type: 'text',
        text: {
          preview_url: true,
          body: formattedReplyText
        }
      };
    }

    const postData = JSON.stringify(payloadObject);

    const options = {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const metaReq = require('https').request(metaUrl, options, (metaRes) => {
      let resBody = '';
      metaRes.on('data', c => { resBody += c; });
      metaRes.on('end', () => {
        if (metaRes.statusCode >= 200 && metaRes.statusCode < 300) {
          console.log(`✅ [BOT AUTO-REPLY] [${ruleName}] -> ${cleanTo}`);
          resolve(true);
        } else if (payloadObject.type === 'interactive' && payloadObject.interactive && payloadObject.interactive.type === 'cta_url') {
          console.warn(`[BOT WARN] cta_url button API error (${metaRes.statusCode}), retrying with standard text mode...`);
          const fbPayload = {
            messaging_product: 'whatsapp',
            to: cleanTo,
            type: 'text',
            text: { preview_url: true, body: formattedReplyText }
          };
          const fbData = JSON.stringify(fbPayload);
          const fbReq = require('https').request(metaUrl, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
              'Content-Length': Buffer.byteLength(fbData)
            }
          }, (fbRes) => {
            if (fbRes.statusCode >= 200 && fbRes.statusCode < 300) {
              console.log(`✅ [BOT AUTO-REPLY FALLBACK TEXT] [${ruleName}] -> ${cleanTo}`);
              resolve(true);
            } else {
              console.error(`❌ [BOT ERROR] Meta Fallback API (${fbRes.statusCode})`);
              resolve(false);
            }
          });
          fbReq.on('error', () => resolve(false));
          fbReq.write(fbData);
          fbReq.end();
        } else {
          console.error(`❌ [BOT ERROR] Meta API (${metaRes.statusCode}): ${resBody}`);
          resolve(false);
        }
      });
    });

    metaReq.on('error', (err) => {
      console.error('[BOT ERROR] İstek Hatası:', err.message);
      resolve(false);
    });

    metaReq.write(postData);
    metaReq.end();
  });
}

function normalizeText(str) {
  if (!str) return '';
  return String(str)
    .toLowerCase()
    .replace(/İ/g, 'i')
    .replace(/I/g, 'ı')
    .replace(/ı/g, 'i')
    .replace(/ç/g, 'c')
    .replace(/ğ/g, 'g')
    .replace(/ö/g, 'o')
    .replace(/ş/g, 's')
    .replace(/ü/g, 'u')
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function normalizeTurkish(str) {
  return normalizeText(str);
}

function detectLanguageFromText(text = '', buttonId = '') {
  if (buttonId) {
    if (buttonId.endsWith('_de')) return 'de';
    if (buttonId.endsWith('_nl')) return 'nl';
    if (buttonId.endsWith('_en')) return 'en';
    if (buttonId.endsWith('_ru')) return 'ru';
    if (buttonId.endsWith('_tr')) return 'tr';
  }

  if (!text) return null;
  const rawLower = String(text).toLowerCase().trim();
  const norm = normalizeText(text);

  // 1. German (de)
  if (/\b(guten tag|guten morgen|guten abend|wie viel|preis|kosten|termin|buchen|anfahrt|öffnungszeiten|offnungszeiten|danke|vielen dank|bitte|auf wiedersehen|tätowierung|tattookosten|wieviel|wo ist|tattoo-info|tattoo info|adresse & ort|termin buchen)\b/i.test(rawLower) ||
    /\b(guten tag|guten morgen|guten abend|wie viel|preis|kosten|termin|buchen|anfahrt|offnungszeiten|danke|vielen dank|bitte|auf wiedersehen|tattoo info|adresse ort|termin buchen)\b/i.test(norm)) {
    return 'de';
  }

  // 2. Dutch (nl)
  if (/\b(goedemorgen|goedemiddag|goedenavond|afspraak|boeken|prijsopgave|hoeveel|openingstijden|alstublieft|bedankt|dankjewel|dank je|locatie|waar is|wat kost|tatoeage|adres & locatie|afspraak maken)\b/i.test(rawLower) ||
    /\b(goedemorgen|goedemiddag|goedenavond|afspraak|boeken|prijsopgave|hoeveel|openingstijden|alstublieft|bedankt|dankjewel|locatie|adres locatie|afspraak maken)\b/i.test(norm)) {
    return 'nl';
  }

  // 3. English (en)
  if (/\b(hello|good morning|good afternoon|good evening|how much|price|cost|appointment|booking|location|address|thank you|thanks|where is|opening hours|tattoo cost|location & address|book appointment)\b/i.test(rawLower) ||
    /\b(hello|good morning|good afternoon|good evening|how much|price|cost|appointment|booking|location|address|thank you|thanks|location address|book appointment)\b/i.test(norm)) {
    return 'en';
  }

  // 4. Russian (ru)
  if (/[а-яА-ЯёЁ]/.test(text) || /\b(привет|здравствуйте|добрый день|цена|стоимость|сколько стоит|запись|адрес|где|спасибо|о татуировках|адрес и локация|записаться)\b/i.test(rawLower)) {
    return 'ru';
  }

  // 5. Turkish (tr)
  if (/\b(merhaba|selam|selamlar|iyi gunler|iyi günler|günaydın|gunaydin|iyi akşamlar|iyi aksamlar|fiyat|fiyatı|ücret|ücreti|kac para|kaç para|ne kadar|randevu|adres|tesekkurler|tesekkur|teşekkürler|kolay gelsin|nerede|saatleri|dövme bilgisi|dovme bilgisi|adres & konum|rezervasyon yap)\b/i.test(rawLower) ||
    /\b(merhaba|selam|selamlar|iyi gunler|gunaydin|iyi aksamlar|fiyat|fiyati|ucret|ucreti|kac para|ne kadar|randevu|adres|tesekkurler|tesekkur|kolay gelsin|nerede|dovme bilgisi|adres konum|rezervasyon yap)\b/i.test(norm)) {
    return 'tr';
  }

  if (norm === 'hallo') return 'de_or_nl';

  return null;
}

function detectLanguageFromPhone(phone) {
  const clean = String(phone).replace(/\D/g, '');
  if (clean.startsWith('90')) return 'tr';
  if (clean.startsWith('31')) return 'nl';
  if (clean.startsWith('49') || clean.startsWith('43') || clean.startsWith('41')) return 'de';
  if (clean.startsWith('7') || clean.startsWith('375') || clean.startsWith('380') || clean.startsWith('996') || clean.startsWith('998')) return 'ru';
  if (clean.startsWith('33')) return 'fr';
  if (clean.startsWith('39')) return 'it';
  if (clean.startsWith('34')) return 'es';
  return 'en';
}

function resolveUserLanguage(phone, text = '', buttonId = '') {
  const cleanPhone = String(phone).replace(/\D/g, '');
  const stored = userLanguageStore[cleanPhone];

  // Explicit text language detection
  const textLang = detectLanguageFromText(text, buttonId);

  if (textLang && textLang !== 'de_or_nl') {
    userLanguageStore[cleanPhone] = { code: textLang, updatedAt: Date.now(), source: 'text' };
    saveUserLanguages();
    return textLang;
  }

  if (textLang === 'de_or_nl') {
    if (stored && (stored.code === 'nl' || stored.code === 'de')) return stored.code;
    const phoneLang = detectLanguageFromPhone(cleanPhone);
    const finalLang = (phoneLang === 'nl') ? 'nl' : 'de';
    userLanguageStore[cleanPhone] = { code: finalLang, updatedAt: Date.now(), source: 'text_hallo' };
    saveUserLanguages();
    return finalLang;
  }

  // Session Continuity: Use existing stored user language
  if (stored && stored.code) {
    return stored.code;
  }

  // Fallback to phone country code if new user
  const fallback = detectLanguageFromPhone(cleanPhone);
  userLanguageStore[cleanPhone] = { code: fallback, updatedAt: Date.now(), source: 'phone_fallback' };
  saveUserLanguages();
  return fallback;
}

function getCountryLangInfo(langCode) {
  const langMap = {
    tr: { code: 'tr', name: 'Türkçe', flag: '🇹🇷' },
    de: { code: 'de', name: 'Deutsch (Almanca)', flag: '🇩🇪' },
    nl: { code: 'nl', name: 'Nederlands (Felemenkçe)', flag: '🇳🇱' },
    ru: { code: 'ru', name: 'Русский (Rusça)', flag: '🇷🇺' },
    en: { code: 'en', name: 'English (İngilizce)', flag: '🇬🇧' },
    fr: { code: 'fr', name: 'Français (Fransızca)', flag: '🇫🇷' },
    es: { code: 'es', name: 'Español (İspanyolca)', flag: '🇪🇸' },
    it: { code: 'it', name: 'Italiano (İtalyanca)', flag: '🇮🇹' }
  };
  return langMap[langCode] || langMap.tr;
}

function detectCountryLanguage(phone, text = '', buttonId = '') {
  const langCode = resolveUserLanguage(phone, text, buttonId);
  return getCountryLangInfo(langCode);
}

const defaultLanguagePacks = {
  tr: {
    text: "Merhaba! Cleopatra Ink Studio'ya hoş geldiniz. 🎨\n\nAşağıdaki butonlardan öğrenmek istediğiniz konuyu tek tıkla seçebilirsiniz:",
    buttons: [
      { title: "🎨 Dövme Bilgisi", id: "btn_fiyat_tr", replyText: "🎨 Dövme fiyatlarımız tasarımın boyutu, detay seviyesi ve yapılacağı bölgeye göre belirlenmektedir." },
      { title: "📍 Adres & Konum", id: "btn_adres_tr", replyText: "📍 Cleopatra Ink Studio Manavgat\n\n🏢 Adres: Gündoğdu, 110 Evler Sitesi, Manavgat/Antalya\n\n🗺️ Google Haritalar:\nhttps://www.google.com/maps/search/?api=1&query=G%C3%BCndo%C4%9Fdu,+110+Evler+Sitesi,+Manavgat+Antalya" },
      { title: "📅 Rezervasyon", id: "btn_randevu_tr", replyText: "📅 Randevu almak için aşağıdaki direkt WhatsApp hattımıza tıklayabilirsiniz:\n\n📲 https://wa.me/905524278949?text=Merhaba,%20d%C3%B6vme%20rezervasyonu%20yapt%C4%B1rmak%20istiyorum.%20(Reconnect%20taraf%C4%B1ndan%20geliyorum)\n\n📞 Telefon: +90 552 427 89 49" }
    ]
  },
  nl: { // Felemenkçe (+31 Hollanda)
    text: "Welkom bij Cleopatra Ink Studio! 🎨\n\nKies een van de onderstaande opties:",
    buttons: [
      { title: "🎨 Tattoo Info", id: "btn_fiyat_nl", replyText: "🎨 Onze tatoeageprijzen zijn afhankelijk van de grootte, het detailniveau en de plaatsing. Stuur ons gerust uw ontwerp voor een prijsopgave!" },
      { title: "📍 Adres & Locatie", id: "btn_adres_nl", replyText: "📍 Cleopatra Ink Studio Manavgat\n\n🏢 Adres: Gündoğdu, 110 Evler Sitesi, Manavgat/Antalya\n\n🗺️ Google Maps:\nhttps://www.google.com/maps/search/?api=1&query=G%C3%BCndo%C4%9Fdu,+110+Evler+Sitesi,+Manavgat+Antalya" },
      { title: "📅 Afspraak maken", id: "btn_randevu_nl", replyText: "📅 Om een afspraak te maken via WhatsApp:\n\n📲 https://wa.me/905524278949?text=Hallo,%20ik%20wil%20graag%20een%20tatoeage-afspraak%20maken.%20(Ik%20kom%20via%20Reconnect)\n\n📞 Telefoon: +90 552 427 89 49" }
    ]
  },
  de: { // Almanca (+49 Almanya, +43 Avusturya)
    text: "Willkommen bei Cleopatra Ink Studio! 🎨\n\nBitte wählen Sie eine der folgenden Optionen:",
    buttons: [
      { title: "🎨 Tattoo-Info", id: "btn_fiyat_de", replyText: "🎨 Unsere Tattoo-Preise hängen von Größe, Detailstufe und Platzierung ab. Senden Sie uns gerne Ihr Wunschmotiv!" },
      { title: "📍 Adresse & Ort", id: "btn_adres_de", replyText: "📍 Cleopatra Ink Studio Manavgat\n\n🏢 Adresse: Gündoğdu, 110 Evler Sitesi, Manavgat/Antalya\n\n🗺️ Google Maps:\nhttps://www.google.com/maps/search/?api=1&query=G%C3%BCndo%C4%9Fdu,+110+Evler+Sitesi,+Manavgat+Antalya" },
      { title: "📅 Termin buchen", id: "btn_randevu_de", replyText: "📅 Für Terminvereinbarungen per WhatsApp:\n\n📲 https://wa.me/905524278949?text=Hallo,%20ich%20moechte%20einen%20Tattoo-Termin%20vereinbaren.%20(Ich%20komme%20ueber%20Reconnect)\n\n📞 Telefon: +90 552 427 89 49" }
    ]
  },
  ru: { // Rusça (+7 Rusya, +380 Ukrayna)
    text: "Добро пожаловать в Cleopatra Ink Studio! 🎨\n\nВыберите нужный раздел из кнопок ниже:",
    buttons: [
      { title: "🎨 О татуировках", id: "btn_fiyat_ru", replyText: "🎨 Цены на татуировки зависят от размера, сложности детализации и места нанесения. Отправьте нам ваш эскиз!" },
      { title: "📍 Адрес и локация", id: "btn_adres_ru", replyText: "📍 Cleopatra Ink Studio Manavgat\n\n🏢 Адрес: Gündoğdu, 110 Evler Sitesi, Manavgat/Antalya\n\n🗺️ Google Карты:\nhttps://www.google.com/maps/search/?api=1&query=G%C3%BCndo%C4%9Fdu,+110+Evler+Sitesi,+Manavgat+Antalya" },
      { title: "📅 Записаться", id: "btn_randevu_ru", replyText: "📅 Для записи на сеанс WhatsApp:\n\n📲 https://wa.me/905524278949?text=%D0%97%D0%B4%D1%80%D0%B0%D0%B2%D1%81%D1%82%D0%B2%D1%83%D0%B9%D1%82%D0%B5,%20%D1%8F%20%D1%85%D0%BE%D1%87%D1%83%20%D0%B7%D0%B0%D0%BF%D0%B8%D1%81%D0%B0%D1%82%D1%8C%D1%81%D1%8F%20%D0%BD%D0%B0%20%D1%81%D0%B5%D0%B0%D0%BD%D1%81%20%D1%82%D0%B0%D1%82%D1%83.%20(%D0%AF%20%D0%BE%D1%82%20Reconnect)\n\n📞 Телефон: +90 552 427 89 49" }
    ]
  },
  en: { // İngilizce (Diğer tüm ülkeler)
    text: "Welcome to Cleopatra Ink Studio! 🎨\n\nPlease select an option from the buttons below:",
    buttons: [
      { title: "🎨 Tattoo Info", id: "btn_fiyat_en", replyText: "🎨 Tattoo prices depend on size, detail level, and placement. Feel free to send us your design for a quick quote!" },
      { title: "📍 Location & Address", id: "btn_adres_en", replyText: "📍 Cleopatra Ink Studio Manavgat\n\n🏢 Address: Gündoğdu, 110 Evler Sitesi, Manavgat/Antalya\n\n🗺️ Google Maps:\nhttps://www.google.com/maps/search/?api=1&query=G%C3%BCndo%C4%9Fdu,+110+Evler+Sitesi,+Manavgat+Antalya" },
      { title: "📅 Book Appointment", id: "btn_randevu_en", replyText: "📅 For appointment bookings via WhatsApp:\n\n📲 https://wa.me/905524278949?text=Hello,%20I%20would%20like%20to%20book%20a%20tattoo%20appointment.%20(Coming%20from%20Reconnect)\n\n📞 Phone: +90 552 427 89 49" }
    ]
  }
};

const multiLangRules = [
  {
    id: "rule_greetings_multilang",
    name: "Karşılama & Selamlaşma (Greetings)",
    keywordsByLang: {
      de: ["hallo", "guten tag", "hi", "hey", "moin", "servus", "grüss gott", "guten morgen", "guten abend"],
      en: ["hello", "hi", "hey", "good morning", "good afternoon", "good evening", "greetings"],
      nl: ["hallo", "hoi", "heej", "goedemorgen", "goedemiddag", "goedenavond", "dag"],
      tr: ["merhaba", "selam", "selamlar", "iyi gunler", "sa", "mrb", "slm", "günaydın", "iyi akşamlar"],
      ru: ["привет", "здравствуйте", "добрый день", "доброе утро", "добрый вечер", "хай"],
      fr: ["bonjour", "salut", "coucou"],
      es: ["hola", "buenas", "buenos dias"],
      it: ["ciao", "buongiorno", "salve"]
    },
    replies: {
      de: "Willkommen bei Cleopatra Ink Studio! 🎨 Wie können wir Ihnen helfen? Bitte wählen Sie eine der folgenden Optionen:",
      en: "Welcome to Cleopatra Ink Studio! 🎨 How can we help you today? Please select an option below:",
      nl: "Welkom bij Cleopatra Ink Studio! 🎨 Hoe kunnen we u vandaag helpen? Kies een van de onderstaande opties:",
      tr: "Merhaba! Cleopatra Ink Studio'ya hoş geldiniz. 🎨 Size nasıl yardımcı olabiliriz? Aşağıdaki butonlardan seçim yapabilirsiniz:",
      ru: "Добро пожаловать в Cleopatra Ink Studio! 🎨 Чем мы можем вам помочь? Выберите нужный раздел ниже:",
      fr: "Bienvenue au Cleopatra Ink Studio ! 🎨 Comment pouvons-nous vous aider aujourd'hui ?",
      es: "¡Bienvenido a Cleopatra Ink Studio! 🎨 ¿Cómo podemos ayudarte hoy?",
      it: "Benvenuto a Cleopatra Ink Studio! 🎨 Come possiamo aiutarti oggi?"
    },
    buttonsByLang: {
      de: defaultLanguagePacks.de.buttons,
      en: defaultLanguagePacks.en.buttons,
      nl: defaultLanguagePacks.nl.buttons,
      tr: defaultLanguagePacks.tr.buttons,
      ru: defaultLanguagePacks.ru.buttons
    }
  },
  {
    id: "rule_price_multilang",
    name: "Dövme Fiyatı & Tasarım Bilgisi",
    keywordsByLang: {
      en: ["price", "cost", "how much", "quote", "pricing", "rate", "tattoo cost", "how much for"],
      de: ["preis", "kosten", "wie viel", "angebot", "tattoo preis", "preisliste", "wie viel kostet"],
      nl: ["prijs", "kosten", "hoeveel", "offerte", "prijsopgave", "tattoo prijs", "wat kost"],
      tr: ["fiyat", "ucret", "kac para", "teklif", "maliyet", "dovme fiyati", "ne kadar"],
      ru: ["цена", "стоимость", "сколько стоит", "прайс", "эскиз", "расчет"]
    },
    replies: {
      en: "🎨 **Cleopatra Ink Studio - Tattoo Pricing Information**\n\nOur tattoo prices depend on:\n1. Size (in cm or inches)\n2. Detail complexity & color vs blackwork\n3. Placement on the body\n\n💬 Send us your reference image and desired placement, and our team will give you a custom price quote!",
      de: "🎨 **Cleopatra Ink Studio - Tattoo Preisauskunft**\n\nUnsere Tattookosten richten sich nach:\n1. Größe (in cm)\n2. Detaillierungsgrad & Farbe/Blackwork\n3. Körperstelle\n\n💬 Senden Sie uns gerne Ihr Wunschmotiv und die Körperstelle für einen genauen Kostenvoranschlag!",
      nl: "🎨 **Cleopatra Ink Studio - Tattoo Prijsinformatie**\n\nOnze tatoeageprijzen zijn afhankelijk van:\n1. Formaat (in cm)\n2. Detailniveau & kleur/blackwork\n3. Plaatsing op het lichaam\n\n💬 Stuur ons gerust uw ontwerp en gewenste plaatsing voor een vrijblijvende prijsopgave!",
      tr: "🎨 **Cleopatra Ink Studio - Dövme Fiyat Bilgisi**\n\nDövme fiyatlarımız şu kriterlere göre belirlenmektedir:\n1. Tasarımın boyutu (cm)\n2. Detay seviyesi ve renk durumu\n3. Yapılacağı vücut bölgesi\n\n💬 Aklınızdaki görseli ve yapılmasını istediğiniz bölgeyi iletirseniz tasarımcılarımız size özel fiyat bilgisi verecektir!",
      ru: "🎨 **Cleopatra Ink Studio - Информация о стоимости**\n\nСтоимость татуировки зависит от:\n1. Размера (в см)\n2. Сложности детализации и стиля\n3. Места нанесения на теле\n\n💬 Отправьте нам ваш эскиз и место нанесения, и наши мастера рассчитают точную стоимость!"
    }
  },
  {
    id: "rule_location_multilang",
    name: "Adres, Konum & Çalışma Saatleri",
    keywordsByLang: {
      en: ["address", "location", "where", "map", "directions", "hours", "opening hours", "open"],
      de: ["adresse", "ort", "wo", "karte", "anfahrt", "öffnungszeiten", "uhrzeiten", "geöffnet"],
      nl: ["adres", "locatie", "waar", "kaart", "route", "openingstijden", "uren", "open"],
      tr: ["adres", "konum", "nerede", "harita", "saatler", "calisma saatleri", "yol tarifi", "acik"],
      ru: ["адрес", "где", "карта", "локация", "часы работы", "как добраться", "открыто"]
    },
    replies: {
      en: "📍 **Cleopatra Ink Studio Manavgat**\n\n🏢 **Address:** Gündoğdu, 110 Evler Sitesi, Manavgat/Antalya, Turkey\n\n⏰ **Opening Hours:** Every day from 09:00 to 23:00\n\n🗺️ **Google Maps Directions:**\nhttps://www.google.com/maps/search/?api=1&query=G%C3%BCndo%C4%9Fdu,+110+Evler+Sitesi,+Manavgat+Antalya",
      de: "📍 **Cleopatra Ink Studio Manavgat**\n\n🏢 **Adresse:** Gündoğdu, 110 Evler Sitesi, Manavgat/Antalya, Türkei\n\n⏰ **Öffnungszeiten:** Täglich von 09:00 bis 23:00 Uhr\n\n🗺️ **Google Maps Wegbeschreibung:**\nhttps://www.google.com/maps/search/?api=1&query=G%C3%BCndo%C4%9Fdu,+110+Evler+Sitesi,+Manavgat+Antalya",
      nl: "📍 **Cleopatra Ink Studio Manavgat**\n\n🏢 **Adres:** Gündoğdu, 110 Evler Sitesi, Manavgat/Antalya, Turkije\n\n⏰ **Openingstijden:** Dagelijks geopend van 09:00 tot 23:00 uur\n\n🗺️ **Google Maps Routebeschrijving:**\nhttps://www.google.com/maps/search/?api=1&query=G%C3%BCndo%C4%9Fdu,+110+Evler+Sitesi,+Manavgat+Antalya",
      tr: "📍 **Cleopatra Ink Studio Manavgat**\n\n🏢 **Adres:** Gündoğdu, 110 Evler Sitesi, Blok/Kapı No: 104-107, Manavgat/Antalya\n\n⏰ **Çalışma Saatleri:** Haftanın her günü 09:00 - 23:00\n\n🗺️ **Google Haritalar Yol Tarifi:**\nhttps://www.google.com/maps/search/?api=1&query=G%C3%BCndo%C4%9Fdu,+110+Evler+Sitesi,+Manavgat+Antalya",
      ru: "📍 **Cleopatra Ink Studio Manavgat**\n\n🏢 **Адрес:** Gündoğdu, 110 Evler Sitesi, Manavgat/Antalya, Турция\n\n⏰ **Часы работы:** Ежедневно с 09:00 до 23:00\n\n🗺️ **Открыть в Google Картах:**\nhttps://www.google.com/maps/search/?api=1&query=G%C3%BCndo%C4%9Fdu,+110+Evler+Sitesi,+Manavgat+Antalya"
    }
  },
  {
    id: "rule_booking_multilang",
    name: "Randevu & Direkt İletişim",
    keywordsByLang: {
      en: ["book", "appointment", "booking", "reservation", "contact", "phone", "whatsapp", "call"],
      de: ["termin", "buchen", "reservierung", "kontakt", "anrufen", "telefon", "whatsapp"],
      nl: ["afspraak", "boeken", "reserveren", "contact", "bellen", "telefoon", "whatsapp"],
      tr: ["randevu", "rezervasyon", "kayit", "iletisim", "ara", "telefon", "whatsapp"],
      ru: ["запись", "забронировать", "контакт", "телефон", "whatsapp", "позвонить"]
    },
    replies: {
      en: "📅 **Appointment & Direct Contact**\n\nTo schedule your session or consult directly with our studio team:\n\n📲 **WhatsApp Direct:**\nhttps://wa.me/905524278949?text=Hello,%20I%20would%20like%20to%20book%20an%20appointment\n\n📞 **Phone:** +90 552 427 89 49",
      de: "📅 **Terminvereinbarung & Kontakt**\n\nUm einen Termin zu buchen oder sich beraten zu lassen:\n\n📲 **WhatsApp Direktkontakt:**\nhttps://wa.me/905524278949?text=Hallo,%20ich%20moechte%20einen%20Termin%20buchen\n\n📞 **Telefon:** +90 552 427 89 49",
      nl: "📅 **Afspraak Maken & Direct Contact**\n\nOm een afspraak te plannen of uw vragen te stellen:\n\n📲 **WhatsApp Direct:**\nhttps://wa.me/905524278949?text=Hallo,%20ik%20wil%20graag%20een%20afspraak%20maken\n\n📞 **Telefoon:** +90 552 427 89 49",
      tr: "📅 **Randevu & İletişim Hattı**\n\nRandevu oluşturmak ve detaylı bilgi almak için yetkili ekibimizle doğrudan iletişime geçebilirsiniz:\n\n📲 **WhatsApp Hattı:**\nhttps://wa.me/905524278949?text=Merhaba,%20randevu%20hakk%C4%B1nda%20bilgi%20almak%20istiyorum\n\n📞 **Telefon:** +90 552 427 89 49",
      ru: "📅 **Запись на сеанс и контакты**\n\nДля записи или бесплатной консультации свяжитесь с нами напрямую:\n\n📲 **WhatsApp:**\nhttps://wa.me/905524278949?text=Здравствуйте,%20хочу%20записаться\n\n📞 **Телефон:** +90 552 427 89 49"
    }
  },
  {
    id: "rule_aftercare_multilang",
    name: "Dövme Bakımı & İyileşme Süreci",
    keywordsByLang: {
      en: ["aftercare", "care", "healing", "cream", "wash", "sun", "swimming", "pool"],
      de: ["pflege", "nachsorge", "heilung", "creme", "sonne", "schwimmen", "pool"],
      nl: ["verzorging", "nazorg", "genezing", "crème", "zon", "zwemmen", "zwembad"],
      tr: ["bakim", "krem", "iyilesme", "yikama", "gunes", "deniz", "havuz"],
      ru: ["уход", "заживление", "крем", "солнце", "купаться", "бассейн"]
    },
    replies: {
      en: "✨ **Cleopatra Ink - Tattoo Aftercare Guide**\n\n1. Keep protective foil on for 3-4 hours after session.\n2. Wash gently with antibacterial soap & lukewarm water.\n3. Apply thin layer of tattoo balm / Bepanthen 2-3 times daily.\n4. Avoid direct sunlight, sea water, pools, and saunas for 2 weeks.",
      de: "✨ **Cleopatra Ink - Tattoo Pflegeanleitung**\n\n1. Folie nach der Sitzung 3-4 Stunden auf der Haut lassen.\n2. Sanft mit lauwarmem Wasser und ph-neutraler Seife waschen.\n3. 2-3 mal täglich dünn Tattoo-Creme / Bepanthen auftragen.\n4. 2 Wochen Sonne, Meerwasser, Pool und Sauna meiden.",
      nl: "✨ **Cleopatra Ink - Tattoo Nazorg Instructies**\n\n1. Laat de folie na de sessie 3-4 uur op de huid zitten.\n2. Voorzichtig wassen met lauw water en milde zeep.\n3. Breng 2-3 keer per dag een dunne laag tatoeagecrème / Bepanthen aan.\n4. Vermijd 2 weken lang direct zonlicht, zeewater, zwembad en sauna.",
      tr: "✨ **Cleopatra Ink - Dövme Bakım Rehberi**\n\n1. Dövme streçini/folyosunu işlemden sonra 3-4 saat tutun.\n2. Ilık su ve hipoalerjenik sabunla nazikçe yıkayın.\n3. Günde 2-3 kez ince tabaka halinde Bepanthen/dövme kremi sürün.\n4. 2 hafta boyunca doğrudan güneş, deniz, havuz ve saunadan uzak durun.",
      ru: "✨ **Cleopatra Ink - Рекомендации по уходу за татуировкой**\n\n1. Держите защитную пленку 3-4 часа после сеанса.\n2. Промывайте теплой водой с антибактериальным мылом.\n3. Наносите крем для заживления (Бепантен) 2-3 раза в день.\n4. Избегайте солнца, моря, бассейна и сауны в течение 2 недель."
    }
  },
  {
    id: "rule_hygiene_multilang",
    name: "Hijyen & Sterilizasyon Güvencesi",
    keywordsByLang: {
      en: ["hygiene", "sterile", "clean", "needle", "safety", "health", "safe"],
      de: ["hygiene", "steril", "sauber", "nadel", "sicherheit", "gesundheit", "sicher"],
      nl: ["hygiëne", "steriel", "schoon", "naald", "veiligheid", "gezondheid", "veilig"],
      tr: ["hijyen", "steril", "temiz", "igne", "guvenlik", "saglik", "guvenli"],
      ru: ["гигиена", "стерильно", "игла", "безопасность", "здоровье"]
    },
    replies: {
      en: "🛡️ **Cleopatra Ink Hygiene & Safety Standards**\n\n• 100% Single-Use Disposable Needles & Supplies\n• Medical-grade autoclave sterilization\n• EU Certified REACH-compliant vegan inks\n• Hospital-level sanitation standards in all studios.",
      de: "🛡️ **Cleopatra Ink Hygiene- & Sicherheitsstandards**\n\n• 100% Einwegnadeln & sterile Materialien\n• Medizinische Autoklav-Sterilisation\n• EU-zertifizierte vegane Tätowierfarben (REACH)\n• Höchste Hygiene- und Medizinstandards.",
      nl: "🛡️ **Cleopatra Ink Hygiëne- & Veiligheidsnormen**\n\n• 100% Wegwerpnaalden en steriele materialen\n• Medische autoclaaf sterilisatie\n• EU REACH-gecertificeerde veganistische inkt\n• Hygiënestandaarden van ziekenhuisniveau.",
      tr: "🛡️ **Cleopatra Ink Hijyen & Güvenlik Standartları**\n\n• %100 Tek kullanımlık steril iğne ve sarf malzemeleri\n• Medikal otoklav sterilizasyon sistemi\n• AB standartlarına uygun (REACH onaylı) vegan dövme mürekkepleri\n• Hastane düzeyinde dezenfeksiyon ve hijyen garantisi.",
      ru: "🛡️ **Стандарты гигиены и безопасности Cleopatra Ink**\n\n• 100% Одноразовые стерильные иглы и расходники\n• Медицинская автоклавная стерилизация\n• Веганские красящие пигменты по стандартам ЕС\n• Полная безопасность и стерильность каждого сеанса."
    }
  }
];

async function processAutoReply(incomingMsg) {
  if (!botRulesStore.enabled) return;
  const fromPhone = String(incomingMsg.from).replace(/\D/g, '');
  const rawText = incomingMsg.text || '';
  const buttonId = incomingMsg.buttonId || '';
  const normText = normalizeTurkish(rawText);

  if (!fromPhone || (!normText && !buttonId)) return;

  const country = detectCountryLanguage(fromPhone, rawText, buttonId);

  // 0. OPT-OUT & OPT-IN HANDLER (DUR / STOP / İPTAL / BAŞLAT / START)
  if (!botRulesStore.optOutList) botRulesStore.optOutList = [];
  const isOptedOut = botRulesStore.optOutList.includes(fromPhone);

  const optOutKeywords = ['dur', 'durdur', 'stop', 'unsubscribe', 'stoppen', 'halt', 'iptal', 'отписаться', 'стоп', 'abbrechen', 'opt_out', 'optout', 'cikis', 'çıkış', 'marketing_opt_out'];
  const optInKeywords = ['baslat', 'başlat', 'start', 'anmelden', 'старт', 'opt_in', 'optin', 'tekrar baslat', 'katil', 'katıl'];

  const matchesOptOut = optOutKeywords.some(kw => normText === kw || normText.startsWith(kw + ' ') || normText.endsWith(' ' + kw) || buttonId === kw || buttonId.includes('opt_out') || buttonId.includes('stop'));
  const matchesOptIn = optInKeywords.some(kw => normText === kw || normText.startsWith(kw + ' ') || normText.endsWith(' ' + kw) || buttonId === kw || buttonId.includes('opt_in') || buttonId.includes('start'));

  if (matchesOptOut) {
    if (!botRulesStore.optOutList.includes(fromPhone)) {
      botRulesStore.optOutList.push(fromPhone);
      saveBotRules();
      console.log(`🚫 [OPT-OUT] Müşteri Otomasyondan Çıktı (${country.flag} ${country.name}) -> ${fromPhone}`);
    }

    const optOutReplies = {
      tr: "Talebiniz alınmıştır. Cleopatra Ink stüdyomuzdan artık otomatik kampanya veya hatırlatma mesajı almayacaksınız. Dilediğiniz zaman tekrar 'BAŞLAT' yazarak bildirimleri açabilirsiniz. İyi günler dileriz! 🖤",
      de: "Ihre Anfrage wurde entgegengenommen. Sie erhalten keine weiteren automatischen Nachrichten mehr von Cleopatra Ink. Schreiben Sie jederzeit 'START', um wieder beizutreten. Einen schönen Tag! 🖤",
      nl: "Uw verzoek is ontvangen. U ontvangt geen automatische berichten meer van Cleopatra Ink. Stuur 'START' om u weer aan te melden. Fijne dag! 🖤",
      en: "Your request has been received. You will no longer receive automated messages from Cleopatra Ink. You can text 'START' anytime to opt back in. Have a great day! 🖤",
      ru: "Ваш запрос принят. Вы больше не будете получать рассылку от Cleopatra Ink. Напишите 'СТАРТ' в любое время, чтобы возобновить. Хорошего дня! 🖤"
    };

    const replyText = optOutReplies[country.code] || optOutReplies.en;
    await sendAutoReply(fromPhone, replyText, `Abonelikten Çıkış (DUR) [${country.code.toUpperCase()}]`, null, null, country.code);
    return;
  }

  if (matchesOptIn) {
    if (botRulesStore.optOutList.includes(fromPhone)) {
      botRulesStore.optOutList = botRulesStore.optOutList.filter(p => p !== fromPhone);
      saveBotRules();
      console.log(`✅ [OPT-IN] Müşteri Tekrar Katıldı (${country.flag} ${country.name}) -> ${fromPhone}`);
    }

    const optInReplies = {
      tr: "Tekrar hoş geldiniz! 🎨 Cleopatra Ink stüdyosu bildirimleriniz başarıyla yeniden aktif edildi. Size nasıl yardımcı olabiliriz?",
      de: "Willkommen zurück! 🎨 Ihre Cleopatra Ink Benachrichtigungen wurden erfolgreich reaktiviert. Wie können wir Ihnen helfen?",
      nl: "Welkom terug! 🎨 Uw Cleopatra Ink meldingen zijn succesvol opnieuw geactiveerd. Hoe kunnen we u helpen?",
      en: "Welcome back! 🎨 Your Cleopatra Ink notifications have been successfully reactivated. How can we help you?",
      ru: "С возвращением! 🎨 Ваши уведомления Cleopatra Ink успешно активированы. Чем мы можем вам помочь?"
    };

    const replyText = optInReplies[country.code] || optInReplies.en;
    await sendAutoReply(fromPhone, replyText, `Yeniden Katılım (BAŞLAT) [${country.code.toUpperCase()}]`, null, null, country.code);
    return;
  }

  // If user is currently Opted-Out, do NOT trigger any other auto-replies!
  if (isOptedOut) {
    console.log(`[OPT-OUT BLOCKED] ${fromPhone} numarası listeden çıktığı için otomatik yanıt gönderilmedi.`);
    return;
  }

  // 1. Check Welcome Message (First message or > 24 hours inactive)
  if (botRulesStore.welcomeMessage && botRulesStore.welcomeMessage.enabled) {
    const cooldownMs = (botRulesStore.welcomeMessage.cooldownHours || 24) * 3600 * 1000;
    const pastMessages = messageStore.filter(m =>
      (m.from === fromPhone || m.to === fromPhone) && m.id !== incomingMsg.id
    );

    let shouldSendWelcome = false;
    if (pastMessages.length === 0) {
      shouldSendWelcome = true;
    } else {
      const lastMsgTime = Math.max(...pastMessages.map(m => m.timestamp || 0));
      if (Date.now() - lastMsgTime > cooldownMs) {
        shouldSendWelcome = true;
      }
    }

    if (shouldSendWelcome) {
      let welcomeText = botRulesStore.welcomeMessage.text;
      let welcomeButtons = botRulesStore.welcomeMessage.buttons;

      // Check language packs
      if (botRulesStore.welcomeMessage.languages && botRulesStore.welcomeMessage.languages[country.code]) {
        const langObj = botRulesStore.welcomeMessage.languages[country.code];
        if (langObj.text) welcomeText = langObj.text;
        if (langObj.buttons) welcomeButtons = langObj.buttons;
      } else if (defaultLanguagePacks[country.code]) {
        welcomeText = defaultLanguagePacks[country.code].text;
        welcomeButtons = defaultLanguagePacks[country.code].buttons;
      }

      console.log(`🤖 [BOT] Karşılama Mesajı Tetiklendi (${country.flag} ${country.name}) -> ${fromPhone}`);
      await sendAutoReply(fromPhone, welcomeText, `Karşılama Mesajı (${country.flag} ${country.name})`, null, welcomeButtons, country.code);
      return;
    }
  }

  // 1.5 Check Inline Button Responses (Direct reply text configured on button)
  let inlineBtnMatch = null;

  // Check welcome message buttons
  if (botRulesStore.welcomeMessage && botRulesStore.welcomeMessage.buttons) {
    const matchedBtn = botRulesStore.welcomeMessage.buttons.find(b =>
      b.replyText && (b.title === rawText || b.id === rawText || (b.title && normalizeTurkish(b.title) === normText))
    );
    if (matchedBtn) {
      inlineBtnMatch = { replyText: matchedBtn.replyText, name: `Buton Yanıtı (${matchedBtn.title})` };
    }
  }

  // Check defaultLanguagePacks buttons for matching button replies across languages
  if (!inlineBtnMatch) {
    for (const langKey of Object.keys(defaultLanguagePacks)) {
      const langPack = defaultLanguagePacks[langKey];
      const matchedBtn = langPack.buttons.find(b =>
        b.replyText && (b.title === rawText || b.id === rawText || (b.title && normalizeTurkish(b.title) === normText))
      );
      if (matchedBtn) {
        inlineBtnMatch = { replyText: matchedBtn.replyText, name: `Buton Yanıtı [${langKey.toUpperCase()}] -> ${matchedBtn.title}` };
        break;
      }
    }
  }

  // Check rules buttons
  if (!inlineBtnMatch && botRulesStore.rules) {
    for (const r of botRulesStore.rules) {
      if (!r.enabled || !r.buttons) continue;
      const matchedBtn = r.buttons.find(b =>
        b.replyText && (b.title === rawText || b.id === rawText || (b.title && normalizeTurkish(b.title) === normText))
      );
      if (matchedBtn) {
        inlineBtnMatch = { replyText: matchedBtn.replyText, name: `Buton Yanıtı [${r.name}] -> ${matchedBtn.title}` };
        break;
      }
    }
  }

  if (inlineBtnMatch) {
    console.log(`🤖 [BOT] Buton Yanıtı Tetiklendi [${inlineBtnMatch.name}] -> ${fromPhone}`);
    await sendAutoReply(fromPhone, inlineBtnMatch.replyText, inlineBtnMatch.name, null, null, country.code);
    return;
  }

  // 1.8 Check Multi-Language Keyword Rules (Auto-detect DE, EN, NL, TR, RU keywords)
  for (const mRule of multiLangRules) {
    let matchedLangKey = null;

    // First try the user's active session language
    const primaryKwList = (mRule.keywordsByLang[country.code] || []).map(k => normalizeText(k)).filter(Boolean);
    if (primaryKwList.some(kw => normText.includes(kw) || kw === normText)) {
      matchedLangKey = country.code;
    } else {
      // If primary language doesn't match, check other languages to detect a language switch
      for (const langKey of Object.keys(mRule.keywordsByLang)) {
        const kwList = (mRule.keywordsByLang[langKey] || []).map(k => normalizeText(k)).filter(Boolean);
        if (kwList.some(kw => normText.includes(kw) || kw === normText)) {
          matchedLangKey = langKey;
          // Update stored user language
          userLanguageStore[fromPhone] = { code: langKey, updatedAt: Date.now(), source: 'rule_keyword' };
          saveUserLanguages();
          break;
        }
      }
    }

    if (matchedLangKey) {
      const activeCountry = getCountryLangInfo(matchedLangKey);
      const replyText = mRule.replies[matchedLangKey] || mRule.replies['en'];
      const buttons = mRule.buttonsByLang ? (mRule.buttonsByLang[matchedLangKey] || mRule.buttonsByLang['en']) : null;
      console.log(`🤖 [BOT] Çok Dilli Kural Eşleşti [${mRule.name}] (${activeCountry.flag} ${activeCountry.name}) -> ${fromPhone}`);
      await sendAutoReply(fromPhone, replyText, `${mRule.name} (${activeCountry.flag} ${activeCountry.code.toUpperCase()})`, null, buttons, activeCountry.code);
      return;
    }
  }

  // 2. Check Custom User Keyword Rules
  if (botRulesStore.rules && Array.isArray(botRulesStore.rules)) {
    for (const rule of botRulesStore.rules) {
      if (!rule.enabled) continue;

      const keywords = (rule.keywords || []).map(k => normalizeTurkish(k)).filter(Boolean);
      let isMatch = false;

      if (rule.matchType === 'exact') {
        isMatch = keywords.includes(normText);
      } else { // default 'contains'
        isMatch = keywords.some(kw => normText.includes(kw));
      }

      if (isMatch) {
        console.log(`🤖 [BOT] Kural Eşleşti [${rule.name}] -> ${fromPhone}`);
        await sendAutoReply(fromPhone, rule.replyText, rule.name, rule.location, rule.buttons, country.code);
        break; // Stop after first matched rule
      }
    }
  }
}

function enableCORS(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
}

const server = http.createServer((req, res) => {
  enableCORS(res);

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname;

  // DEBUG: Log EVERY incoming request
  console.log(`[${new Date().toISOString()}] 📥 ${req.method} ${pathname} (from: ${req.headers['x-forwarded-for'] || req.socket.remoteAddress})`);

  // 1. Webhook Verification GET /webhook
  if (req.method === 'GET' && pathname === '/webhook') {
    const mode = parsedUrl.query['hub.mode'];
    const token = parsedUrl.query['hub.verify_token'];
    const challenge = parsedUrl.query['hub.challenge'];

    console.log(`[Webhook Verification] Mode: ${mode}, Token: ${token}`);

    webhookStats.verifyAttempts++;
    webhookStats.lastVerifyTime = new Date().toISOString();

    if (mode === 'subscribe' && token === VERIFY_TOKEN) {
      console.log('✅ Webhook doğrulama başarılı!');
      webhookStats.lastVerifySuccess = true;
      res.writeHead(200, { 'Content-Type': 'text/plain' });
      res.end(challenge);
    } else {
      console.log('❌ Webhook doğrulama başarısız! Token eşleşmedi.');
      console.log(`   Beklenen: ${VERIFY_TOKEN}`);
      console.log(`   Gelen:    ${token}`);
      webhookStats.lastVerifySuccess = false;
      res.writeHead(403, { 'Content-Type': 'text/plain' });
      res.end('Forbidden');
    }
    return;
  }

  // 2. Incoming Meta Webhook Event POST /webhook
  if (req.method === 'POST' && pathname === '/webhook') {
    let body = '';
    req.on('data', chunk => { body += chunk.toString(); });
    req.on('end', () => {
      try {
        const data = JSON.parse(body);
        if (data.entry) {
          data.entry.forEach(entry => {
            (entry.changes || []).forEach(change => {
              const value = change.value;
              if (!value) return;

              // Incoming Messages
              if (value.messages) {
                value.messages.forEach(msg => {
                  const contact = (value.contacts && value.contacts[0]) || {};
                  const senderName = contact.profile ? contact.profile.name : 'Müşteri';
                  const fromNum = msg.from;
                  let msgText = '';
                  let buttonId = null;

                  if (msg.type === 'text') {
                    msgText = msg.text ? msg.text.body : '';
                  } else if (msg.type === 'interactive') {
                    if (msg.interactive.type === 'button_reply') {
                      msgText = msg.interactive.button_reply.title;
                      buttonId = msg.interactive.button_reply.id;
                    } else if (msg.interactive.type === 'list_reply') {
                      msgText = msg.interactive.list_reply.title;
                      buttonId = msg.interactive.list_reply.id;
                    }
                  } else if (msg.type === 'button') {
                    msgText = msg.button ? msg.button.text : '';
                    buttonId = msg.button ? msg.button.payload : null;
                  } else if (msg.type === 'image') {
                    msgText = msg.image && msg.image.caption ? msg.image.caption : '📷 [Fotoğraf]';
                  } else if (msg.type === 'audio') {
                    msgText = '🎵 [Ses Kaydı]';
                  } else if (msg.type === 'video') {
                    msgText = '🎥 [Video]';
                  } else if (msg.type === 'document') {
                    msgText = msg.document && msg.document.filename ? `📄 [Belge: ${msg.document.filename}]` : '📄 [Belge]';
                  } else if (msg.type === 'location') {
                    msgText = `📍 [Konum: ${msg.location.latitude}, ${msg.location.longitude}]`;
                  } else {
                    msgText = `[${msg.type}]`;
                  }

                  const newMsg = {
                    id: msg.id,
                    from: fromNum,
                    senderName: senderName,
                    text: msgText,
                    buttonId: buttonId,
                    type: msg.type,
                    timestamp: parseInt(msg.timestamp) * 1000 || Date.now(),
                    direction: 'incoming',
                    status: 'received',
                    raw: msg
                  };

                  messageStore.push(newMsg);
                  saveDB();
                  console.log(`💬 Gelen Mesaj [${senderName} (${fromNum})]: ${msgText}`);

                  // Trigger Bot Auto-Reply Engine
                  processAutoReply(newMsg).catch(err => {
                    console.error('[BOT Error] Auto reply execution failed:', err);
                  });
                });
              }

              // Status Updates (sent, delivered, read, failed)
              if (value.statuses) {
                value.statuses.forEach(st => {
                  statusStore[st.id] = {
                    status: st.status,
                    recipient: st.recipient_id,
                    timestamp: parseInt(st.timestamp) * 1000 || Date.now()
                  };
                  console.log(`📊 Mesaj Durumu Güncellendi [${st.id}]: ${st.status}`);

                  // Also append an outgoing message entry if not present
                  const recip = st.recipient_id;
                  if (recip) {
                    const existing = messageStore.find(m => m.id === st.id);
                    if (existing) {
                      existing.status = st.status;
                    } else {
                      messageStore.push({
                        id: st.id,
                        from: 'studio',
                        to: recip,
                        text: `tattoo_reengagement_tr_redirect (Şablon Gönderildi) [Durum: ${st.status.toUpperCase()}]`,
                        timestamp: parseInt(st.timestamp) * 1000 || Date.now(),
                        direction: 'outgoing',
                        status: st.status
                      });
                    }
                    saveDB();
                  }
                });
              }
            });
          });
        }

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ status: 'EVENT_RECEIVED' }));
      } catch (err) {
        console.error('[Parse Error]', err.message);
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Invalid JSON' }));
      }
    });
    return;
  }

// 3. API for Dashboard: GET /api/messages
if (req.method === 'GET' && pathname === '/api/messages') {
  const phone = parsedUrl.query.phone;
  const since = parseInt(parsedUrl.query.since || '0');

  // Supabase DB'den gelen canlı mesajları çek ve senkronize et
  const https = require('https');
  const supabaseOpt = {
    hostname: 'qtccvlqegrhkewxrnazp.supabase.co',
    path: '/rest/v1/messages?select=*',
    method: 'GET',
    headers: {
      'apikey': 'sb_publishable_PtpHnY0rQ3eVToJiNxzkdA_tnQ8hEZS',
      'Authorization': 'Bearer sb_publishable_PtpHnY0rQ3eVToJiNxzkdA_tnQ8hEZS'
    }
  };

  const supaReq = https.request(supabaseOpt, (supaRes) => {
    let rawData = '';
    supaRes.on('data', chunk => { rawData += chunk; });
    supaRes.on('end', () => {
      try {
        if (supaRes.statusCode >= 200 && supaRes.statusCode < 300) {
          const remoteMsgs = JSON.parse(rawData);
          if (Array.isArray(remoteMsgs)) {
            remoteMsgs.forEach(rm => {
              if (!messageStore.some(m => m.id === rm.id)) {
                messageStore.push(rm);
              }
            });
          }
        }
      } catch (e) { }

      let filtered = messageStore.filter(m => (m.timestamp || 0) > since);
      if (phone) {
        const cleanTarget = phone.replace(/\D/g, '');
        filtered = filtered.filter(m => (m.from || '').replace(/\D/g, '').includes(cleanTarget) || (m.to || '').replace(/\D/g, '').includes(cleanTarget));
      }

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        success: true,
        count: filtered.length,
        messages: filtered,
        statuses: statusStore
      }));
    });
  });

  supaReq.on('error', () => {
    let filtered = messageStore.filter(m => (m.timestamp || 0) > since);
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      success: true,
      count: filtered.length,
      messages: filtered,
      statuses: statusStore
    }));
  });

  supaReq.end();
  return;
}

// 4. API for Dashboard: POST /api/send (Proxy message send to Meta Cloud API)
// 4d. Media Upload Proxy POST /api/upload_media
if (req.method === 'POST' && pathname === '/api/upload_media') {
  const phoneId = req.headers['x-meta-phoneid'] || parsedUrl.query.phoneId;
  const token = req.headers['x-meta-token'] || parsedUrl.query.token;

  if (!phoneId || !token) {
    res.writeHead(400, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Missing meta phoneId or token in headers/query.' }));
    return;
  }

  // Forward raw multipart body to Meta Graph API /{PHONE_ID}/media
  const https = require('https');
  const metaOptions = {
    hostname: 'graph.facebook.com',
    path: `/v20.0/${phoneId}/media`,
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': req.headers['content-type'] || 'multipart/form-data'
    }
  };

  console.log('[Upload Proxy] Forwarding upload to Meta /v20.0/media');

  // If client sent JSON (base64 fallback), construct multipart body ourselves
  const contentType = req.headers['content-type'] || '';
  if (contentType.includes('application/json')) {
    let body = '';
    req.on('data', c => { body += c.toString(); });
    req.on('end', () => {
      try {
        const parsed = JSON.parse(body);
        const filename = parsed.filename || 'upload.jpg';
        const mime = parsed.mime || 'image/jpeg';
        const dataB64 = parsed.data || '';
        const buffer = Buffer.from(dataB64, 'base64');
        const boundary = '----WebKitFormBoundary' + Date.now().toString(16);
        const metaHeaders = Object.assign({}, metaOptions.headers);
        metaHeaders['Content-Type'] = 'multipart/form-data; boundary=' + boundary;

        let pre = `--${boundary}\r\n`;
        pre += `Content-Disposition: form-data; name="messaging_product"\r\n\r\nwhatsapp\r\n`;
        pre += `--${boundary}\r\n`;
        pre += `Content-Disposition: form-data; name="type"\r\n\r\n${mime}\r\n`;
        pre += `--${boundary}\r\n`;
        pre += `Content-Disposition: form-data; name="file"; filename="${filename}"\r\n`;
        pre += `Content-Type: ${mime}\r\n\r\n`;

        const post = `\r\n--${boundary}--\r\n`;

        const metaReq2 = https.request(Object.assign({}, metaOptions, { headers: metaHeaders }), (metaRes) => {
          let raw = '';
          metaRes.on('data', c => { raw += c; });
          metaRes.on('end', () => {
            console.log('[Upload Proxy] Meta response (base64)', metaRes.statusCode, raw);
            res.writeHead(metaRes.statusCode, { 'Content-Type': 'application/json' });
            res.end(raw);
          });
        });
        metaReq2.on('error', (err) => {
          console.error('[Upload Proxy] metaReq2 error:', err.message);
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: err.message }));
        });

        metaReq2.write(pre);
        metaReq2.write(buffer);
        metaReq2.write(post);
        metaReq2.end();
      } catch (e) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Invalid JSON body for base64 upload: ' + e.message }));
      }
    });
    return;
  }

  // default: pipe raw multipart through
  const metaReq = https.request(metaOptions, (metaRes) => {
    let raw = '';
    metaRes.on('data', c => { raw += c; });
    metaRes.on('end', () => {
      console.log('[Upload Proxy] Meta response (stream)', metaRes.statusCode, raw);
      res.writeHead(metaRes.statusCode, { 'Content-Type': 'application/json' });
      res.end(raw);
    });
  });

  metaReq.on('error', (err) => {
    console.error('[Upload Proxy] stream error:', err.message);
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: err.message }));
  });

  req.pipe(metaReq);
  return;
}
if (req.method === 'POST' && pathname === '/api/send') {
  let body = '';
  req.on('data', chunk => { body += chunk.toString(); });
  req.on('end', () => {
    try {
      const data = JSON.parse(body);
      const { phoneId, token, to, text, template } = data;

      if (!phoneId || !token || !to) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'phoneId, token ve to zorunludur.' }));
        return;
      }

      const metaUrl = `https://graph.facebook.com/v20.0/${phoneId}/messages`;
      let metaPayload = {
        messaging_product: 'whatsapp',
        to: to.replace(/\D/g, '')
      };

      if (template) {
        // Sanitize template payload: ensure numeric ids are numbers (Meta expects integer for image.id/document.id)
        try {
          if (template.components && Array.isArray(template.components)) {
            template.components.forEach((comp) => {
              if (comp.parameters && Array.isArray(comp.parameters)) {
                comp.parameters.forEach((param) => {
                  // image parameter
                  if (param.image && param.image.id && typeof param.image.id === 'string') {
                    const s = param.image.id.trim();
                    if (/^\d+$/.test(s)) param.image.id = parseInt(s, 10);
                  }
                  // document parameter
                  if (param.document && param.document.id && typeof param.document.id === 'string') {
                    const s = param.document.id.trim();
                    if (/^\d+$/.test(s)) param.document.id = parseInt(s, 10);
                    if (!param.document.filename) param.document.filename = param.document.filename || 'file.pdf';
                  }
                  // video parameter (if any)
                  if (param.video && param.video.id && typeof param.video.id === 'string') {
                    const s = param.video.id.trim();
                    if (/^\d+$/.test(s)) param.video.id = parseInt(s, 10);
                  }
                });
              }
            });
          }
        } catch (e) { console.warn('[Proxy] Template sanitize failed', e && e.message); }

        metaPayload.type = 'template';
        metaPayload.template = template;
      } else {
        metaPayload.type = 'text';
        metaPayload.text = { body: text || '' };
      }

      const postData = JSON.stringify(metaPayload);

      const options = {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(postData)
        }
      };

      console.log('[Proxy] Gönderiliyor -> Meta URL:', metaUrl);
      console.log('[Proxy] Payload:', JSON.stringify(metaPayload));
      const metaReq = require('https').request(metaUrl, options, (metaRes) => {
        let resBody = '';
        metaRes.on('data', c => { resBody += c; });
        metaRes.on('end', () => {
          console.log('[Proxy] Meta responded', metaRes.statusCode, resBody);
          res.writeHead(metaRes.statusCode, { 'Content-Type': 'application/json' });
          res.end(resBody);

          // Record outgoing message in local store if successful
          if (metaRes.statusCode === 200) {
            try {
              const parsed = JSON.parse(resBody);
              const msgId = parsed.messages && parsed.messages[0] ? parsed.messages[0].id : `out-${Date.now()}`;
              messageStore.push({
                id: msgId,
                from: 'studio',
                to: to.replace(/\D/g, ''),
                text: text || `[Şablon: ${template ? template.name : ''}]`,
                timestamp: Date.now(),
                direction: 'outgoing'
              });
              saveDB();
            } catch (e) { }
          }
        });
      });

      metaReq.on('error', (err) => {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: err.message }));
      });

      metaReq.write(postData);
      metaReq.end();

    } catch (err) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Geçersiz istek gövdesi.' }));
    }
  });
  return;
}

// 4b. Record Outgoing Message Endpoint POST /api/record_outgoing
if (req.method === 'POST' && pathname === '/api/record_outgoing') {
  let body = '';
  req.on('data', chunk => { body += chunk.toString(); });
  req.on('end', () => {
    try {
      const data = JSON.parse(body);
      const toPhone = String(data.to || '').replace(/\D/g, '');
      if (toPhone) {
        messageStore.push({
          id: `out-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          from: 'studio',
          to: toPhone,
          senderName: data.senderName || 'Stüdyo',
          text: data.text || 'Mesaj',
          timestamp: Date.now(),
          type: 'text',
          direction: 'outgoing'
        });
        saveDB();
        console.log(`💬 Giden Mesaj Kaydedildi -> ${toPhone}: ${data.text}`);
      }
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true }));
    } catch (err) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: err.message }));
    }
  });
  return;
}

// 4c. Simulate Incoming Message Endpoint POST /api/simulate_incoming
if (req.method === 'POST' && pathname === '/api/simulate_incoming') {
  let body = '';
  req.on('data', chunk => { body += chunk.toString(); });
  req.on('end', () => {
    try {
      const data = JSON.parse(body);
      const fromPhone = String(data.from || '905455064024').replace(/\D/g, '');
      const newMsg = {
        id: `inc-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        from: fromPhone,
        senderName: data.senderName || `Müşteri (${fromPhone})`,
        text: data.text || 'Merhaba, randevu almak istiyorum!',
        timestamp: Date.now(),
        type: 'text',
        direction: 'incoming'
      };
      messageStore.push(newMsg);
      saveDB();
      console.log(`💬 Simüle Edilen Gelen Mesaj [${fromPhone}]: ${newMsg.text}`);

      // Trigger Bot Auto-Reply Engine for simulated message
      processAutoReply(newMsg).catch(err => {
        console.error('[BOT Error] Auto reply execution failed for simulation:', err);
      });

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true, message: newMsg }));
    } catch (err) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: err.message }));
    }
  });
  return;
}

// 5. Debug / Health Check Endpoints
if (req.method === 'GET' && pathname === '/api/health') {
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({
    status: 'ok',
    uptime: Math.floor((Date.now() - webhookStats.serverStartTime) / 1000),
    messageCount: messageStore.length,
    webhookStats: webhookStats
  }));
  return;
}

// 5b. Bot Rules API GET /api/bot-rules
if (req.method === 'GET' && pathname === '/api/bot-rules') {
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(botRulesStore));
  return;
}

// 5c. Bot Rules API POST /api/bot-rules
if (req.method === 'POST' && pathname === '/api/bot-rules') {
  let body = '';
  req.on('data', chunk => { body += chunk.toString(); });
  req.on('end', () => {
    try {
      const updated = JSON.parse(body);
      botRulesStore = { ...botRulesStore, ...updated };
      saveBotRules();
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true, rules: botRulesStore }));
    } catch (e) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Geçersiz JSON formatı' }));
    }
  });
  return;
}

// 5d. Opt-Out List API GET /api/opt_out_list
if (req.method === 'GET' && pathname === '/api/opt_out_list') {
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ optOutList: botRulesStore.optOutList || [] }));
  return;
}

// 5e. Opt-Out Toggle API POST /api/opt_out_toggle
if (req.method === 'POST' && pathname === '/api/opt_out_toggle') {
  let body = '';
  req.on('data', chunk => { body += chunk.toString(); });
  req.on('end', () => {
    try {
      const { phone } = JSON.parse(body);
      const cleanP = String(phone || '').replace(/\D/g, '');
      if (!cleanP) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Geçersiz telefon numarası' }));
        return;
      }
      if (!botRulesStore.optOutList) botRulesStore.optOutList = [];
      const idx = botRulesStore.optOutList.indexOf(cleanP);
      let isOptedOut = false;
      if (idx !== -1) {
        botRulesStore.optOutList.splice(idx, 1);
        isOptedOut = false;
      } else {
        botRulesStore.optOutList.push(cleanP);
        isOptedOut = true;
      }
      saveBotRules();
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true, isOptedOut, optOutList: botRulesStore.optOutList }));
    } catch (e) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: e.message }));
    }
  });
  return;
}

if (req.method === 'GET' && pathname === '/debug') {
  const uptimeSec = Math.floor((Date.now() - webhookStats.serverStartTime) / 1000);
  const uptimeStr = `${Math.floor(uptimeSec / 3600)}s ${Math.floor((uptimeSec % 3600) / 60)}dk ${uptimeSec % 60}sn`;
  const incomingCount = messageStore.filter(m => m.direction === 'incoming').length;
  const outgoingCount = messageStore.filter(m => m.direction === 'outgoing').length;
  const lastMsgs = messageStore.slice(-5).reverse();

  const debugHtml = `<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Webhook Debug Paneli</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Segoe UI', sans-serif; background: #0f172a; color: #e2e8f0; padding: 24px; }
    h1 { color: #38bdf8; margin-bottom: 8px; font-size: 24px; }
    .subtitle { color: #94a3b8; margin-bottom: 24px; }
    .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 16px; margin-bottom: 24px; }
    .card { background: #1e293b; border-radius: 12px; padding: 20px; border: 1px solid #334155; }
    .card h3 { color: #94a3b8; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px; }
    .card .value { font-size: 28px; font-weight: 700; }
    .card .detail { color: #64748b; font-size: 13px; margin-top: 4px; }
    .ok { color: #22c55e; }
    .warn { color: #f59e0b; }
    .err { color: #ef4444; }
    .info-box { background: #1e293b; border-radius: 12px; padding: 20px; border: 1px solid #334155; margin-bottom: 16px; }
    .info-box h2 { color: #38bdf8; font-size: 16px; margin-bottom: 12px; }
    .token-box { background: #0f172a; padding: 12px; border-radius: 8px; font-family: monospace; font-size: 14px; color: #fbbf24; word-break: break-all; cursor: pointer; border: 1px dashed #334155; }
    .token-box:hover { border-color: #fbbf24; }
    table { width: 100%; border-collapse: collapse; }
    th { text-align: left; color: #94a3b8; font-size: 11px; text-transform: uppercase; padding: 8px; border-bottom: 1px solid #334155; }
    td { padding: 8px; font-size: 13px; border-bottom: 1px solid #1e293b; }
    .badge { display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: 11px; font-weight: 600; }
    .badge-in { background: rgba(34,197,94,0.15); color: #22c55e; }
    .badge-out { background: rgba(59,130,246,0.15); color: #3b82f6; }
    .btn { display: inline-block; padding: 10px 20px; border-radius: 8px; border: none; font-weight: 600; cursor: pointer; font-size: 14px; margin-right: 8px; margin-top: 8px; }
    .btn-primary { background: #2563eb; color: white; }
    .btn-primary:hover { background: #1d4ed8; }
    .btn-green { background: #16a34a; color: white; }
    .btn-green:hover { background: #15803d; }
    #testResult { margin-top: 12px; padding: 12px; border-radius: 8px; display: none; font-family: monospace; font-size: 13px; }
    .checklist { list-style: none; padding: 0; }
    .checklist li { padding: 8px 0; border-bottom: 1px solid #1e293b; font-size: 14px; }
    .checklist li::before { content: ''; display: inline-block; width: 8px; height: 8px; border-radius: 50%; margin-right: 10px; }
    .checklist li.pass::before { background: #22c55e; }
    .checklist li.fail::before { background: #ef4444; }
    .checklist li.unknown::before { background: #f59e0b; }
  </style>
</head>
<body>
  <h1>🔧 Webhook Debug Paneli</h1>
  <p class="subtitle">Cleopatra WhatsApp Webhook Sunucusu - Sorun Giderme</p>

  <div class="grid">
    <div class="card">
      <h3>Sunucu Durumu</h3>
      <div class="value ok">✅ Çalışıyor</div>
      <div class="detail">Uptime: ${uptimeStr}</div>
    </div>
    <div class="card">
      <h3>Toplam Webhook Event</h3>
      <div class="value ${webhookStats.totalEventsReceived > 0 ? 'ok' : 'warn'}">${webhookStats.totalEventsReceived}</div>
      <div class="detail">Son: ${webhookStats.lastEventTime || 'Henüz event gelmedi'}</div>
    </div>
    <div class="card">
      <h3>Gelen Mesajlar</h3>
      <div class="value ok">${incomingCount}</div>
      <div class="detail">Müşterilerden gelen</div>
    </div>
    <div class="card">
      <h3>Giden Mesajlar</h3>
      <div class="value">${outgoingCount}</div>
      <div class="detail">Stüdyodan gönderilen</div>
    </div>
    <div class="card">
      <h3>Doğrulama Denemeleri</h3>
      <div class="value ${webhookStats.lastVerifySuccess ? 'ok' : (webhookStats.verifyAttempts > 0 ? 'err' : 'warn')}">${webhookStats.verifyAttempts}</div>
      <div class="detail">${webhookStats.lastVerifySuccess === true ? '✅ Son deneme başarılı' : (webhookStats.lastVerifySuccess === false ? '❌ Son deneme başarısız' : '⏳ Henüz deneme yok')}</div>
    </div>
    <div class="card">
      <h3>Port</h3>
      <div class="value">${PORT}</div>
      <div class="detail">http://localhost:${PORT}</div>
    </div>
  </div>

  <div class="info-box">
    <h2>🔑 Meta'ya Girilecek Verify Token (Kopyala)</h2>
    <div class="token-box" onclick="navigator.clipboard.writeText('${VERIFY_TOKEN}'); this.style.borderColor='#22c55e'; this.innerHTML='✅ Kopyalandı!'; setTimeout(()=>{this.innerHTML='${VERIFY_TOKEN}'; this.style.borderColor='#334155';}, 2000);">${VERIFY_TOKEN}</div>
  </div>

  <div class="info-box">
    <h2>📋 Dükkan Bilgisayarı Kontrol Listesi</h2>
    <ul class="checklist">
      <li class="${webhookStats.totalEventsReceived > 0 ? 'pass' : 'fail'}">Meta'dan webhook event alınıyor mu? → <strong>${webhookStats.totalEventsReceived > 0 ? 'EVET (' + webhookStats.totalEventsReceived + ' event)' : 'HAYIR - Meta panelinde Callback URL ve Verify Token kontrol edin'}</strong></li>
      <li class="${webhookStats.lastVerifySuccess ? 'pass' : 'unknown'}">Webhook doğrulaması başarılı mı? → <strong>${webhookStats.lastVerifySuccess ? 'EVET' : 'Kontrol edilmeli'}</strong></li>
      <li class="${incomingCount > 0 ? 'pass' : 'fail'}">Müşteri mesajı alındı mı? → <strong>${incomingCount > 0 ? 'EVET (' + incomingCount + ' mesaj)' : 'HAYIR - Meta panelinde messages alanını subscribe edin'}</strong></li>
      <li class="unknown">Cloudflare Tunnel aktif mi? → <strong>Terminalde kontrol edin (yeşil bağlantı mesajı olmalı)</strong></li>
      <li class="unknown">Meta Callback URL güncel mi? → <strong>Her tunnel yeniden başlatıldığında URL değişir!</strong></li>
    </ul>
  </div>

  <div class="info-box">
    <h2>🧪 Self-Test: Webhook'u Test Et</h2>
    <p style="color:#94a3b8; margin-bottom:12px;">Bu buton sunucunuza sahte bir webhook event gönderir. Eğer başarılı olursa sunucu çalışıyor demektir.</p>
    <button class="btn btn-primary" onclick="runSelfTest()">🚀 Webhook Self-Test Başlat</button>
    <button class="btn btn-green" onclick="location.reload()">🔄 Sayfayı Yenile</button>
    <div id="testResult"></div>
  </div>

  <div class="info-box">
    <h2>💬 Son 5 Mesaj</h2>
    <table>
      <thead><tr><th>Yön</th><th>Kimden/Kime</th><th>Mesaj</th><th>Zaman</th></tr></thead>
      <tbody>
        ${lastMsgs.length > 0 ? lastMsgs.map(m => '<tr><td><span class="badge ' + (m.direction === 'incoming' ? 'badge-in' : 'badge-out') + '">' + (m.direction === 'incoming' ? '⬇ Gelen' : '⬆ Giden') + '</span></td><td>' + (m.from || '-') + (m.to ? ' → ' + m.to : '') + '</td><td>' + (m.text || '-').substring(0, 60) + '</td><td>' + new Date(m.timestamp).toLocaleTimeString() + '</td></tr>').join('') : '<tr><td colspan="4" style="text-align:center;color:#64748b;">Henüz mesaj yok</td></tr>'}
      </tbody>
    </table>
  </div>

  <script>
    async function runSelfTest() {
      const resultEl = document.getElementById('testResult');
      resultEl.style.display = 'block';
      resultEl.style.background = '#1e293b';
      resultEl.textContent = '⏳ Test ediliyor...';

      try {
        // Step 1: Test verify endpoint
        const verifyRes = await fetch('/webhook?hub.mode=subscribe&hub.verify_token=${VERIFY_TOKEN}&hub.challenge=selftest123');
        const verifyText = await verifyRes.text();
        const verifyOk = verifyRes.ok && verifyText === 'selftest123';

        // Step 2: Test POST webhook with fake payload
        const postRes = await fetch('/webhook', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            object: 'whatsapp_business_account',
            entry: [{ id: 'SELFTEST', changes: [{ value: { messaging_product: 'whatsapp', metadata: { display_phone_number: '000', phone_number_id: '000' }, messages: [{ from: '900000000000', id: 'selftest-' + Date.now(), timestamp: String(Math.floor(Date.now()/1000)), text: { body: '🧪 Self-Test Mesajı (' + new Date().toLocaleTimeString() + ')' }, type: 'text' }], contacts: [{ profile: { name: 'Self-Test' }, wa_id: '900000000000' }] }, field: 'messages' }] }]
          })
        });
        const postOk = postRes.ok;

        if (verifyOk && postOk) {
          resultEl.style.background = 'rgba(34,197,94,0.15)';
          resultEl.innerHTML = '✅ <strong>BAŞARILI!</strong> Sunucu hem doğrulamayı hem mesaj alımını düzgün yapıyor.<br>Sorun Meta tarafında olabilir: Callback URL ve Messages subscription kontrol edin.';
        } else {
          resultEl.style.background = 'rgba(239,68,68,0.15)';
          resultEl.innerHTML = '❌ <strong>BAŞARISIZ!</strong><br>Verify: ' + (verifyOk?'OK':'FAIL') + '<br>POST: ' + (postOk?'OK':'FAIL');
        }
      } catch(e) {
        resultEl.style.background = 'rgba(239,68,68,0.15)';
        resultEl.textContent = '❌ Bağlantı hatası: ' + e.message;
      }
    }
  </script>
</body>
</html>`;
  res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
  res.end(debugHtml);
  return;
}

// 6. Serve Static Web Dashboard Files (dashboard.html, js, css)
let staticPath = pathname === '/' ? '/dashboard.html' : pathname;
let filePath = path.join(__dirname, staticPath);

if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
  const ext = path.extname(filePath).toLowerCase();
  const mimeTypes = {
    '.html': 'text/html; charset=utf-8',
    '.js': 'application/javascript; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.svg': 'image/svg+xml'
  };
  const contentType = mimeTypes[ext] || 'application/octet-stream';
  res.writeHead(200, { 'Content-Type': contentType });
  fs.createReadStream(filePath).pipe(res);
  return;
}

res.writeHead(404, { 'Content-Type': 'text/plain' });
res.end('Not Found');
});

server.listen(PORT, () => {
  console.log(`
=====================================================
🚀 WhatsApp Webhook Sunucusu Başlatıldı!
📍 Port: http://localhost:${PORT}
🔑 Verify Token: ${VERIFY_TOKEN}
📩 Webhook URL: http://localhost:${PORT}/webhook
=====================================================
  `);
});
