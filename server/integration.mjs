import { createHmac, createHash, timingSafeEqual } from 'node:crypto';
import { safeUrl } from '../public/core.mjs';

export function settings(env=process.env) {
  const app = safeUrl((env.URL||'').trim());
  const script = safeUrl((env.TBO_SCRIPT_URL||'').trim());
  const secret=(env.TBO_SECRET||'').trim();
  const ready = Boolean(app && script && /^https:\/\/script\.google\.com\/macros\/s\/[^/]+\/exec$/.test(script) && /^[a-f0-9]{64}$/i.test(secret));
  return { ready, app, script, secret, booking:safeUrl(env.BOOKING_URL)||'https://cal.com/thebranceoffice/conversa-30min', newsletter:safeUrl(env.NEWSLETTER_URL)||'https://brance.substack.com/', masterclass:safeUrl(env.MASTERCLASS_URL), preview:['deploy-preview','branch-deploy'].includes(env.CONTEXT) };
}
export const APP_VERSION='2.0.0';
export function publicSettings(env=process.env) { const s=settings(env); return { enabled:s.ready&&!s.preview,bookingUrl:s.booking,newsletterUrl:s.newsletter,masterclassUrl:s.masterclass,version:APP_VERSION }; }
export function sendJson(res,status,data) {
  res.statusCode=status;
  res.setHeader('Content-Type','application/json; charset=utf-8');
  res.setHeader('Cache-Control','no-store');
  res.setHeader('X-Content-Type-Options','nosniff');
  res.end(JSON.stringify(data));
}
export function requireOrigin(req,s) {
  const origin=req.headers.origin;
  if (!origin || !s.app || origin !== new URL(s.app).origin) throw new Error('ORIGIN');
}
export async function readBody(req) {
  if (!String(req.headers['content-type']||'').startsWith('application/json')) throw new Error('CONTENT_TYPE');
  if (Number(req.headers['content-length'])>16000) throw new Error('SIZE');
  if (req.body !== undefined) { const serialized=typeof req.body==='string'?req.body:JSON.stringify(req.body); if(Buffer.byteLength(serialized)>16000)throw new Error('SIZE'); return typeof req.body==='string'?JSON.parse(req.body):req.body; }
  let body=''; for await(const chunk of req){ body+=chunk; if(Buffer.byteLength(body)>16000)throw new Error('SIZE'); }
  return JSON.parse(body);
}
export function fingerprint(req,secret) {
  const ip=String(req.headers['x-nf-client-connection-ip']||req.headers['x-forwarded-for']||req.socket?.remoteAddress||'unknown').split(',')[0].trim();
  return createHmac('sha256',secret).update(ip).digest('hex');
}
export function hashPayload(payload) { return createHash('sha256').update(JSON.stringify(payload)).digest('hex'); }
export function tokenFor(id,secret,now=Date.now()) {
  const data=Buffer.from(JSON.stringify({id,exp:now+86400000})).toString('base64url');
  return `${data}.${createHmac('sha256',secret).update('receipt:'+data).digest('base64url')}`;
}
export function readToken(token,secret,now=Date.now()) {
  if(typeof token!=='string'||token.length>500)throw new Error('TOKEN');
  const [data,signature,...rest]=token.split('.');
  const expected=createHmac('sha256',secret).update('receipt:'+data).digest('base64url');
  if(rest.length||!signature||signature.length!==expected.length||!timingSafeEqual(Buffer.from(signature),Buffer.from(expected)))throw new Error('TOKEN');
  const result=JSON.parse(Buffer.from(data,'base64url').toString());
  if(!result.id||!Number.isFinite(result.exp)||result.exp<now)throw new Error('TOKEN');
  return result.id;
}
export async function callScript(operation,payload,s,fetcher=fetch) {
  const encoded=Buffer.from(JSON.stringify({operation,...payload}),'utf8').toString('base64');
  const timestamp=Date.now().toString();
  const signature=createHmac('sha256',s.secret).update(timestamp+'.'+encoded).digest('hex');
  let response;
  try {response=await fetcher(s.script,{method:'POST',redirect:'follow',headers:{'Content-Type':'text/plain; charset=utf-8'},body:JSON.stringify({timestamp,payload:encoded,signature}),signal:AbortSignal.timeout(23000)});}catch(error){throw new Error(['AbortError','TimeoutError'].includes(error.name)?'GOOGLE_TIMEOUT':'GOOGLE_NETWORK');}
  if(!response.ok)throw new Error([401,403].includes(response.status)?'GOOGLE_ACCESS':'GOOGLE_RESPONSE');
  const text=await response.text();
  if(text.length>12000)throw new Error('GOOGLE_RESPONSE');
  let data; try{data=JSON.parse(text);}catch{throw new Error('GOOGLE_RESPONSE');}
  if(!data||typeof data.ok!=='boolean')throw new Error('GOOGLE_RESPONSE');
  return data;
}
