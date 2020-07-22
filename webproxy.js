// conqbladestats.com

addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request))
})

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, HEAD, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

/**
 * Respond to the request
 * @param {Request} request
 */
async function handleRequest(request) {
  const { pathname } = new URL(request.url);
  const path = pathname === '/' ? '/index.z5k9cv1.html' : pathname;

  let cache = caches.default;
  let response = await cache.match(request);

  if (!response) {
    response = await fetch(`REPLACE_ME_WITH_ORIGIN${path}`);
    await cache.put(request, response.clone());
  }

  return response;
}