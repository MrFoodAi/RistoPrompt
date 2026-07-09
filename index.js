/**
 * RistoPrompt — Worker proxy per validazione licenza Lemon Squeezy
 *
 * Perché esiste: il browser blocca le chiamate dirette da index.html
 * verso api.lemonsqueezy.com per CORS (vedi conversazione precedente).
 * Questo Worker non contiene segreti: inoltra solo license_key e
 * restituisce la risposta con gli header CORS aperti.
 *
 * COME DEPLOYARLO (da Termux):
 * 1. npm install -g wrangler
 * 2. wrangler login   (apre il browser per autenticarti su Cloudflare, account gratuito)
 * 3. wrangler init ristoprompt-license-proxy   (oppure crea una cartella e incolla questo file come src/index.js)
 * 4. wrangler deploy
 * 5. Otterrai un URL tipo: https://ristoprompt-license-proxy.<tuo-account>.workers.dev
 * 6. Incolla quell'URL in index.html al posto di WORKER_URL_DA_SOSTITUIRE
 */

export default {
  async fetch(request) {
    // Risposta alle richieste "preflight" OPTIONS del browser
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
        },
      });
    }

    if (request.method !== 'POST') {
      return new Response('Metodo non consentito', { status: 405 });
    }

    try {
      const body = await request.text(); // es. "license_key=XXXX"

      const lsResponse = await fetch('https://api.lemonsqueezy.com/v1/licenses/validate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'application/json',
        },
        body: body,
      });

      const data = await lsResponse.text();

      return new Response(data, {
        status: lsResponse.status,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      });
    } catch (err) {
      return new Response(JSON.stringify({ valid: false, error: 'Proxy error' }), {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      });
    }
  },
};
