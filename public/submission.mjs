export function submissionMessage(code){
  const messages={
    AUTH:'O recebimento está temporariamente indisponível. A equipe precisa conferir a integração. Seus dados continuam nesta tela. Referência: TBO-AUTH.',
    CONFIG:'O recebimento ainda está sendo configurado. Seus dados continuam nesta tela. Referência: TBO-CONFIG.',
    SHEET_COLUMNS:'Não conseguimos registrar na planilha. Seus dados continuam nesta tela. Referência: TBO-COLUNAS.',
    SHEET_ACCESS:'Não conseguimos acessar a planilha. Seus dados continuam nesta tela. Referência: TBO-ACESSO.',
    CONFLICT:'Este envio já existe com dados diferentes. Confira as informações antes de tentar novamente.',
    RATE_LIMIT:'Muitas tentativas recentes. Aguarde alguns minutos antes de tentar novamente.',
    BUSY:'Há outro cadastro sendo registrado. Aguarde alguns segundos e tente novamente.',
    GOOGLE_ACCESS:'Não conseguimos acessar o serviço de cadastro. Seus dados continuam nesta tela. Referência: TBO-PERMISSAO.',
    GOOGLE_RESPONSE:'O serviço de cadastro não confirmou o recebimento. Seus dados continuam nesta tela. Referência: TBO-RESPOSTA.'
  };
  return messages[code]||'Ainda não conseguimos confirmar o recebimento. Seus dados continuam nesta tela. Confira a conexão e tente novamente com os mesmos dados.';
}
export async function sendApplication(payload,{fetcher=fetch,pause=ms=>new Promise(resolve=>setTimeout(resolve,ms)),onPending=()=>{}}={}){
  let data,response;
  try{
    response=await fetcher('/api/leads',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload),signal:AbortSignal.timeout(35000)});
    data=await response.json();
  }catch{return {saved:false,code:'GOOGLE_NETWORK'};}
  if(data.sheet_status==='saved')return {saved:true,data};
  const definitive=['AUTH','CONFIG','SHEET_COLUMNS','SHEET_ACCESS','GOOGLE_ACCESS','CONFLICT','RATE_LIMIT'];
  if(definitive.includes(data.code)||[400,403,409,422,429].includes(response.status))return {saved:false,code:data.code||'VALIDATION',retryEditable:[400,403,409,422,429].includes(response.status)||['AUTH','CONFIG'].includes(data.code)};
  if(data.receipt_token){
    onPending();
    for(let attempt=0;attempt<4;attempt++){
      await pause(1500);
      try{
        const check=await fetcher('/api/status',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({token:data.receipt_token}),signal:AbortSignal.timeout(28000)});
        const status=await check.json();
        if(status.found&&status.sheet_status==='saved')return {saved:true,data:status};
        if(definitive.includes(status.code))return {saved:false,code:status.code};
      }catch{}
    }
  }
  return {saved:false,code:data.code||'GOOGLE_RESPONSE'};
}
