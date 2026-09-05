// @ts-nocheck
// Supabase Edge Function: WhatsApp Business Webhook Handler & Multi-Language Interactive Auto-Reply Engine

// Store user active session language in memory across requests
const userLanguageMap = new Map<string, { code: string, timestamp: number }>();

function normalizeText(str: string): string {
  if (!str) return "";
  return String(str)
    .toLowerCase()
    .replace(/İ/g, "i")
    .replace(/I/g, "ı")
    .replace(/ı/g, "i")
    .replace(/ç/g, "c")
    .replace(/ğ/g, "g")
    .replace(/ö/g, "o")
    .replace(/ş/g, "s")
    .replace(/ü/g, "u")
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function detectLanguageFromText(text: string = "", buttonId: string = ""): string | null {
  if (buttonId) {
    if (buttonId.endsWith("_de")) return "de";
    if (buttonId.endsWith("_nl")) return "nl";
    if (buttonId.endsWith("_en")) return "en";
    if (buttonId.endsWith("_ru")) return "ru";
    if (buttonId.endsWith("_tr")) return "tr";
  }

  if (!text) return null;
  const rawLower = String(text).toLowerCase().trim();
  const norm = normalizeText(text);

  // 1. German (de)
  if (/\b(guten tag|guten morgen|guten abend|wie viel|preis|kosten|termin|buchen|anfahrt|öffnungszeiten|offnungszeiten|danke|vielen dank|bitte|auf wiedersehen|tätowierung|tattookosten|wieviel|wo ist|tattoo-info|tattoo info|adresse & ort|termin buchen|pflege|pflegeanleitung|nachsorge|tätowierung pflege|piercing pflege)\b/i.test(rawLower) ||
      /\b(guten tag|guten morgen|guten abend|wie viel|preis|kosten|termin|buchen|anfahrt|offnungszeiten|danke|vielen dank|bitte|auf wiedersehen|tattoo info|adresse ort|termin buchen|pflege|pflegeanleitung|nachsorge)\b/i.test(norm)) {
    return "de";
  }

  // 2. Dutch (nl)
  if (/\b(goedemorgen|goedemiddag|goedenavond|afspraak|boeken|prijsopgave|hoeveel|openingstijden|alstublieft|bedankt|dankjewel|dank je|locatie|waar is|wat kost|tatoeage|adres & locatie|afspraak maken|verzorging|nazorg|tatoeage verzorging|piercing verzorging)\b/i.test(rawLower) ||
      /\b(goedemorgen|goedemiddag|goedenavond|afspraak|boeken|prijsopgave|hoeveel|openingstijden|alstublieft|bedankt|dankjewel|locatie|adres locatie|afspraak maken|verzorging|nazorg)\b/i.test(norm)) {
    return "nl";
  }

  // 3. English (en)
  if (/\b(hello|good morning|good afternoon|good evening|how much|price|cost|appointment|booking|location|address|thank you|thanks|where is|opening hours|tattoo cost|location & address|book appointment|aftercare|care guide|tattoo care|piercing care)\b/i.test(rawLower) ||
      /\b(hello|good morning|good afternoon|good evening|how much|price|cost|appointment|booking|location|address|thank you|thanks|location address|book appointment|aftercare|care guide|tattoo care|piercing care)\b/i.test(norm)) {
    return "en";
  }

  // 4. Russian (ru)
  if (/[а-яА-ЯёЁ]/.test(text) || /\b(привет|здравствуйте|добрый день|цена|стоимость|сколько стоит|запись|адрес|где|спасибо|о татуировках|адрес и локация|записаться|уход|инструкция по уходу|уход за тату|уход за пирсингом)\b/i.test(rawLower)) {
    return "ru";
  }

  // 5. Turkish (tr)
  if (/\b(merhaba|selam|selamlar|iyi gunler|iyi günler|günaydın|gunaydin|iyi akşamlar|iyi aksamlar|fiyat|fiyatı|ücret|ücreti|kac para|kaç para|ne kadar|randevu|adres|tesekkurler|tesekkur|teşekkürler|kolay gelsin|nerede|saatleri|dövme bilgisi|dovme bilgisi|adres & konum|rezervasyon yap|bakım|bakim|bakımı|bakimi|bakım kılavuzu|bakım rehberi|dövme bakımı|piercing bakımı)\b/i.test(rawLower) ||
      /\b(merhaba|selam|selamlar|iyi gunler|gunaydin|iyi aksamlar|fiyat|fiyati|ucret|ucreti|kac para|ne kadar|randevu|adres|tesekkurler|tesekkur|kolay gelsin|nerede|dovme bilgisi|adres konum|rezervasyon yap|bakim|bakimi|bakim kilavuzu|bakim rehberi|dovme bakimi|piercing bakimi)\b/i.test(norm)) {
    return "tr";
  }

  if (norm === "hallo") return "de_or_nl";

  return null;
}

function detectLanguageFromPhone(phone: string): string {
  const clean = String(phone).replace(/\D/g, "");
  if (clean.startsWith("90")) return "tr";
  if (clean.startsWith("31")) return "nl";
  if (clean.startsWith("49") || clean.startsWith("43") || clean.startsWith("41")) return "de";
  if (clean.startsWith("7") || clean.startsWith("375") || clean.startsWith("380") || clean.startsWith("996") || clean.startsWith("998")) return "ru";
  if (clean.startsWith("33")) return "fr";
  if (clean.startsWith("39")) return "it";
  if (clean.startsWith("34")) return "es";
  return "en";
}

function resolveUserLanguage(phone: string, text: string = "", buttonId: string = ""): string {
  const cleanPhone = String(phone).replace(/\D/g, "");
  const stored = userLanguageMap.get(cleanPhone);

  const textLang = detectLanguageFromText(text, buttonId);

  if (textLang && textLang !== "de_or_nl") {
    userLanguageMap.set(cleanPhone, { code: textLang, timestamp: Date.now() });
    return textLang;
  }

  if (textLang === "de_or_nl") {
    if (stored && (stored.code === "nl" || stored.code === "de")) return stored.code;
    const phoneLang = detectLanguageFromPhone(cleanPhone);
    const finalLang = (phoneLang === "nl") ? "nl" : "de";
    userLanguageMap.set(cleanPhone, { code: finalLang, timestamp: Date.now() });
    return finalLang;
  }

  // Session Continuity: use stored language
  if (stored && stored.code) {
    return stored.code;
  }

  const fallback = detectLanguageFromPhone(cleanPhone);
  userLanguageMap.set(cleanPhone, { code: fallback, timestamp: Date.now() });
  return fallback;
}

function detectLanguage(phone: string, text: string = "", buttonId: string = ""): string {
  return resolveUserLanguage(phone, text, buttonId);
}

function generateCustomerCode(): string {
  const p1 = Math.floor(100 + Math.random() * 900);
  const p2 = Math.floor(10 + Math.random() * 90);
  return `RC-${p1}-${p2}`;
}

function getLanguagePack(lang: string) {
  const ticketCode = generateCustomerCode();

  switch (lang) {
    case 'de':
      return {
        welcomeText: "Willkommen bei Cleopatra Ink Studio! 🎨\n\nBitte wählen Sie eine der folgenden Optionen:",
        btnPriceTitle: "🎨 Tattoo-Info",
        btnLocTitle: "📍 Adresse & Ort",
        btnBookTitle: "📅 Termin buchen",
        priceText: "🎨 **Cleopatra Ink Studio - Tattoo Preisauskunft**\n\nUnsere Tattookosten richten sich nach:\n1. Größe (in cm)\n2. Detaillierungsgrad & Farbe/Blackwork\n3. Körperstelle\n\n💬 Senden Sie uns gerne Ihr Wunschmotiv und die Körperstelle für einen genauen Kostenvoranschlag!",
        locText: "📍 **Cleopatra Ink Studio Manavgat**\n\n🏢 Adresse: Gündoğdu, 110 Evler Sitesi, Manavgat/Antalya\n\n⏰ Öffnungszeiten: Täglich von 09:00 bis 23:00 Uhr",
        locBtnText: "🗺️ Karte Öffnen",
        bookText: "📅 **Cleopatra Ink Studio - Terminvereinbarung**\n\nFür Terminvereinbarungen per WhatsApp:",
        bookBtnText: "📲 Termin buchen",
        bookUrl: `https://wa.me/905524278949?text=${encodeURIComponent(`Hallo, ich möchte einen Tattoo-Termin vereinbaren.\n\n📌 Kundennummer: ${ticketCode}\n(⚠️ HINWEIS: Bitte diese Kundennummer und den Nachrichtentext nicht ändern.)`)}`,
        
        // Bakım (Aftercare) Alanları
        carePromptText: "Welche Behandlung hatten Sie? Bitte wählen Sie die Option, für die Sie die Pflegeanleitung wünschen:",
        btnCareTattooTitle: "🎨 Tattoo-Pflege",
        btnCarePiercingTitle: "💎 Piercing-Pflege",
        tattooCareGuide: "🎨 **Cleopatra Ink - Tattoo-Pflegeanleitung**\n\n1. **Erste 3-4 Stunden:** Entfernen Sie die Schutzfolie vorsichtig nach 3-4 Stunden.\n2. **Reinigung:** Waschen Sie das Tattoo sanft mit lauwarmem Wasser und parfümfreier Seife. Mit einem sauberen Papiertuch trocken tupfen (nicht reiben).\n3. **Creme:** Tragen Sie die empfohlene Tattoo-Creme 3-4 Mal täglich hauchdünn auf.\n4. **Wichtig:** Vermeiden Sie in den ersten 2 Wochen Schwimmbad, Meer, Sauna und direkte Sonne. Schorf niemals abkratzen.\n\n⚠️ **Symptome von Nebenwirkungen:**\n- Zunehmende starke Rötung und Überwärmung\n- Eitriger oder riechender Ausfluss\n- Hohes Fieber oder starke pochende Schmerzen/Schwellung\n\n❓ **Frage:** Treffen 1 oder mehrere dieser Symptome auf Sie zu?",
        piercingCareGuide: "💎 **Cleopatra Ink - Piercing-Pflegeanleitung**\n\n1. **Reinigung:** Reinigen Sie das Piercing 2 Mal täglich mit steriler Kochsalzlösung.\n2. **Berührung:** Berühren oder drehen Sie den Schmuck niemals mit ungewaschenen Händen.\n3. **Schutz:** Vermeiden Sie Schwimmen, Sauna und Reibung durch Kleidung in den ersten 3-4 Wochen.\n4. **Schmuckwechsel:** Entfernen Sie den Schmuck nicht vor der vollständigen Heilung.\n\n⚠️ **Symptome von Nebenwirkungen:**\n- Starke Schwellung oder pochender Schmerz\n- Gelb/grüner eitriger Ausfluss\n- Fieber oder Einwachsen des Schmucks\n\n❓ **Frage:** Treffen 1 oder mehrere dieser Symptome auf Sie zu?",
        btnSympYesTitle: "⚠️ Ja, ich habe welche",
        btnSympNoTitle: "✅ Nein, keine",
        sympYesText: "⚠️ **Wichtiger Hinweis!**\n\nWenn Sie Symptome einer Nebenwirkung oder Infektion bemerken, kontaktieren Sie bitte umgehend unser Experten-Team.\n\nKlicken Sie unten, um unserem Studio-Experten Ihre Situation direkt zu melden:",
        sympYesBtnText: "📲 Experten melden",
        sympYesUrl: `https://wa.me/905524278949?text=${encodeURIComponent("Hallo, ich habe nach meiner Behandlung mögliche Symptome einer Nebenwirkung/Infektion festgestellt. Könnten Sie mir bitte helfen?")}`,
        sympNoText: "✅ **Wunderbar!**\n\nWenn Sie keine Beschwerden haben, setzen Sie die Pflege wie beschrieben fort. Der Heilungsprozess wird reibungslos verlaufen.\n\nKönnen wir Ihnen bei etwas anderem helfen?"
      };
    case 'nl':
      return {
        welcomeText: "Welkom bij Cleopatra Ink Studio! 🎨\n\nKies een van de onderstaande opties:",
        btnPriceTitle: "🎨 Tattoo Info",
        btnLocTitle: "📍 Adres & Locatie",
        btnBookTitle: "📅 Afspraak maken",
        priceText: "🎨 **Cleopatra Ink Studio - Tattoo Prijsinformatie**\n\nOnze tatoeageprijzen zijn afhankelijk van:\n1. Formaat (in cm)\n2. Detailniveau & kleur/blackwork\n3. Plaatsing op het lichaam\n\n💬 Stuur ons gerust uw ontwerp en gewenste plaatsing voor een vrijblijvende prijsopgave!",
        locText: "📍 **Cleopatra Ink Studio Manavgat**\n\n🏢 Adres: Gündoğdu, 110 Evler Sitesi, Manavgat/Antalya\n\n⏰ Openingstijden: Dagelijks geopend van 09:00 tot 23:00 uur",
        locBtnText: "🗺️ Open in Maps",
        bookText: "📅 **Cleopatra Ink Studio - Afspraak maken**\n\nOm een afspraak te maken via WhatsApp:",
        bookBtnText: "📲 Afspraak maken",
        bookUrl: `https://wa.me/905524278949?text=${encodeURIComponent(`Hallo, ik wil graag een tatoeage-afspraak maken.\n\n📌 Klantnummer: ${ticketCode}\n(⚠️ WAARSCHUWING: Wijzig dit klantnummer en de berichttekst a.u.b. niet.)`)}`,
        
        // Bakım (Aftercare) Alanları
        carePromptText: "Welke behandeling heeft u gehad? Kies de gewenste optie voor de verzorgingsinstructies:",
        btnCareTattooTitle: "🎨 Tattoo Verzorging",
        btnCarePiercingTitle: "💎 Piercing Verzorging",
        tattooCareGuide: "🎨 **Cleopatra Ink - Tattoo Verzorgingsgids**\n\n1. **Eerste 3-4 uur:** Verwijder de beschermfolie voorzichtig na 3-4 uur.\n2. **Schoonmaken:** Was de tattoo zachtjes met lauw water en parfumvrije zeep. Dep droog met een schone papieren handdoek (niet wrijven).\n3. **Zalf:** Breng de aanbevolen tattoo-crème 3-4 keer per dag heel dun aan.\n4. **Belangrijk:** Vermijd de eerste 2 weken zwembad, zee, sauna en direct zonlicht. Krab nooit aan korstjes.\n\n⚠️ **Symptomen van bijwerkingen:**\n- Toenemende extreme roodheid en warmte\n- Pus of stinkende afscheiding\n- Hoge koorts of hevige kloppende pijn/zwelling\n\n❓ **Vraag:** Heeft u last van 1 of meer van deze symptomen?",
        piercingCareGuide: "💎 **Cleopatra Ink - Piercing Verzorgingsgids**\n\n1. **Schoonmaken:** Reinig de piercing 2 keer per dag met een sterile fysiologische zoutoplossing.\n2. **Aanraken:** Raak het sieraad nooit aan met ongewassen handen en draai er niet aan.\n3. **Bescherming:** Vermijd zwemmen, sauna en strakke kleding gedurende de eerste 3-4 weken.\n4. **Wisselen:** Verwijder of vervang het sieraad pas als de piercing volledig genezen is.\n\n⚠️ **Symptomen van bijwerkingen:**\n- Ernstige zwelling of kloppende pijn\n- Geel/groene pus en vieze geur\n- Koorts of ingroeien van het sieraad\n\n❓ **Vraag:** Heeft u last van 1 of meer van deze symptomen?",
        btnSympYesTitle: "⚠️ Ja, ik heb symptomen",
        btnSympNoTitle: "✅ Nee, geen",
        sympYesText: "⚠️ **Belangrijke waarschuwing!**\n\nAls u symptomen van bijwerkingen of infectie opmerkt, neem dan direct contact op met onze studiospecialist.\n\nKlik hieronder om uw situatie rechtstreeks aan onze expert te melden:",
        sympYesBtnText: "📲 Meld aan expert",
        sympYesUrl: `https://wa.me/905524278949?text=${encodeURIComponent("Hallo, ik merk mogelijke symptomen van een bijwerking/infectie op na mijn behandeling. Kan ik ondersteuning krijgen?")}`,
        sympNoText: "✅ **Geweldig!**\n\nAls u geen klachten heeft, ga dan door met de verzorging zoals beschreven. Het genezingsproces zal voorspoedig verlopen.\n\nKunnen we u nog ergens anders mee helpen?"
      };
    case 'en':
      return {
        welcomeText: "Welcome to Cleopatra Ink Studio! 🎨\n\nPlease select an option from the buttons below:",
        btnPriceTitle: "🎨 Tattoo Info",
        btnLocTitle: "📍 Location & Address",
        btnBookTitle: "📅 Book Appointment",
        priceText: "🎨 **Cleopatra Ink Studio - Tattoo Pricing Information**\n\nOur tattoo prices depend on:\n1. Size (in cm or inches)\n2. Detail complexity & color vs blackwork\n3. Placement on the body\n\n💬 Send us your reference image and desired placement, and our team will give you a custom price quote!",
        locText: "📍 **Cleopatra Ink Studio Manavgat**\n\n🏢 Address: Gündoğdu, 110 Evler Sitesi, Manavgat/Antalya\n\n⏰ Opening Hours: Everyday 09:00 to 23:00",
        locBtnText: "🗺️ Open Map",
        bookText: "📅 **Cleopatra Ink Studio - Book Appointment**\n\nFor appointment bookings via WhatsApp:",
        bookBtnText: "📲 Book Appointment",
        bookUrl: `https://wa.me/905524278949?text=${encodeURIComponent(`Hello, I would like to book a tattoo appointment.\n\n📌 Customer ID: ${ticketCode}\n(⚠️ WARNING: Please do not edit or remove this customer ID number.)`)}`,
        
        // Bakım (Aftercare) Alanları
        carePromptText: "Which procedure did you get? Please select the option you need aftercare instructions for:",
        btnCareTattooTitle: "🎨 Tattoo Aftercare",
        btnCarePiercingTitle: "💎 Piercing Aftercare",
        tattooCareGuide: "🎨 **Cleopatra Ink - Tattoo Aftercare Guide**\n\n1. **First 3-4 Hours:** Gently remove the protective wrap after 3-4 hours.\n2. **Washing:** Wash the area gently with lukewarm water and fragrance-free antibacterial soap. Pat dry with a clean paper towel (do not rub).\n3. **Ointment:** Apply a very thin layer of recommended aftercare cream 3-4 times daily.\n4. **Important:** Avoid swimming pools, oceans, saunas, and direct sunlight for the first 2 weeks. Never pick or scratch scabs.\n\n⚠️ **Side Effect Symptoms:**\n- Severe & spreading redness or extreme heat\n- Pus/foul-smelling discharge\n- High fever or intense throbbing pain/swelling\n\n❓ **Question:** Do you have 1 or more of these side effect symptoms?",
        piercingCareGuide: "💎 **Cleopatra Ink - Piercing Aftercare Guide**\n\n1. **Cleaning:** Clean the piercing twice daily using a sterile saline solution.\n2. **Touching:** Never touch or rotate the jewelry with unwashed hands.\n3. **Protection:** Avoid swimming, saunas, and tight clothing for the first 3-4 weeks.\n4. **Changing:** Do not remove or swap jewelry until fully healed.\n\n⚠️ **Side Effect Symptoms:**\n- Severe swelling or throbbing pain\n- Yellow/green pus discharge or bad odor\n- Fever or jewelry embedding into skin\n\n❓ **Question:** Do you have 1 or more of these side effect symptoms?",
        btnSympYesTitle: "⚠️ Yes, I do",
        btnSympNoTitle: "✅ No, none",
        sympYesText: "⚠️ **Important Notice!**\n\nIf you are experiencing symptoms of side effects or infection, please contact our studio specialists immediately.\n\nClick the button below to inform our expert about your condition:",
        sympYesBtnText: "📲 Report to Expert",
        sympYesUrl: `https://wa.me/905524278949?text=${encodeURIComponent("Hello, I am noticing side effect/infection symptoms after my procedure. Can I get immediate assistance?")}`,
        sympNoText: "✅ **Great!**\n\nIf you have no adverse symptoms, continue following the aftercare routine as instructed. Your healing process will go smoothly.\n\nCan we assist you with anything else?"
      };
    case 'ru':
      return {
        welcomeText: "Добро пожаловать в Cleopatra Ink Studio! 🎨\n\nВыберите нужный раздел из кнопок ниже:",
        btnPriceTitle: "🎨 О татуировках",
        btnLocTitle: "📍 Адрес и локация",
        btnBookTitle: "📅 Записаться",
        priceText: "🎨 **Cleopatra Ink Studio - Информация о стоимости**\n\nСтоимость татуировки зависит от:\n1. Размера (в см)\n2. Сложности детализации и стиля\n3. Места нанесения на теле\n\n💬 Отправьте нам ваш эскиз и место нанесения, и наши мастера рассчитают точную стоимость!",
        locText: "📍 **Cleopatra Ink Studio Manavgat**\n\n🏢 Адрес: Gündoğdu, 110 Evler Sitesi, Manavgat/Antalya\n\n⏰ Часы работы: Ежедневно с 09:00 до 23:00",
        locBtnText: "🗺️ Открыть карту",
        bookText: "📅 **Cleopatra Ink Studio - Запись на сеанс**\n\nДля записи на сеанс через WhatsApp:",
        bookBtnText: "📲 Записаться",
        bookUrl: `https://wa.me/905524278949?text=${encodeURIComponent(`Здравствуйте, хочу записаться на сеанс тату.\n\n📌 Номер клиента: ${ticketCode}\n(⚠️ ВНИМАНИЕ: Пожалуйста, не изменяйте и не удаляйте этот номер клиента.)`)}`,
        
        // Bakım (Aftercare) Alanları
        carePromptText: "Какую процедуру вы проходили? Выберите нужный раздел для получения инструкции по уходу:",
        btnCareTattooTitle: "🎨 Уход за тату",
        btnCarePiercingTitle: "💎 Пирсинг уход",
        tattooCareGuide: "🎨 **Cleopatra Ink - Инструкция по уходу за тату**\n\n1. **Первые 3-4 часа:** Осторожно снимите защитную пленку через 3-4 часа.\n2. **Промывание:** Промойте татуировку теплой водой с антибактериальным мылом без отдушек. Промокните чистым бумажным полотенцем (не трите).\n3. **Крем:** Наносите рекомендованный крем тонким слоем 3-4 раза в день.\n4. **Важно:** Избегайте бассейнов, моря, саун и солнца первые 2 недели. Не сдирайте корочки.\n\n⚠️ **Симптомы побочных эффектов:**\n- Сильное и нарастающее покраснение/жар\n- Гнойные или неприятно пахнущие выделения\n- Высокая температура, сильная пульсирующая боль/отек\n\n❓ **Вопрос:** Наблюдаются ли у вас 1 или более из этих симптомов?",
        piercingCareGuide: "💎 **Cleopatra Ink - Инструкция по уходу за пирсингом**\n\n1. **Очищение:** Промывайте пирсинг 2 раза в день стерильным физраствором.\n2. **Прикосновения:** Не трогайте и не крутите украшение немытыми руками.\n3. **Защита:** Избегайте плавания, сауны и трения одеждой первые 3-4 недели.\n4. **Смена украшения:** Не снимайте украшение до полного заживления.\n\n⚠️ **Симптомы побочных эффектов:**\n- Сильный отек или пульсирующая боль\n- Желто-зеленые гнойные выделения\n- Температура или врастание украшения\n\n❓ **Вопрос:** Наблюдаются ли у вас 1 или более из этих симптомов?",
        btnSympYesTitle: "⚠️ Да, есть",
        btnSympNoTitle: "✅ Нет, всё ОК",
        sympYesText: "⚠️ **Важное предупреждение!**\n\nПри наличии симптомов побочных эффектов или инфекции необходимо немедленно связаться с мастером нашей студии.\n\nНажмите кнопку ниже, чтобы сообщить эксперту о вашем состоянии:",
        sympYesBtnText: "📲 Связаться с мастером",
        sympYesUrl: `https://wa.me/905524278949?text=${encodeURIComponent("Здравствуйте, у меня появились симптомы побочных эффектов/инфекции после процедуры. Могу ли я получить помощь?")}`,
        sympNoText: "✅ **Отлично!**\n\nЕсли у вас нет неприятных симптомов, продолжайте уход по инструкции. Заживление пройдет успешно.\n\nМожем ли мы помочь вам чем-то еще?"
      };
    case 'tr':
    default:
      return {
        welcomeText: "Merhaba! Cleopatra Ink Studio'ya hoş geldiniz. 🎨\n\nAşağıdaki butonlardan öğrenmek istediğiniz konuyu tek tıkla seçebilirsiniz:",
        btnPriceTitle: "🎨 Dövme Bilgisi",
        btnLocTitle: "📍 Adres & Konum",
        btnBookTitle: "📅 Rezervasyon",
        priceText: "🎨 **Cleopatra Ink Studio - Dövme Fiyat Bilgisi**\n\nDövme fiyatlarımız tasarımın boyutu (cm), detay seviyesi, renk durumu ve yapılacağı vücut bölgesine göre belirlenmektedir.\n\n💬 Aklınızdaki görseli ve yaptırmak istediğiniz bölgeyi iletirseniz tasarımcılarımız size özel net fiyat bilgisi verecektir!",
        locText: "📍 **Cleopatra Ink Studio Manavgat**\n\n🏢 Adres: Gündoğdu, 110 Evler Sitesi, Manavgat/Antalya\n\n⏰ Çalışma Saatleri: Haftanın her günü 09:00 - 23:00",
        locBtnText: "🗺️ Haritada Gör",
        bookText: "📅 **Cleopatra Ink Studio - Randevu & Rezervasyon**\n\nRandevu almak ve müsait saatleri öğrenmek için direkt WhatsApp hattımıza ulaşabilirsiniz:",
        bookBtnText: "📲 Rezervasyon Yap",
        bookUrl: `https://wa.me/905524278949?text=${encodeURIComponent(`Merhaba, dövme rezervasyonu yaptırmak istiyorum.\n\n📌 Müşteri Numarası: ${ticketCode}\n(⚠️ UYARI: Lütfen bu müşteri numarasını ve mesaj içeriğini değiştirmeden gönderiniz.)`)}`,

        // Bakım (Aftercare) Alanları
        carePromptText: "İşleminiz neydi? Lütfen bakım kılavuzunu almak istediğiniz uygulamayı seçiniz:",
        btnCareTattooTitle: "🎨 Dövme Bakımı",
        btnCarePiercingTitle: "💎 Piercing Bakımı",
        tattooCareGuide: "🎨 **Cleopatra Ink - Dövme Bakım Kılavuzu**\n\n1. **İlk 3-4 Saat:** Stüdyoda takılan koruyucu folyoyu/bandı 3-4 saat sonra nazikçe çıkarın.\n2. **Yıkama:** Bölgeyi ılık su ve kokusuz antibakteriyel sabun ile nazikçe yıkayın, temiz bir kağıt havlu ile tampon yaparak kurulayın (asla sürtmeyin).\n3. **Krem:** Önerilen bakım kremini günde 3-4 defa çok ince bir tabaka halinde sürün.\n4. **Dikkat Edilmesi Gerekenler:** İlk 2 hafta havuza, denize, saunaya girmeyin; doğrudan güneş ışığından koruyun ve oluşan kabukları kesinlikle soymayın.\n\n⚠️ **Yan Etki Belirtileri:**\n- Bölgede aşırı ve giderek artan sıcaklık/kızarıklık\n- İltihaplı/kötü kokulu akıntı\n- Yüksek ateş veya şiddetli zonklama/şişlik\n\n❓ **Soru:** Yukarıdaki yan etki belirtilerinden 1 veya daha fazlasına sahip misiniz?",
        piercingCareGuide: "💎 **Cleopatra Ink - Piercing Bakım Kılavuzu**\n\n1. **Temizlik:** Günde 2 defa steril serum fizyolojik veya tuzlu su çözeltisi ile piercing bölgesini nazikçe temizleyin.\n2. **Dokunma:** Elleriniz tam yıkanmadan piercing takısına kesinlikle dokunmayın ve takıyı çevirmeyin/oynatmayın.\n3. **Koruma:** İlk 3-4 hafta deniz, havuz ve saunadan uzak durun. Kıyafet giyerken takılmamasına dikkat edin.\n4. **Takı Değişimi:** İyileşme tamamlanmadan (ortalama 4-8 hafta) takıyı çıkarmayın veya değiştirmeyin.\n\n⚠️ **Yan Etki Belirtileri:**\n- Bölgede aşırı şişlik, zonklayan ağrı\n- Sarı/yeşil iltihaplı akıntı ve kötü koku\n- Yüksek ateş veya piercing takısının et içine gömülmesi\n\n❓ **Soru:** Yukarıdaki yan etki belirtilerinden 1 veya daha fazlasına sahip misiniz?",
        btnSympYesTitle: "⚠️ Evet, var",
        btnSympNoTitle: "✅ Hayır, yok",
        sympYesText: "⚠️ **Önemli Uyarı!**\n\nYan etki veya enfeksiyon belirtisi hissettiğinizde stüdyo uzmanlarımızla hemen iletişime geçmeniz gerekmektedir.\n\nLütfen aşağıdaki butona tıklayarak durumunuzu ana hat üzerinden stüdyo uzmanımıza bildirin:",
        sympYesBtnText: "📲 Uzmana Bildir",
        sympYesUrl: `https://wa.me/905524278949?text=${encodeURIComponent("Merhaba, işlem sonrası bakımımda yan etki/enfeksiyon belirtisi gözlemledim. Destek alabilir miyim?")}`,
        sympNoText: "✅ **Harika!**\n\nHerhangi bir olumsuz belirtiniz yoksa bakım adımlarını tarif edildiği şekilde uygulamaya devam edin. İyileşme süreciniz sorunsuz tamamlanacaktır.\n\nBaşka bir konuda yardımcı olabilir miyiz?"
      };
  }
}

async function sendWhatsAppPayload(payload: any) {
  const metaToken = Deno.env.get("META_ACCESS_TOKEN") || "EAAO4OmZBwpzsBSGfHh9ozCJOJuu8XjDwfiWqPIKzyj3yHkgdd43JykeBiZCoZAvQBFEbrbcoLcxs82PZAELYKo8iLT5OFuboIWd4Q0swS5aSDfYJjk7EW8SeHeHaVYdvEOsMqJCHJo87MuFZAZBIZCIZBTW2pQDJAIniAmNyFWWZAOlZBD4jWLgDgV8JFkBjaUwdTu4QZDZD";
  const metaPhoneId = Deno.env.get("META_PHONE_ID") || "1259356973928757";

  if (!metaToken || !metaPhoneId) return null;

  try {
    const res = await fetch(`https://graph.facebook.com/v20.0/${metaPhoneId}/messages`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${metaToken}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    console.log("📲 Meta API Yanıtı:", JSON.stringify(data));

    if (res.status >= 400 && payload.type === 'interactive' && payload.interactive?.type === 'cta_url') {
      console.warn("⚠️ cta_url buton hatası alındı, standart metin moduna düşülüyor...");
      const textBody = (payload.interactive.body?.text || '') + "\n\n" + (payload.interactive.action?.parameters?.url || '');
      return await sendWhatsAppPayload({
        messaging_product: "whatsapp",
        to: payload.to,
        type: "text",
        text: { preview_url: true, body: textBody }
      });
    }

    return data;
  } catch (err) {
    console.error("❌ Meta API Send Error:", err.message);
    return null;
  }
}

Deno.serve(async (req) => {
  const { method } = req;
  const url = new URL(req.url);

  // 1. GET İsteği - Meta Webhook Doğrulaması
  if (method === "GET") {
    const mode = url.searchParams.get("hub.mode");
    const token = url.searchParams.get("hub.verify_token");
    const challenge = url.searchParams.get("hub.challenge");

    const expectedToken = Deno.env.get("WHATSAPP_VERIFY_TOKEN");

    if (mode === "subscribe" && token === expectedToken) {
      console.log("✅ Webhook doğrulaması başarılı!");
      return new Response(challenge, {
        status: 200,
        headers: { "Content-Type": "text/plain; charset=utf-8" },
      });
    } else {
      console.error("❌ Webhook doğrulaması başarısız!");
      return new Response("Forbidden: Verification token mismatch", { status: 403 });
    }
  }

  // 2. POST İsteği - Gelen Mesajlar ve Olaylar
  if (method === "POST") {
    try {
      const body = await req.json();

      console.log("📩 Gelen WhatsApp Webhook Bildirimi:");
      console.log(JSON.stringify(body, null, 2));

      const supabaseUrl = Deno.env.get("SUPABASE_URL");
      const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || Deno.env.get("SUPABASE_ANON_KEY");
      const displayPhone = Deno.env.get("META_PHONE_ID") || "1259356973928757";

      const change = body.entry?.[0]?.changes?.[0]?.value;

      // A) Gelen Mesajların İşlenmesi
      if (change?.messages?.length > 0) {
        for (const msg of change.messages) {
          const msgId = msg.id;
          const from = msg.from;
          const timestamp = parseInt(msg.timestamp || "0") * 1000 || Date.now();

          let textContent = "";
          let buttonId = "";

          if (msg.type === "text") {
            textContent = msg.text?.body || "";
          } else if (msg.type === "interactive") {
            if (msg.interactive?.button_reply) {
              buttonId = msg.interactive.button_reply.id || "";
              textContent = msg.interactive.button_reply.title || buttonId;
            } else if (msg.interactive?.list_reply) {
              buttonId = msg.interactive.list_reply.id || "";
              textContent = msg.interactive.list_reply.title || buttonId;
            }
          } else if (msg.type === "button") {
            buttonId = msg.button?.payload || "";
            textContent = msg.button?.text || buttonId;
          } else {
            textContent = `[${msg.type ? msg.type.toUpperCase() : "MEDYA"}]`;
          }

          console.log(`💬 Gelen Mesaj [${from}] (ButtonId: "${buttonId}"): "${textContent}"`);

          // Dil Tespiti Yapalım
          const userLang = detectLanguage(from, textContent, buttonId);
          const pack = getLanguagePack(userLang);

          console.log(`🌍 Tespit Edilen Dil [${from}]: ${userLang.toUpperCase()}`);

          // 1. Supabase 'messages' Tablosuna Gelen Mesajı Kaydetme
          if (supabaseUrl && serviceKey) {
            try {
              const dbRes = await fetch(`${supabaseUrl}/rest/v1/messages`, {
                method: "POST",
                headers: {
                  "apikey": serviceKey,
                  "Authorization": `Bearer ${serviceKey}`,
                  "Content-Type": "application/json",
                  "Prefer": "resolution=merge-duplicates"
                },
                body: JSON.stringify({
                  id: msgId,
                  from: from,
                  to: change.metadata?.display_phone_number || displayPhone,
                  text: textContent,
                  timestamp: timestamp,
                  direction: "incoming",
                  status: "received"
                })
              });
              console.log("💾 Supabase DB Gelen Mesaj Kayıt Status:", dbRes.status);
            } catch (e) {
              console.error("❌ Supabase DB Gelen Mesaj Kayıt Hatası:", e.message);
            }
          }

          // 2. Çok Dilli Etkileşimli Butonlu Otomatik Yanıt Motoru
          const lowerText = textContent.toLowerCase().trim();
          let replyPayload = null;
          let replyTextForDb = "";

          // KURAL 0: Opt-Out (DUR / STOP / İPTAL) & Opt-In (BAŞLAT / START)
          const optOutKeywords = ['dur', 'durdur', 'stop', 'unsubscribe', 'stoppen', 'halt', 'iptal', 'отписаться', 'стоп', 'abbrechen', 'opt_out', 'optout', 'cikis', 'çıkış', 'marketing_opt_out'];
          const optInKeywords = ['baslat', 'başlat', 'start', 'anmelden', 'старт', 'opt_in', 'optin', 'tekrar baslat', 'katil', 'katıl'];

          const isOptOut = optOutKeywords.some(kw => lowerText === kw || lowerText.startsWith(kw + ' ') || lowerText.endsWith(' ' + kw) || buttonId === kw || buttonId.includes('opt_out') || buttonId.includes('stop'));
          const isOptIn = optInKeywords.some(kw => lowerText === kw || lowerText.startsWith(kw + ' ') || lowerText.endsWith(' ' + kw) || buttonId === kw || buttonId.includes('opt_in') || buttonId.includes('start'));

          if (isOptOut) {
            const optOutReplies: Record<string, string> = {
              tr: "Talebiniz alınmıştır. Cleopatra Ink stüdyomuzdan artık otomatik kampanya veya hatırlatma mesajı almayacaksınız. Dilediğiniz zaman tekrar 'BAŞLAT' yazarak bildirimleri açabilirsiniz. İyi günler dileriz! 🖤",
              de: "Ihre Anfrage wurde entgegengenommen. Sie erhalten keine weiteren automatischen Nachrichten mehr von Cleopatra Ink. Schreiben Sie jederzeit 'START', um wieder beizutreten. Einen schönen Tag! 🖤",
              nl: "Uw verzoek is ontvangen. U ontvangt geen automatische berichten meer van Cleopatra Ink. Stuur 'START' om u weer aan te melden. Fijne dag! 🖤",
              en: "Your request has been received. You will no longer receive automated messages from Cleopatra Ink. You can text 'START' anytime to opt back in. Have a great day! 🖤",
              ru: "Ваш запрос принят. Вы больше не будете получать рассылку от Cleopatra Ink. Напишите 'СТАРТ' в любое время, чтобы возобновить. Хорошего дня! 🖤"
            };
            replyTextForDb = optOutReplies[userLang] || optOutReplies.en;
            replyPayload = {
              messaging_product: "whatsapp",
              to: from,
              type: "text",
              text: { preview_url: true, body: replyTextForDb }
            };
          } else if (isOptIn) {
            const optInReplies: Record<string, string> = {
              tr: "Tekrar hoş geldiniz! 🎨 Cleopatra Ink stüdyosu bildirimleriniz başarıyla yeniden aktif edildi. Size nasıl yardımcı olabiliriz?",
              de: "Willkommen zurück! 🎨 Ihre Cleopatra Ink Benachrichtigungen wurden erfolgreich reaktiviert. Wie können wir Ihnen helfen?",
              nl: "Welkom terug! 🎨 Uw Cleopatra Ink meldingen zijn succesvol opnieuw geactiveerd. Hoe kunnen we u helpen?",
              en: "Welcome back! 🎨 Your Cleopatra Ink notifications have been successfully reactivated. How can we help you?",
              ru: "С возвращением! 🎨 Ваши уведомления Cleopatra Ink успешно активированы. Чем мы можем вам помочь?"
            };
            replyTextForDb = optInReplies[userLang] || optInReplies.en;
            replyPayload = {
              messaging_product: "whatsapp",
              to: from,
              type: "text",
              text: { preview_url: true, body: replyTextForDb }
            };
          }
          // KURAL 1: Karşılama / Selamlaşma
          else if (buttonId === "btn_start" || /\b(merhaba|selam|selamlar|slm|mrb|sa|s\.a|iyi günler|günaydın|iyi akşamlar|hello|hi|hey|hallo|hoi|привет|здравствуйте|guten tag|guten morgen|guten abend)\b/i.test(lowerText)) {
            replyTextForDb = pack.welcomeText;
            replyPayload = {
              messaging_product: "whatsapp",
              to: from,
              type: "interactive",
              interactive: {
                type: "button",
                body: { text: replyTextForDb },
                action: {
                  buttons: [
                    { type: "reply", reply: { id: `btn_fiyat_${userLang}`, title: pack.btnPriceTitle.slice(0, 20) } },
                    { type: "reply", reply: { id: `btn_adres_${userLang}`, title: pack.btnLocTitle.slice(0, 20) } },
                    { type: "reply", reply: { id: `btn_randevu_${userLang}`, title: pack.btnBookTitle.slice(0, 20) } }
                  ]
                }
              }
            };
          }
          // KURAL 5 (ÖNCELİKLİ): Bakım Kılavuzu + Yan Etki Belirtileri + Soru (Dövme veya Piercing Seçildiğinde)
          else if (buttonId.startsWith("btn_care_tattoo") || buttonId.startsWith("btn_care_piercing") || lowerText.includes("dövme bakımı") || lowerText.includes("piercing bakımı") || lowerText.includes("tattoo care") || lowerText.includes("piercing care") || lowerText.includes("tattoo-pflege") || lowerText.includes("piercing-pflege") || lowerText.includes("tattoo verzorging") || lowerText.includes("piercing verzorging") || lowerText.includes("уход за тату") || lowerText.includes("уход за пирсингом")) {
            const isPiercing = buttonId.startsWith("btn_care_piercing") || lowerText.includes("piercing");
            replyTextForDb = isPiercing ? pack.piercingCareGuide : pack.tattooCareGuide;
            replyPayload = {
              messaging_product: "whatsapp",
              to: from,
              type: "interactive",
              interactive: {
                type: "button",
                body: { text: replyTextForDb },
                action: {
                  buttons: [
                    { type: "reply", reply: { id: `btn_symp_yes_${userLang}`, title: pack.btnSympYesTitle.slice(0, 20) } },
                    { type: "reply", reply: { id: `btn_symp_no_${userLang}`, title: pack.btnSympNoTitle.slice(0, 20) } }
                  ]
                }
              }
            };
          }
          // KURAL 6: Bakım Genel Talebi / "İşleminiz Neydi?" Sorusunu Sor (Genel Bakım Kelimelerinde)
          else if (buttonId.startsWith("btn_care_menu") || buttonId === "btn_care" || (/\b(bakım|bakim|bakımı|bakimi|bakım rehberi|bakım kılavuzu|pflege|pflegeanleitung|nachsorge|verzorging|nazorg|aftercare|care guide|уход|инструкция по уходу)\b/i.test(lowerText) && !lowerText.includes("dövme") && !lowerText.includes("piercing") && !lowerText.includes("tattoo") && !lowerText.includes("tätowierung") && !lowerText.includes("tatoeage"))) {
            replyTextForDb = pack.carePromptText;
            replyPayload = {
              messaging_product: "whatsapp",
              to: from,
              type: "interactive",
              interactive: {
                type: "button",
                body: { text: replyTextForDb },
                action: {
                  buttons: [
                    { type: "reply", reply: { id: `btn_care_tattoo_${userLang}`, title: pack.btnCareTattooTitle.slice(0, 20) } },
                    { type: "reply", reply: { id: `btn_care_piercing_${userLang}`, title: pack.btnCarePiercingTitle.slice(0, 20) } }
                  ]
                }
              }
            };
          }
          // KURAL 7 (YENİ): Yan Etki Belirtisi -> EVET (Ana Numaraya Yönlendirme)
          else if (buttonId.startsWith("btn_symp_yes") || (/\b(evet|yes|ja|да)\b/i.test(lowerText) && (buttonId.includes("symp") || lowerText.includes("belirti") || lowerText.includes("symptom") || lowerText.includes("var")))) {
            replyTextForDb = pack.sympYesText;
            replyPayload = {
              messaging_product: "whatsapp",
              to: from,
              type: "interactive",
              interactive: {
                type: "cta_url",
                body: { text: replyTextForDb },
                action: {
                  name: "cta_url",
                  parameters: {
                    display_text: pack.sympYesBtnText.slice(0, 20),
                    url: pack.sympYesUrl
                  }
                }
              }
            };
          }
          // KURAL 8 (YENİ): Yan Etki Belirtisi -> HAYIR (Normal Bilgilendirme)
          else if (buttonId.startsWith("btn_symp_no") || (/\b(hayır|hayir|no|nein|nee|нет)\b/i.test(lowerText) && (buttonId.includes("symp") || lowerText.includes("belirti") || lowerText.includes("symptom") || lowerText.includes("yok")))) {
            replyTextForDb = pack.sympNoText;
            replyPayload = {
              messaging_product: "whatsapp",
              to: from,
              type: "interactive",
              interactive: {
                type: "button",
                body: { text: replyTextForDb },
                action: {
                  buttons: [
                    { type: "reply", reply: { id: `btn_randevu_${userLang}`, title: pack.btnBookTitle.slice(0, 20) } },
                    { type: "reply", reply: { id: `btn_adres_${userLang}`, title: pack.btnLocTitle.slice(0, 20) } }
                  ]
                }
              }
            };
          }
          // KURAL 2: Fiyat / Ücret / Dövme Bilgisi
          else if (buttonId.startsWith("btn_fiyat") || lowerText.includes("dövme bilgisi") || lowerText.includes("tattoo info") || lowerText.includes("tattoo-info") || /\b(fiyat|fiyatı|ücret|ücreti|kaç para|kac para|ne kadar|maliyet|bütçe|price|cost|preis|kosten|prijs|цена|стоимость)\b/i.test(lowerText)) {
            replyTextForDb = pack.priceText;
            replyPayload = {
              messaging_product: "whatsapp",
              to: from,
              type: "interactive",
              interactive: {
                type: "button",
                body: { text: replyTextForDb },
                action: {
                  buttons: [
                    { type: "reply", reply: { id: `btn_adres_${userLang}`, title: pack.btnLocTitle.slice(0, 20) } },
                    { type: "reply", reply: { id: `btn_randevu_${userLang}`, title: pack.btnBookTitle.slice(0, 20) } }
                  ]
                }
              }
            };
          }
          // KURAL 3: Adres & Konum Bilgisi (CTA Maps Link Butonu)
          else if (buttonId.startsWith("btn_adres") || lowerText.includes("adres & konum") || lowerText.includes("location") || lowerText.includes("adresse") || lowerText.includes("адрес") || /\b(adres|konum|nerede|neresi|stüdyo|yeriniz|harita|location|address|ort|locatie|адрес)\b/i.test(lowerText)) {
            replyTextForDb = pack.locText;
            replyPayload = {
              messaging_product: "whatsapp",
              to: from,
              type: "interactive",
              interactive: {
                type: "cta_url",
                body: { text: replyTextForDb },
                action: {
                  name: "cta_url",
                  parameters: {
                    display_text: pack.locBtnText.slice(0, 20),
                    url: "https://www.google.com/maps/search/?api=1&query=G%C3%BCndo%C4%9Fdu,+110+Evler+Sitesi,+Manavgat+Antalya"
                  }
                }
              }
            };
          }
          // KURAL 4: Rezervasyon & Randevu (CTA WhatsApp Link Butonu)
          else if (buttonId.startsWith("btn_randevu") || lowerText.includes("rezervasyon") || lowerText.includes("termin") || lowerText.includes("afspraak") || lowerText.includes("booking") || lowerText.includes("запись") || /\b(randevu|müsait|musait|saat|gün|gun|tarih|boş yer|appointment|booking|termin|afspraak|запись)\b/i.test(lowerText)) {
            replyTextForDb = pack.bookText;
            replyPayload = {
              messaging_product: "whatsapp",
              to: from,
              type: "interactive",
              interactive: {
                type: "cta_url",
                body: { text: replyTextForDb },
                action: {
                  name: "cta_url",
                  parameters: {
                    display_text: pack.bookBtnText.slice(0, 20),
                    url: pack.bookUrl
                  }
                }
              }
            };
          }

          // Otomatik Yanıtı Gönder ve DB'ye Kaydet
          if (replyPayload) {
            console.log(`🤖 Auto-Reply Gönderiliyor [${from}] (Dil: ${userLang.toUpperCase()})...`);
            const metaData = await sendWhatsAppPayload(replyPayload);

            const outgoingMsgId = metaData?.messages?.[0]?.id || `out-${Date.now()}`;

            if (supabaseUrl && serviceKey) {
              try {
                await fetch(`${supabaseUrl}/rest/v1/messages`, {
                  method: "POST",
                  headers: {
                    "apikey": serviceKey,
                    "Authorization": `Bearer ${serviceKey}`,
                    "Content-Type": "application/json",
                    "Prefer": "resolution=merge-duplicates"
                  },
                  body: JSON.stringify({
                    id: outgoingMsgId,
                    from: change.metadata?.display_phone_number || displayPhone,
                    to: from,
                    text: replyTextForDb,
                    timestamp: Date.now(),
                    direction: "outgoing",
                    status: metaData?.messages?.[0]?.id ? "sent" : "failed"
                  })
                });
                console.log("💾 Outgoing Auto-Reply DB'ye Başarıyla Kaydedildi.");
              } catch (e) {
                console.error("❌ Outgoing DB Kayıt Hatası:", e.message);
              }
            }
          }
        }
      }

      // B) Mesaj İletim Durumlarının Güncellenmesi (sent, delivered, read)
      if (change?.statuses?.length > 0) {
        for (const statusObj of change.statuses) {
          const statusId = statusObj.id;
          const newStatus = statusObj.status;

          console.log(`🔄 Mesaj Durum Güncellemesi [${statusId}]: ${newStatus}`);

          if (supabaseUrl && serviceKey) {
            await fetch(`${supabaseUrl}/rest/v1/messages?id=eq.${statusId}`, {
              method: "PATCH",
              headers: {
                "apikey": serviceKey,
                "Authorization": `Bearer ${serviceKey}`,
                "Content-Type": "application/json"
              },
              body: JSON.stringify({ status: newStatus })
            }).catch(e => console.error("❌ Status Update Error:", e.message));
          }
        }
      }

      return new Response(
        JSON.stringify({ status: "ok" }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }
      );
    } catch (error) {
      console.error("❌ POST isteği işlenirken hata oluştu:", error);
      return new Response(
        JSON.stringify({ error: "Invalid JSON body" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }
  }

  return new Response("Method Not Allowed", { status: 405 });
});
