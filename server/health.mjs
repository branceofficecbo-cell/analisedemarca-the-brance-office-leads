import {createHash} from 'node:crypto';
import {APP_VERSION,callScript} from './integration.mjs';

const version=value=>typeof value==='string'&&/^\d+\.\d+\.\d+$/.test(value)?value:null;
const id=value=>typeof value==='string'&&/^[a-f0-9]{12}$/.test(value)?value:null;
export function keyId(secret){return createHash('sha256').update('TBO-INTEGRATION:'+secret,'utf8').digest('hex').slice(0,12);}
const messages={
  CONFIG:'Configure TBO_SCRIPT_URL e TBO_SECRET em Production, disponíveis para Functions.',
  OK:'Conexão confirmada. Planilha e destinatários configurados.',
  KEY_MISMATCH:'As chaves do Google e do Netlify são diferentes. Copie INTEGRATION_SECRET do projeto Google novo para TBO_SECRET no Netlify e publique um novo deploy.',
  SCRIPT_VERSION:'A URL aponta para uma versão diferente. Use a URL /exec da implantação do Apps Script 2.0.0.',
  EMAIL_CONFIG:'Confira REPLY_TO e os dois destinatários em LEAD_NOTIFICATION_EMAIL no Apps Script.',
  AUTH:'O Google recusou a assinatura. Confira a implantação e a chave do projeto novo.',
  SHEET_COLUMNS:'Execute instalarSistema no projeto vinculado à planilha nova.',
  SHEET_ACCESS:'O projeto Google não conseguiu acessar a planilha. Execute instalarSistema com sua conta.',
  BUSY:'A planilha está ocupada. Confira novamente em alguns segundos.',
  CONNECTION:'Não foi possível confirmar a conexão com o Google. Confira a URL /exec e o acesso Qualquer pessoa.',
  UPSTREAM:'O Google devolveu uma resposta inesperada. Confira a implantação do Apps Script.'
};
const result=(code,extra={})=>({connected:code==='OK',code,message:messages[code]||messages.UPSTREAM,...extra});

async function publicInfo(s,fetcher){
  const response=await fetcher(s.script,{method:'GET',redirect:'follow',signal:AbortSignal.timeout(7000)});
  if(!response.ok)throw new Error('RESPONSE');
  const text=await response.text();if(text.length>12000)throw new Error('RESPONSE');
  const data=JSON.parse(text);
  if(data?.service!=='THE BRANCE OFFICE')throw new Error('RESPONSE');
  return {script_version:version(data.version),google_key_id:id(data.key_id)};
}

export async function diagnose(s,fetcher=fetch){
  if(!s.ready||s.preview)return result('CONFIG');
  const netlify_key_id=keyId(s.secret);
  try{
    const response=await callScript('ping',{},s,fetcher);
    const script_version=version(response.version);
    if(response.ok){
      if(script_version!==APP_VERSION)return result('SCRIPT_VERSION',{script_version});
      const google_key_id=id(response.key_id);
      if(google_key_id!==netlify_key_id)return result('KEY_MISMATCH',{script_version,netlify_key_id,google_key_id});
      if(response.confirmation_ready!==true||response.alerts_ready!==true)return result('EMAIL_CONFIG',{script_version});
      return result('OK',{script_version,netlify_key_id,google_key_id});
    }
    if(response.code==='AUTH'){
      try{
        const info=await publicInfo(s,fetcher);
        if(info.script_version!==APP_VERSION)return result('SCRIPT_VERSION',info);
        if(info.google_key_id&&info.google_key_id!==netlify_key_id)return result('KEY_MISMATCH',{...info,netlify_key_id});
        return result('AUTH',{...info,netlify_key_id});
      }catch{return result('AUTH');}
    }
    const allowed=['CONFIG','BUSY','SHEET_COLUMNS','SHEET_ACCESS'];
    return result(allowed.includes(response.code)?response.code:'UPSTREAM');
  }catch{return result('CONNECTION');}
}
