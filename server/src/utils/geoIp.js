/**
 * Utility to extract user IP address and look up geographic location.
 */

export function getClientIp(req) {
  if (!req) return '127.0.0.1';

  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded) {
    const list = Array.isArray(forwarded) ? forwarded[0] : forwarded;
    const first = list.split(',')[0].trim();
    if (first) return first;
  }

  const rawIp =
    req.headers['cf-connecting-ip'] ||
    req.headers['x-real-ip'] ||
    req.connection?.remoteAddress ||
    req.socket?.remoteAddress ||
    req.ip ||
    '127.0.0.1';

  return String(rawIp).replace(/^::ffff:/, '');
}

/**
 * Looks up geolocation for a given IP address using free IP-API service.
 */
export async function lookupIpLocation(ip) {
  const cleanIp = String(ip || '').trim().replace(/^::ffff:/, '');

  if (
    !cleanIp ||
    cleanIp === '127.0.0.1' ||
    cleanIp === '::1' ||
    cleanIp === 'localhost' ||
    cleanIp.startsWith('192.168.') ||
    cleanIp.startsWith('10.') ||
    cleanIp.startsWith('172.16.')
  ) {
    return {
      country: 'Localhost / Private Network',
      countryCode: 'LOC',
      region: 'Local Development',
      city: 'Localhost',
      zip: '000000',
      isp: 'Internal Loopback',
      coordinates: { lat: 28.6692, lon: 77.4538 },
      timezone: 'Asia/Kolkata',
      raw: { status: 'localhost' },
    };
  }

  try {
    const res = await fetch(
      `http://ip-api.com/json/${cleanIp}?fields=status,message,country,countryCode,region,regionName,city,zip,lat,lon,timezone,isp,org,as,query`,
      { signal: AbortSignal.timeout(3500) }
    );

    if (res.ok) {
      const data = await res.json();
      if (data.status === 'success') {
        return {
          country: data.country || 'Unknown',
          countryCode: data.countryCode || '',
          region: data.regionName || data.region || 'Unknown',
          city: data.city || 'Unknown',
          zip: data.zip || '',
          isp: data.isp || data.org || 'Unknown',
          coordinates: { lat: data.lat, lon: data.lon },
          timezone: data.timezone || '',
          raw: data,
        };
      }
    }
  } catch (err) {
    console.warn('[GeoIP] Lookup failed or timed out:', err.message);
  }

  return {
    country: 'Unknown',
    countryCode: '',
    region: 'Unknown',
    city: 'Unknown',
    zip: '',
    isp: 'Unknown',
    coordinates: null,
    timezone: '',
    raw: {},
  };
}

