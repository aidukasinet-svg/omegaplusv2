/**
 * =========================================================================
 * CLOUDFLARE PAGES WORKER PROXY FOR OMEGA PLUS (TURBO CACHE EDITION)
 * SMP NEGERI 1 PAMEKASAN
 * =========================================================================
 * File: _worker.js
 * Fitur Khusus High-Scale (Menangani 1.300+ Pengunjung Bersamaan):
 * 1. Edge Caching (caches.default): Menyajikan stats dalam 5ms langsung dari Edge Cloudflare
 * 2. Bypass CORS 100%: Menghilangkan error CORS dari redirect 302 Google Apps Script
 * 3. Static Asset Accelerated CDN: index.html, admin.html, config.js disajikan instan
 * =========================================================================
 */

const DEFAULT_GAS_URL = "https://script.google.com/macros/s/AKfycbwsvjH5vK-g5UJF0sI4knpOal8jdGzYC6Z82lP0ecXW2yWGA4wIKmtoa4YRNXgz-g13vg/exec";

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const gasUrl = (env && env.GAS_URL) ? env.GAS_URL : DEFAULT_GAS_URL;

    // CORS Headers Standar
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
      'Access-Control-Max-Age': '86400',
    };

    // Preflight OPTIONS
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders });
    }

    // Jika Request API (/api atau /exec)
    if (url.pathname.startsWith('/api') || url.pathname.startsWith('/exec')) {
      const action = url.searchParams.get('action') || '';
      const targetUrl = new URL(gasUrl);

      url.searchParams.forEach((value, key) => {
        targetUrl.searchParams.set(key, value);
      });

      // EDGE CACHING UNTUK REQUEST GET STATS & CONFIG (Meringankan Apps Script)
      const isCacheableGet = (request.method === 'GET' && (action === 'getDashboardStats' || action === 'getPublicConfig' || action === 'ping'));
      const cache = caches.default;
      const cacheKey = new Request(targetUrl.toString(), request);

      if (isCacheableGet) {
        const cachedResponse = await cache.match(cacheKey);
        if (cachedResponse) {
          // Tambahkan CORS header dan kembalikan instan dari Edge (5ms)
          const newHeaders = new Headers(cachedResponse.headers);
          Object.keys(corsHeaders).forEach(k => newHeaders.set(k, corsHeaders[k]));
          newHeaders.set('X-Edge-Cache', 'HIT');
          return new Response(cachedResponse.body, {
            status: cachedResponse.status,
            headers: newHeaders
          });
        }
      }

      // Siapkan Request ke Apps Script
      const fetchOptions = {
        method: request.method,
        headers: {
          'Accept': 'application/json',
          'Content-Type': request.headers.get('content-type') || 'application/json',
        },
        redirect: 'follow', // Penting untuk 302 redirect Apps Script
      };

      if (request.method === 'POST') {
        try {
          fetchOptions.body = await request.text();
        } catch (e) {}
      }

      try {
        const gasResponse = await fetch(targetUrl.toString(), fetchOptions);
        const responseData = await gasResponse.text();

        const responseHeaders = {
          ...corsHeaders,
          'Content-Type': 'application/json; charset=utf-8',
          'Cache-Control': isCacheableGet ? 'public, max-age=15, s-maxage=30' : 'no-store, no-cache',
          'X-Edge-Cache': 'MISS'
        };

        const finalResponse = new Response(responseData, {
          status: gasResponse.status,
          headers: responseHeaders,
        });

        // Simpan ke Edge Cache jika request GET cacheable
        if (isCacheableGet && gasResponse.status === 200) {
          ctx.waitUntil(cache.put(cacheKey, finalResponse.clone()));
        }

        return finalResponse;
      } catch (err) {
        return new Response(JSON.stringify({
          status: 'error',
          message: 'Gagal terhubung ke Apps Script: ' + err.message,
        }), {
          status: 502,
          headers: { ...corsHeaders, 'Content-Type': 'application/json; charset=utf-8' },
        });
      }
    }

    // Default: Sajikan aset statis Cloudflare Pages (otomatis melayani /pendaftaran, /login, /admin, dll)
    if (env && env.ASSETS) {
      if (url.pathname.startsWith('/pendaftaran') || url.pathname.startsWith('/formpendaftaran')) {
        return env.ASSETS.fetch(new Request(new URL('/index.html', request.url), request));
      }
      if (url.pathname.startsWith('/login')) {
        return env.ASSETS.fetch(new Request(new URL('/admin.html', request.url), request));
      }
      return env.ASSETS.fetch(request);
    }

    return fetch(request);
  },
};

