import {settings} from '../../server/integration.mjs';
import {diagnose} from '../../server/health.mjs';
const reply=(statusCode,data)=>({statusCode,headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'},body:JSON.stringify(data)});
export async function handler(event){
 if(event.httpMethod!=='GET')return reply(405,{error:'Método não permitido.'});
 return reply(200,await diagnose(settings()));
}
