import {mountLeadForm} from './lead-form.mjs';
import {sendApplication,submissionMessage} from './submission.mjs';
import {renderConfirmation} from './confirmation.mjs';
import {VERSION,QUESTIONNAIRE_VERSION,QUESTIONS,validateLead} from './core.mjs';

const $=id=>document.getElementById(id);
const escape=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const KEY='tbo-brand-application-v3';
const fresh=()=>({version:VERSION,answers:Array(10).fill('unanswered'),submissionId:crypto.randomUUID()});
let state=fresh();
try {sessionStorage.removeItem(KEY);}catch{}
let config={enabled:false,bookingUrl:'https://cal.com/thebranceoffice/conversa-30min',newsletterUrl:'',masterclassUrl:''};
let stage='landing';
let submitting=false;
let savedPayload=null;
let registrationDraft={};
let configRequest=null;
const campaign={};
const params=new URLSearchParams(location.search);
for(const key of ['utm_source','utm_medium','utm_campaign','utm_content','utm_term'])campaign[key]=params.get(key)||'';
try{campaign.referrer=document.referrer?new URL(document.referrer).origin:'';}catch{campaign.referrer='';}

function persist(){try{sessionStorage.setItem(KEY,JSON.stringify(state));}catch{}}
function error(message){const el=$('stage-error');if(el){el.textContent=message;el.setAttribute('role','alert');}}
function focusStage(){const title=$('stage-title');title?.focus({preventScroll:true});window.scrollTo({top:0,behavior:'instant'});}
function buttons(){document.querySelectorAll('.booking-link').forEach(a=>a.href=config.bookingUrl);}
function go(next){
  stage=next;
  $('landing').hidden=next!=='landing';$('experience').hidden=next==='landing';
  const howLink=document.querySelector('.header-how');if(howLink)howLink.hidden=next!=='landing';
  document.querySelectorAll('[data-step]').forEach(el=>{el.classList.toggle('active',el.dataset.step===next);if(el.dataset.step===next)el.setAttribute('aria-current','step');else el.removeAttribute('aria-current');});
  if(next==='landing'){window.scrollTo({top:0,behavior:'instant'});return;}
  if(next==='questions')renderQuestionnaire();
  if(next==='registration')renderForm();
  focusStage();
}
document.querySelectorAll('[data-start]').forEach(btn=>btn.addEventListener('click',()=>{if(submitting)return;state=fresh();savedPayload=null;registrationDraft={};persist();go('questions');}));
$('exit-experience').addEventListener('click',()=>{if(!submitting)go('landing');});
$('restart').addEventListener('click',()=>{if(submitting)return;if(confirm('Apagar suas respostas e começar novamente?')){state=fresh();savedPayload=null;registrationDraft={};persist();go('questions');}});
function renderQuestionnaire(){
  $('stage').innerHTML=`<h2 class="stage-heading" id="stage-title" tabindex="-1">Como sua hospedagem se apresenta hoje?</h2><p class="stage-sub">Responda às dez perguntas. Suas respostas ajudam o consultor a conhecer a hospedagem.</p><form id="questionnaire-form" novalidate><div class="questionnaire-card">${QUESTIONS.map((q,index)=>`<div class="question-item"><fieldset class="listed-question" id="question-${index}"><legend>${index+1}. ${escape(q.text)}</legend><div class="listed-options">${[...q.options,'Não sei avaliar.'].map((text,i)=>{
    const value=i===4?'unknown':String(i),selected=state.answers[index]===(i===4?null:i);
    return `<label class="option"><input type="radio" name="answer-${index}" value="${value}" ${selected?'checked':''} required><span>${escape(text)}</span></label>`;
  }).join('')}</div></fieldset></div>`).join('')}</div><p id="stage-error" class="error-message" role="alert"></p><div class="questionnaire-actions"><button class="button button-black" type="submit"><span class="questionnaire-cta-desktop">Quero uma análise da marca da minha hospedagem</span><span class="questionnaire-cta-mobile">Receber análise</span><span aria-hidden="true">→</span></button><button class="plain-button" id="questions-back" type="button">← Voltar ao início</button></div></form>`;
  $('questionnaire-form').addEventListener('change',event=>{
    if(event.target.name.startsWith('answer-')){const index=Number(event.target.name.slice(7));state.answers[index]=event.target.value==='unknown'?null:Number(event.target.value);persist();error('');}
  });
  $('questionnaire-form').addEventListener('click',event=>{
    const input=event.target;
    if(!(input instanceof HTMLInputElement)||input.type!=='radio'||!input.name.startsWith('answer-')||event.detail===0)return;
    const index=Number(input.name.slice(7));
    const next=document.querySelector(`#question-${index+1}`)?.closest('.question-item')||document.querySelector('.questionnaire-actions');
    if(next)window.scrollTo({top:Math.max(0,window.scrollY+next.getBoundingClientRect().top-24),behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});
  });
  $('questionnaire-form').addEventListener('submit',event=>{
    event.preventDefault();const unanswered=state.answers.indexOf('unanswered');
    if(unanswered!==-1){error(`Responda à pergunta ${unanswered+1} para continuar.`);const field=document.querySelector(`#question-${unanswered} input`);field.focus();field.reportValidity();return;}
    go('registration');
  });
  $('questions-back').addEventListener('click',()=>go('landing'));
}
function renderForm(){
  mountLeadForm({container:$('stage'),config,draft:registrationDraft,onDraft:draft=>{registrationDraft=draft;},onSubmit:submitLead,onBack:()=>{if(!submitting)go('questions');}});
  if(!config.enabled)loadConfig();
}
async function submitLead(fields){
  if(submitting||!config.enabled)return;
  const raw={schema_version:VERSION,questionnaire_version:QUESTIONNAIRE_VERSION,submission_id:state.submissionId,answers:state.answers,contact:Object.fromEntries(['name','email','whatsapp','role','hotel','city','region','website','social','listing'].map(k=>[k,fields[k]||''])),qualification:{stage:fields.stage,challenge:fields.challenge,timing:fields.timing,hotel_type:fields.hotel_type,units:Number(fields.units),direct_channel:fields.direct_channel},attribution:campaign,newsletter_interest:fields.newsletter_interest==='on',privacy_notice_version:'2026-10-v1',website_check:fields.website_check||''};
  try{validateLead(raw);}catch(e){error(e.message);return;}
  if(savedPayload&&JSON.stringify(raw)!==JSON.stringify(savedPayload)){error('Há um envio anterior sem confirmação. Aguarde a verificação ou tente novamente com os dados anteriores.');return;}
  savedPayload=raw;
  submitting=true;$('lead-form').setAttribute('aria-busy','true');$('submit-lead').disabled=true;$('submit-lead').textContent='Enviando…';error('');
  for(const field of document.querySelectorAll('#lead-form input,#lead-form select,#lead-form textarea,#registration-back'))field.disabled=true;
  try{
    const result=await sendApplication(raw,{onPending:()=>error('Estamos confirmando o recebimento. Mantenha esta página aberta.')});
    if(result.saved){renderSuccess(result.data,raw);return;}
    if(result.retryEditable)savedPayload=null;
    error(submissionMessage(result.code));
  }catch{error(submissionMessage('GOOGLE_NETWORK'));}
  finally{submitting=false;$('lead-form')?.setAttribute('aria-busy','false');for(const field of document.querySelectorAll('#lead-form input,#lead-form select,#lead-form textarea,#registration-back'))field.disabled=false;if($('submit-lead')){$('submit-lead').disabled=false;$('submit-lead').innerHTML='Tentar novamente <span aria-hidden="true">→</span>';}}
}
function renderSuccess(data,raw){
  stage='success';
  document.querySelectorAll('[data-step]').forEach(el=>{el.classList.remove('active');el.removeAttribute('aria-current');});
  $('stage').innerHTML=renderConfirmation({data,contact:raw.contact,submissionId:raw.submission_id,config});
  savedPayload=null;registrationDraft={};
  try{sessionStorage.removeItem(KEY);}catch{}
  focusStage();
}
function loadConfig(){
  if(configRequest)return configRequest;
  configRequest=fetch('/api/config',{signal:AbortSignal.timeout(35000)}).then(response=>{if(!response.ok)throw new Error();return response.json();}).then(data=>{
    config=data;buttons();
    if(stage==='registration'){
      const submit=$('submit-lead');if(submit&&!submitting)submit.disabled=!config.enabled;
      if(config.enabled)document.querySelector('.config-note')?.remove();
    }
  }).catch(()=>{}).finally(()=>{configRequest=null;});
  return configRequest;
}
loadConfig();
if(location.pathname==='/avaliacao')go('questions');
