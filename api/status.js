import {settings,sendJson,readToken,callScript,readBody,requireOrigin} from '../server/integration.mjs';
export default async function handler(req,res) {
  if(!['GET','POST'].includes(req.method))return sendJson(res,405,{error:'Método não permitido.'});
  const s=settings();if(!s.ready||s.preview)return sendJson(res,503,{error:'Consulta indisponível.',code:'CONFIG'});
  try {
    let token;
    if(req.method==='POST'){requireOrigin(req,s);token=(await readBody(req)).token;}
    else token=new URL(req.url,'https://local.invalid').searchParams.get('token');
    const id=readToken(token,s.secret);
    const data=await callScript('status',{submission_id:id},s);
    if(!data.ok)return sendJson(res,503,{error:'Não foi possível verificar agora.',code:['AUTH','CONFIG','BUSY','SHEET_COLUMNS','SHEET_ACCESS'].includes(data.code)?data.code:'GOOGLE_RESPONSE'});
    return sendJson(res,200,{found:data.found,sheet_status:data.found?'saved':'pending',email_status:data.email_status||'pendente',received_at:data.received_at});
  }catch(error){return sendJson(res,error.message==='TOKEN'?401:503,{error:'Não foi possível verificar este recibo.',code:['TOKEN','ORIGIN','GOOGLE_ACCESS','GOOGLE_RESPONSE','GOOGLE_TIMEOUT','GOOGLE_NETWORK'].includes(error.message)?error.message:'GOOGLE_RESPONSE'});}
}
