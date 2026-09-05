/**
 * Cleopatra Extension Service Worker
 * Handles session keep-alive alarms and background tasks securely.
 */

const ALARM_NAME = 'keepAlivePing';
const PING_INTERVAL_MINUTES = 15;
const PING_URL = 'https://t.cleopatraink.com/api/user/status';
const TIMEOUT_MS = 10000;

// Alarm listener setup
chrome.alarms.create(ALARM_NAME, {
  periodInMinutes: PING_INTERVAL_MINUTES
});

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === ALARM_NAME) {
    pingSession();
  }
});

/**
 * Sends a lightweight GET request to Cleopatra portal to maintain active session.
 */
async function pingSession() {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const response = await fetch(PING_URL, {
      method: 'GET',
      headers: {
        'Accept': 'application/json'
      },
      signal: controller.signal
    });

    const timestamp = new Date().toLocaleTimeString();
    if (response.ok) {
      console.log(`[${timestamp}] Oturum canlı tutuldu (Status 200).`);
    } else {
      console.warn(`[${timestamp}] Ping yanıtı olumsuz, status: ${response.status}`);
    }
  } catch (error) {
    const timestamp = new Date().toLocaleTimeString();
    if (error.name === 'AbortError') {
      console.error(`[${timestamp}] Ping zaman aşımına uğradı (${TIMEOUT_MS}ms).`);
    } else {
      console.error(`[${timestamp}] Ping isteği başarısız:`, error);
    }
  } finally {
    clearTimeout(timeoutId);
  }
}
