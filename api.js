addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request))
})

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, HEAD, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

async function updateMyGames(request) {
  if (request.method !== 'POST') {
    return sendJSONResponse({ err: 'method not allowed' }, 405);
  } 

  try {
    const headers = new Map(request.headers);
    const authorization = headers.get('authorization');

    if (!authorization || authorization !== 'Bearer ADD_BEARER_TOKEN_HERE') {
      return sendJSONResponse({ err: 'access denied' }, 401);
    }

    const data = await request.json();
    const date = new Date(data.last_updated);
    const dateKey = `${date.getUTCFullYear()}-${leftPad(date.getUTCMonth())}-${leftPad(date.getUTCDate())}_${leftPad(date.getUTCHours())}:${leftPad(date.getUTCMinutes())}:${leftPad(date.getUTCSeconds())}`;

    const previousStats = await STATS.get('myGames-latest');
    addComparisonData(JSON.parse(previousStats), data);

    await STATS.put('myGames-latest', JSON.stringify(data));
    await STATS.put(`myGames-${dateKey}`, JSON.stringify(data));

    return sendJSONResponse({ ok: true }, 200);
  } catch (e) {
    return sendJSONResponse({ ok: false, msg: e.toString() }, 503);
  }
}

async function updateBoomingGames(request) {
  if (request.method !== 'POST') {
    return sendJSONResponse({ err: 'method not allowed' }, 405);
  }

  try {
    const headers = new Map(request.headers);
    const authorization = headers.get('authorization');

    if (!authorization || authorization !== 'Bearer ADD_BEARER_TOKEN_HERE') {
      return sendJSONResponse({ err: 'access denied' }, 401);
    }

    const data = await request.json();
    const date = new Date(data.last_updated);
    const dateKey = `${date.getUTCFullYear()}-${leftPad(date.getUTCMonth())}-${leftPad(date.getUTCDate())}_${leftPad(date.getUTCHours())}:${leftPad(date.getUTCMinutes())}:${leftPad(date.getUTCSeconds())}`;

    const previousStats = await STATS.get('boomingGames-latest');
    addComparisonData(JSON.parse(previousStats), data);

    await STATS.put('boomingGames-latest', JSON.stringify(data));
    await STATS.put(`boomingGames-${dateKey}`, JSON.stringify(data));

    return sendJSONResponse({ ok: true }, 200); 
  } catch (e) {
    return sendJSONResponse({ ok: false, msg: e.toString() }, 503);
  }
}

/**
 * Respond to the request
 * @param {Request} request
 */
async function handleRequest(request) {
  const path = new URL(request.url).pathname;

  try {
    switch (path) {
      case '/status/mygames':
        const myGamesStats = await STATS.get('myGames-latest');
        if (!myGamesStats) {
          return sendJSONResponse({ err: 'No Stats Data Found', contact: '@crashdoom' }, 500);
        }

        return sendJSONResponse({
          ...JSON.parse(myGamesStats),
          // Temp PSA re stats server being down
          psa: 'Due to the My.Games Conqueror\'s Blade stats server being offline, updates for EU, NA, and RU cannot be polled at this time.',
        }, 200, true);

      case '/status/boominggames':
        const boomingGamesStats = await STATS.get('boomingGames-latest');
        if (!boomingGamesStats) {
          return sendJSONResponse({ err: 'No Stats Data Found', contact: '@crashdoom' }, 500);
        }

        return sendJSONResponse(JSON.parse(boomingGamesStats), 200, true);

      case '/internal/mygames':
        return updateMyGames(request);

      case '/internal/booming':
        return updateBoomingGames(request);
    }
  } catch (e) {
    return sendJSONResponse({ err: 'error' }, 500);
  }

  return sendJSONResponse({ err: 'missing route' }, 400);
}

function leftPad(str) {
  return ('0' + str).slice(-2);
}

function sendJSONResponse(json, code, cache = false) {
  let headers = {
    ...corsHeaders,
    ...(cache ? { 'Cache-Control': 'max-age=60, public' } : {}),
  };
  return new Response(JSON.stringify(json), { status: code, headers });
}

function addComparisonData(previousStats, newStats) {
  if (!previousStats || !newStats) {
    return;
  }

  for (const key of Object.keys(newStats.servers)) {
    if (!newStats.servers[key].online || !newStats.servers[key].data) {
      continue;
    }
    newStats.servers[key].data.diff = newStats.servers[key].data.current_user_count - previousStats.servers[key].data.current_user_count;
  }
}