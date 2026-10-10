import {validateLead} from '../public/core.mjs';
import {settings,sendJson,requireOrigin,readBody,fingerprint,hashPayload,tokenFor,callScript} from '../server/integration.mjs';
export default async function handler(req,res) {
  if(req.method!=='POST')return sendJson(res,405,{error:'Método não permitido.'});
  const s=settings();
  if(!s.ready||s.preview)return sendJson(res,503,{error:'O recebimento de solicitações ainda não está disponível.'});
  let receipt;
  try {
    requireOrigin(req,s);
    const raw=await readBody(req);
    if(raw.website_check)return sendJson(res,422,{error:'Não foi possível validar o envio.'});
    const lead=validateLead(raw);
    receipt=tokenFor(lead.submission_id,s.secret);
    const result=await callScript('submit',{lead,payload_hash:hashPayload(lead),fingerprint:fingerprint(req,s.secret),booking_url:s.booking,newsletter_url:s.newsletter},s);
    if(!result.ok){
      const code=['AUTH','CONFIG','BUSY','CONFLICT','RATE_LIMIT','SHEET_COLUMNS','SHEET_ACCESS'].includes(result.code)?result.code:'GOOGLE_RESPONSE';
      console.error('TBO_SUBMIT_'+code);
      const codes={CONFLICT:409,RATE_LIMIT:429,BUSY:503,CONFIG:503};
      return sendJson(res,codes[result.code]||503,{error:result.code==='CONFLICT'?'O conteúdo deste envio foi alterado. Confira o cadastro antes de enviar novamente.':result.code==='RATE_LIMIT'?'Muitas tentativas recentes. Aguarde alguns minutos e tente novamente.':'Não foi possível concluir agora. Seus dados continuam nesta tela.',receipt_token:receipt,code});
    }
    return sendJson(res,result.duplicate?200:201,{lead_id:lead.submission_id,received_at:result.received_at,sheet_status:'saved',email_status:result.email_status,receipt_token:receipt});
  } catch(error) {
    if(error.message==='ORIGIN')return sendJson(res,403,{error:'A origem do envio não foi reconhecida.'});
    if(['SIZE','CONTENT_TYPE'].includes(error.message)||error instanceof SyntaxError)return sendJson(res,400,{error:'O formato do envio não é válido.'});
    if(receipt){
      const code=['GOOGLE_ACCESS','GOOGLE_RESPONSE','GOOGLE_TIMEOUT','GOOGLE_NETWORK'].includes(error.message)?error.message:'GOOGLE_RESPONSE';
      console.error('TBO_SUBMIT_'+code);
      return sendJson(res,202,{pending:true,error:'Estamos verificando o recebimento. Não feche esta página.',receipt_token:receipt,code});
    }
    return sendJson(res,422,{error:error.message||'Confira os campos do cadastro.'});
  }
}
