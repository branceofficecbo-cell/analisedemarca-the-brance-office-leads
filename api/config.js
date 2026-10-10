import {publicSettings,settings,sendJson} from '../server/integration.mjs';
import {diagnose} from '../server/health.mjs';
export default async function handler(req,res) {
  if(req.method!=='GET')return sendJson(res,405,{error:'Método não permitido.'});
  const result=publicSettings();
  const check=new URL(req.url||'/api/config','https://local.invalid').searchParams.get('check')==='1';
  const s=settings();
  const integration=await diagnose(s);
  // Habilitar o cadastro somente depois de confirmar a conexão real.
  const data={...result,enabled:integration.connected};
  return sendJson(res,200,check?{...data,integration}:data);
}
