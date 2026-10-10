import {safeUrl,socialUrl} from './core.mjs';
export function normalizePublicLink(raw,{social=false}={}){
  const value=String(raw??'').trim();
  if(!value)return '';
  if(social && value.startsWith('@'))return socialUrl(value);
  if(/^[a-z][a-z0-9+.-]*:/i.test(value))return safeUrl(value);
  if(!/^(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z]{2,}(?:[/?#][^\s]*)?$/i.test(value))return '';
  return safeUrl('https://'+value);
}
