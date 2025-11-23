const TARGET_URL = 'https://creativeloop.tech/products';

export const handler = async (event) => {
  const method = event?.requestContext?.http?.method || 'GET';

  if (method === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: corsHeaders(),
    };
  }

  try {
    const upstream = await fetch(TARGET_URL, {
      headers: {
        'User-Agent': 'AcademyOS-Lambda-Proxy',
      },
      redirect: 'follow',
    });

    if (!upstream.ok) {
      return {
        statusCode: upstream.status,
        headers: corsHeaders(),
        body: `Upstream error (${upstream.status})`,
      };
    }

    const html = await upstream.text();

    return {
      statusCode: 200,
      headers: {
        ...corsHeaders(),
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'public, max-age=300',
      },
      body: html,
    };
  } catch (error) {
    console.error('Proxy error', error);
    return {
      statusCode: 502,
      headers: corsHeaders(),
      body: 'Proxy failed',
    };
  }
};

const corsHeaders = () => ({
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET,OPTIONS',
  'Access-Control-Allow-Headers': '*',
});
