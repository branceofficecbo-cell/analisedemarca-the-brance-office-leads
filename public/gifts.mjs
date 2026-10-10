import {safeUrl} from './core.mjs';

const escape=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

function giftAccess(url,label,primary=false) {
  const className=primary?'button-black':'button-white';
  return `<div class="gift-access">${url?`<a class="button ${className}" href="${escape(url)}" target="_blank" rel="noopener noreferrer">${label} <svg class="action-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M7 17 17 7M7 7h10v10"/></svg></a>`:`<button class="button ${className}" type="button" disabled>${label}</button><span class="gift-availability">Em breve</span>`}</div>`;
}

export function renderGifts(config={}) {
  const newsletter=safeUrl(config.newsletterUrl);
  const masterclass=safeUrl(config.masterclassUrl);
  return `<section class="gifts gifts-list" aria-labelledby="gifts-title"><h2 id="gifts-title">Alguns presentes para você.</h2><p class="gifts-intro">Conteúdos gratuitos para sua hospedagem, independentemente da seleção para a análise.</p><ul class="gifts-grid"><li class="gift-card"><div class="gift-copy"><h3>Newsletter</h3><p>Análises de hospedagens, referências e ideias para trabalhar sua marca.</p>${newsletter?'<p class="gift-note">Conclua sua inscrição na página da newsletter.</p>':''}</div>${giftAccess(newsletter,'Receber a newsletter',true)}</li><li class="gift-card"><div class="gift-copy"><h3>Masterclass gratuita</h3><p>Como dar ao hóspede motivos para escolher sua hospedagem além do preço.</p></div>${giftAccess(masterclass,'Assistir à aula')}</li></ul></section>`;
}
