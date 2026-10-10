import {renderGifts} from './gifts.mjs';
import {safeUrl} from './core.mjs';

const escape=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

export function renderConfirmation({data,contact,submissionId,config}){
  const name=contact?escape(contact.name.split(/\s+/)[0]):'';
  const hotel=contact?escape(contact.hotel):'';
  const mail=!data?'A confirmação de recebimento chega ao e-mail informado no cadastro.':data.email_status==='enviado'
    ?'O envio do e-mail de confirmação foi solicitado. Confira sua caixa de entrada e a pasta de spam.'
    :'Seu cadastro já está registrado. A confirmação por e-mail será enviada em seguida.';
  const booking=safeUrl(config.bookingUrl)||'https://cal.com/thebranceoffice/conversa-30min';
  const mailHTML=mail.replace(/e-mail/g,'<span class="keep-together">e-mail</span>');
  return `<div class="confirmation">
    <header class="confirmation-intro">
      <p class="receipt-status">${contact?'<span aria-hidden="true">✓</span> Solicitação registrada':'Solicitação de análise de marca'}</p>
      <h2 class="stage-heading" id="stage-title" tabindex="-1">${contact?'Obrigado.<br>Sua solicitação foi recebida.':'Obrigado pela sua solicitação.'}</h2>
      <p class="stage-sub">${contact?`${name}, recebemos as informações de <strong>${hotel}</strong>. <span class="confirmation-selection">A equipe vai avaliar sua solicitação para a seleção das hospedagens.</span>`:'Confira os próximos passos e aproveite os conteúdos gratuitos para sua hospedagem. <span class="confirmation-selection">A análise gratuita depende de seleção.</span>'}</p>
    </header>
    <section class="confirmation-process" aria-labelledby="process-title">
      <h3 id="process-title">O que acontece agora?</h3>
      <ol class="confirmation-timeline">
        <li><span class="timeline-marker ${contact?'is-complete':''}" aria-hidden="true">${contact?'✓':'1'}</span><div><h4>Recebimento da solicitação</h4><p>${contact?'Seus dados e respostas chegaram à equipe. ':''}${mailHTML}</p></div></li>
        <li><span class="timeline-marker" aria-hidden="true">2</span><div><h4>Avaliação da solicitação</h4><p>A equipe confere as informações enviadas para selecionar as hospedagens. O cadastro não garante a seleção.</p></div></li>
        <li><span class="timeline-marker" aria-hidden="true">3</span><div><h4>Análise por um consultor</h4><p>Se sua hospedagem for selecionada, um consultor da THE BRANCE OFFICE envia por <span class="keep-together">e-mail</span> um relatório com análise da marca, recomendações e exemplos pensados para ela.</p></div></li>
      </ol>
    </section>
    <section class="confirmation-call" aria-labelledby="conversation-title">
      <p class="eyebrow">Uma conversa sobre sua hospedagem</p>
      <h3 id="conversation-title">Quer conversar com um consultor?</h3>
      <p>Agende um horário para falar sobre o momento da sua hospedagem e o que você gostaria de melhorar.</p>
      <a class="button button-black" href="${escape(booking)}" target="_blank" rel="noopener noreferrer"><span class="conversation-label-desktop">Conversar sobre minha hospedagem</span><span class="conversation-label-mobile">Conversar com consultor</span><svg class="action-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M7 17 17 7M7 7h10v10"/></svg></a>
    </section>
    ${renderGifts(config)}
    ${submissionId?`<p class="receipt-meta">Protocolo: ${escape(submissionId)}</p>`:''}
  </div>`;
}
