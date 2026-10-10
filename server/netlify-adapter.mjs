export function adapt(handler) {
  return async function(event) {
    const headers=Object.fromEntries(Object.entries(event.headers||{}).map(([k,v])=>[k.toLowerCase(),v]));
    const url=new URL(event.rawUrl||event.path||'/', 'https://local.invalid');
    if(!url.search){
      if(event.rawQuery)url.search=event.rawQuery;
      else for(const [key,value] of Object.entries(event.multiValueQueryStringParameters||event.queryStringParameters||{})){
        for(const item of Array.isArray(value)?value:[value])if(item!=null)url.searchParams.append(key,item);
      }
    }
    const req={method:event.httpMethod,headers,url:url.href,body:event.body?event.isBase64Encoded?Buffer.from(event.body,'base64').toString('utf8'):event.body:undefined};
    let body='';const responseHeaders={};
    const res={statusCode:200,setHeader(key,value){responseHeaders[key]=value;},end(value){body=value||'';}};
    await handler(req,res);
    return {statusCode:res.statusCode,headers:responseHeaders,body};
  };
}
