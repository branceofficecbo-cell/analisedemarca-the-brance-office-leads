import {normalizePublicLink} from './link-input.mjs';
const escape=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function inputField(name,label,{type='text',required=true,placeholder='',max=120,autocomplete='',help='',optionalLabel=true}={}){
  return `<div class="field"><label for="contact-${name}">${label}${required||!optionalLabel?'':' (opcional)'}</label><input name="${name}" id="contact-${name}" type="${type}" ${type==='email'?'inputmode="email" autocapitalize="none" spellcheck="false"':type==='url'?'inputmode="url" autocapitalize="none" spellcheck="false"':type==='tel'?'inputmode="tel"':''} ${required?'required':''} maxlength="${max}" ${autocomplete?`autocomplete="${autocomplete}"`:''} placeholder="${placeholder}">${help?`<small>${help}</small>`:''}</div>`;
}
function selectField(name,label,options){return `<div class="field"><label for="contact-${name}">${label}</label><select name="${name}" id="contact-${name}" required><option value="">Selecione</option>${options.map(([value,label])=>`<option value="${value}">${label}</option>`).join('')}</select></div>`;}
export function mountLeadForm({container,config,draft,onDraft,onSubmit,onBack}){
  const $=id=>container.querySelector('#'+id);
  const error=message=>{$('stage-error').textContent=message;};
  let registrationDraft=draft;
  container.innerHTML=`<div class="registration registration-card">
    <header class="registration-intro">
      <p class="eyebrow">Sua solicitação de análise</p>
      <h2 class="stage-heading" id="stage-title" tabindex="-1">Vamos conhecer sua hospedagem.</h2>
      <p class="stage-sub">Envie seus dados e conte o que gostaria de resolver. Um consultor da THE BRANCE OFFICE fará a análise das hospedagens selecionadas.</p>
    </header>
    <form id="lead-form" novalidate>
      <div class="honeypot" aria-hidden="true"><label for="website-check">Deixe este campo vazio</label><input id="website-check" name="website_check" tabindex="-1" autocomplete="off"></div>
      <section class="registration-section person-data" aria-labelledby="contact-section-title">
        <h3 id="contact-section-title">Seus dados para contato</h3>
        <div class="fields-grid">
          ${inputField('name','Seu nome',{autocomplete:'name',max:120,placeholder:'Como podemos chamar você?'})}
          ${selectField('role','Sua função',[['proprietario','Proprietário(a) ou sócio(a)'],['gestor','Gestor(a) responsável'],['marketing','Profissional de marketing'],['outro','Outra função']])}
          ${inputField('email','E-mail para contato',{type:'email',autocomplete:'email',max:254,placeholder:'seu@email.com'})}
          ${inputField('whatsapp','WhatsApp',{type:'tel',required:false,autocomplete:'tel',max:32,placeholder:'+55 85 99999-9999'})}
        </div>
      </section>
      <section class="registration-section hotel-data" aria-labelledby="hotel-section-title">
        <h3 id="hotel-section-title">A hospedagem</h3>
        <div class="fields-grid">
          ${inputField('hotel','Nome da hospedagem',{max:160,placeholder:'Nome usado para receber hóspedes',autocomplete:'organization'})}
          ${selectField('hotel_type','Tipo de hospedagem',[['pousada','Pousada'],['hotel','Hotel independente'],['chales','Chalés ou cabanas'],['villa','Villa ou casa de temporada'],['hostel','Hostel'],['glamping','Glamping'],['outro','Outro']])}
          ${inputField('city','Cidade',{autocomplete:'address-level2'})}
          ${inputField('region','Estado ou país',{max:80,autocomplete:'address-level1'})}
          <div class="field"><label for="contact-units">Número de quartos ou unidades</label><input id="contact-units" name="units" type="number" min="1" max="10000" step="1" inputmode="numeric" required placeholder="Ex.: 12"><small>Se ainda não abriu, informe a quantidade prevista.</small></div>
          ${selectField('stage','Momento do negócio',[['operacao','Em operação'],['implantacao','Em implantação'],['planejada','Em planejamento']])}
          ${selectField('direct_channel','Como o hóspede reserva direto hoje?',[['whatsapp','WhatsApp'],['motor','Site com motor de reservas'],['telefone','Telefone'],['email','E-mail'],['multiplos','Mais de um canal direto'],['nenhum','Ainda não recebemos reservas diretas'],['outro','Outro']])}
        </div>
      </section>
      <section class="registration-section hotel-data" aria-labelledby="challenge-section-title">
        <h3 id="challenge-section-title">O que você gostaria de resolver?</h3>
        <div class="fields-grid">
          <div class="field full"><label for="contact-challenge">O que você tem percebido na sua hospedagem?</label><textarea name="challenge" id="contact-challenge" minlength="10" maxlength="1500" required placeholder="Ex.: as pessoas perguntam o preço e somem, mesmo depois de mostrarmos a hospedagem."></textarea></div>
          ${selectField('timing','Quando gostaria de resolver essa situação?',[['agora','Agora'],['3meses','Nos próximos três meses'],['3a6meses','Entre três e seis meses'],['depois','Mais adiante'],['indefinido','Ainda não definido']])}
        </div>
      </section>
      <section class="registration-section hotel-data" aria-labelledby="links-section-title">
        <h3 id="links-section-title">Onde podemos conhecer a hospedagem?</h3>
        <p class="section-help" id="links-help">Esses links são opcionais. Se quiser, compartilhe os materiais da sua hospedagem.</p>
        <p id="links-error" class="error-message" role="alert" hidden></p>
        <div class="fields-grid">
          ${inputField('website','Site',{type:'url',required:false,max:2048,placeholder:'https://sua-hospedagem.com.br'})}
          ${inputField('social','Instagram ou outro perfil',{required:false,max:2048,placeholder:'@suahospedagem ou link do perfil'})}
          <div class="field full">${inputField('listing','Página no Booking, Airbnb ou Google',{type:'url',required:false,max:2048,placeholder:'https://...',help:'Cole o link público da hospedagem.'})}</div>
        </div>
      </section>
      <div class="registration-finish">
        <div class="registration-selection"><strong>A análise gratuita depende de seleção.</strong><p>A equipe avalia as solicitações recebidas. Se sua hospedagem for selecionada, um consultor envia por e-mail um relatório com análise da marca, recomendações e exemplos pensados para ela.</p></div>
        ${config.newsletterUrl?'<label class="check-label"><input type="checkbox" name="newsletter_interest"><span>Tenho interesse na newsletter. Vou concluir a inscrição na próxima tela.</span></label>':''}
        <p class="privacy-note">Usaremos os dados para avaliar sua solicitação e responder a você. Consulte o <a href="/privacidade.html" target="_blank" rel="noopener">aviso de privacidade</a>. A newsletter exige inscrição separada.</p>
        <p id="stage-error" class="error-message" role="alert"></p>
        <div class="form-submit"><button type="button" class="plain-button" id="registration-back">← Rever minhas respostas</button><button class="button button-black" id="submit-lead" type="submit" ${config.enabled?'':'disabled'}>Solicitar análise <span aria-hidden="true">→</span></button></div>
        ${config.enabled?'':'<p class="config-note">O cadastro está temporariamente indisponível. Tente novamente mais tarde ou fale com um consultor pelo botão no início da página.</p>'}
      </div>
    </form>
  </div>`;
  const form=$('lead-form');
  for(const [name,value] of Object.entries(registrationDraft)){const field=form.elements.namedItem(name);if(field){if(field.type==='checkbox')field.checked=value==='on';else field.value=value;}}
  form.addEventListener('input',event=>{
    registrationDraft=Object.fromEntries(new FormData(form));onDraft(registrationDraft);
    if(['website','social','listing'].includes(event.target.name)){
      $('links-error').hidden=true;
      for(const key of ['website','social','listing'])$(`contact-${key}`).removeAttribute('aria-invalid');
    }
  });
  form.addEventListener('change',()=>{registrationDraft=Object.fromEntries(new FormData(form));onDraft(registrationDraft);});
  $('lead-form').addEventListener('submit',event=>{
    event.preventDefault();
    error('');
    const links=['website','social','listing'];
    const showLinkError=(message,field)=>{
      $('links-error').textContent=message;$('links-error').hidden=false;
      field.setAttribute('aria-invalid','true');field.setAttribute('aria-describedby','links-help links-error');field.focus();
    };
    $('links-error').hidden=true;
    for(const key of links){
      const field=$(`contact-${key}`);field.removeAttribute('aria-invalid');
      if(!field.value.trim())continue;
      const normalized=normalizePublicLink(field.value,{social:key==='social'});
      if(!normalized){showLinkError(key==='social'?'Informe um perfil como @suahospedagem ou o link completo do perfil.':'Informe um endereço válido, como suahospedagem.com.br ou https://suahospedagem.com.br.',field);return;}
      field.value=normalized;
    }
    registrationDraft=Object.fromEntries(new FormData(form));onDraft(registrationDraft);
    for(const field of event.target.querySelectorAll('input,select,textarea'))if(!field.checkValidity()){
      error('Confira o campo '+(field.labels?.[0]?.textContent||'destacado')+'.');
      field.setAttribute('aria-invalid','true');field.focus();field.reportValidity();return;
    }
    onSubmit(Object.fromEntries(new FormData(form)));
  });
  $('registration-back').addEventListener('click',onBack);
}
