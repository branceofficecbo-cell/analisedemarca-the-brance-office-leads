export const VERSION = '1.3.0';
export const QUESTIONNAIRE_VERSION = '2026-10-v1';
export const DIMENSIONS = [
  'Público e diferenciação', 'Apresentação', 'Comunicação', 'Promessa e experiência', 'Valor e escolha'
];
export const QUESTIONS = [
  { text: 'Você sabe quais hóspedes mais valorizam a experiência da sua hospedagem?', options: ['Ainda não identificamos esse perfil.', 'Temos uma ideia geral, baseada na nossa impressão.', 'Identificamos esse perfil pelas reservas e pelos relatos dos hóspedes.', 'Usamos essas informações para orientar a comunicação e a oferta.'] },
  { text: 'Como você explica por que alguém deveria escolher sua hospedagem?', options: ['Falamos principalmente de preço, localização e estrutura.', 'Citamos diferenças, mas a explicação varia entre as pessoas da equipe.', 'Temos diferenciais claros que aparecem na comunicação.', 'Temos diferenciais claros e relatos de hóspedes que os reconhecem.'] },
  { text: 'As imagens e os materiais ajudam a entender a experiência que você oferece?', options: ['Os materiais estão desatualizados ou não representam bem a experiência.', 'Mostram a estrutura, mas explicam pouco a experiência.', 'Representam bem a hospedagem e seus principais diferenciais.', 'Representam a experiência e seguem uma orientação definida para o público.'] },
  { text: 'Site, redes sociais e atendimento apresentam a hospedagem de forma consistente?', options: ['Cada canal apresenta a hospedagem de um jeito.', 'Alguns elementos se repetem, mas há diferenças importantes.', 'Os canais seguem uma apresentação consistente.', 'A equipe usa orientações definidas e revisa essa consistência.'] },
  { text: 'Além dos quartos e da estrutura, o que aparece na sua comunicação?', options: ['Principalmente preços e disponibilidade.', 'A experiência aparece de vez em quando.', 'Mostramos experiências e diferenciais com frequência.', 'Mostramos experiências, diferenciais e relatos alinhados ao público desejado.'] },
  { text: 'Como vocês escolhem o que publicar e como apresentar a hospedagem?', options: ['Decidimos a cada publicação, sem orientação.', 'Temos alguns temas, mas não uma direção definida.', 'Seguimos temas e uma linguagem definidos.', 'Seguimos uma direção definida e a revisamos com informações dos hóspedes.'] },
  { text: 'O que o hóspede encontra corresponde ao que sua comunicação apresenta?', options: ['Há diferenças frequentes entre o que mostramos e o que entregamos.', 'Procuramos manter essa relação, mas não a acompanhamos.', 'Acompanhamos os relatos e corrigimos diferenças quando aparecem.', 'Revisamos comunicação e experiência regularmente com base nos relatos.'] },
  { text: 'Os hóspedes mencionam os diferenciais que você deseja comunicar?', options: ['Os relatos não mencionam esses diferenciais.', 'Eles aparecem em alguns relatos, mas não acompanhamos com frequência.', 'Eles aparecem com frequência nas avaliações e conversas.', 'Acompanhamos esses relatos e os usamos para orientar a comunicação.'] },
  { text: 'Antes de informar o preço, seus canais ajudam a entender o que está incluído na experiência?', options: ['O preço aparece sem contexto suficiente.', 'Apresentamos a estrutura e os serviços básicos.', 'Explicamos a experiência e os diferenciais antes da decisão.', 'Explicamos o valor e respondemos às dúvidas mais comuns sobre a escolha.'] },
  { text: 'Vocês acompanham por que os hóspedes escolhem sua hospedagem?', options: ['Não coletamos essa informação.', 'Perguntamos ocasionalmente, sem registrar.', 'Registramos os motivos com frequência.', 'Registramos os motivos e os usamos para ajustar comunicação e oferta.'] }
];
export const PRIORITIES = [
  ['Especificar o público e os diferenciais', 'Reúna os motivos de escolha mencionados pelos hóspedes e compare com o que aparece na sua comunicação.'],
  ['Revisar a apresentação da hospedagem', 'Compare imagens e materiais dos seus canais. Veja se eles ajudam a reconhecer a experiência que você oferece.'],
  ['Dar direção à comunicação', 'Revise os temas e as mensagens publicados. Identifique quais explicam seus diferenciais e quais mostram apenas a estrutura.'],
  ['Conferir a promessa da experiência', 'Compare o que sua comunicação promete com os relatos dos hóspedes. Procure diferenças que precisam de atenção.'],
  ['Explicar o valor antes do preço', 'Observe como seus canais apresentam a experiência e quais dúvidas continuam aparecendo antes da reserva.']
];
export function scoreAnswers(answers) {
  if (!Array.isArray(answers) || answers.length !== 10 || answers.some(v => v !== null && (!Number.isInteger(v) || v < 0 || v > 3))) throw new Error('Responda às dez perguntas com uma das alternativas disponíveis.');
  const valid = answers.filter(v => v !== null);
  const overall = valid.length >= 8 ? valid.reduce((s,v) => s+v,0) / (valid.length*3) * 100 : null;
  const dimensions = DIMENSIONS.map((name,i) => {
    const pair = answers.slice(i*2,i*2+2);
    return { name, index: pair.every(v => v !== null) ? (pair[0]+pair[1])/6*100 : null, position: i };
  });
  const priorities = dimensions.filter(d => d.index !== null && d.index < 100).sort((a,b) => a.index-b.index || a.position-b.position).slice(0,2).map(d => {
    const questionIndex = answers[d.position*2] <= answers[d.position*2+1] ? d.position*2 : d.position*2+1;
    return { title: PRIORITIES[d.position][0], text: PRIORITIES[d.position][1], evidence: QUESTIONS[questionIndex].options[answers[questionIndex]], dimension: d.name };
  });
  return { overall, coverage: valid.length, classification: overall === null ? 'Leitura parcial' : overall < 40 ? 'Fundamentos a desenvolver' : overall < 70 ? 'Comunicação em consolidação' : 'Maior consistência nas respostas', dimensions, priorities };
}
function text(value,min,max,label) {
  if (typeof value !== 'string' || value.trim().length < min || value.trim().length > max || /[\u0000-\u0008\u000b\u000c\u000e-\u001f]/.test(value)) throw new Error(`Confira o campo ${label}.`);
  return value.trim();
}
export function safeUrl(raw) {
  if (!raw || typeof raw !== 'string') return '';
  try { const url = new URL(raw); return ['http:','https:'].includes(url.protocol) && !url.username && !url.password && raw.length <= 2048 ? url.href : ''; } catch { return ''; }
}
export function socialUrl(raw){
  if(typeof raw!=='string'||!raw.trim())return '';
  const value=raw.trim();
  if(/^@[A-Za-z0-9._]{1,30}$/.test(value))return 'https://www.instagram.com/'+value.slice(1)+'/';
  return safeUrl(value);
}
export function validateLead(raw) {
  if (!raw || raw.schema_version !== VERSION || raw.questionnaire_version !== QUESTIONNAIRE_VERSION) throw new Error('Atualize a página para usar a versão atual da avaliação.');
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(raw.submission_id || '')) throw new Error('Não foi possível identificar este envio. Recarregue a página.');
  const scoring = scoreAnswers(raw.answers);
  const contact = raw.contact || {};
  const email = text(contact.email,5,254,'e-mail').toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error('Informe um e-mail válido.');
  const website = safeUrl(contact.website);
  const social = socialUrl(contact.social);
  const listing = safeUrl(contact.listing);
  if ((contact.website && !website) || (contact.social && !social) || (contact.listing && !listing)) throw new Error('Confira os links preenchidos. Use um endereço válido ou @ no Instagram. Você também pode deixar esses campos vazios.');
  const role = text(contact.role,2,80,'função');
  const stage = text(raw.qualification?.stage,2,80,'estágio');
  const timing = text(raw.qualification?.timing,2,80,'prazo');
  if (!['proprietario','gestor','marketing','outro'].includes(role) || !['operacao','implantacao','planejada'].includes(stage) || !['agora','3meses','3a6meses','depois','indefinido'].includes(timing)) throw new Error('Selecione as opções de função, estágio e prazo.');
  const hotelType=raw.qualification?.hotel_type;
  const units=raw.qualification?.units;
  const directChannel=raw.qualification?.direct_channel;
  if(!['pousada','hotel','chales','villa','hostel','glamping','outro'].includes(hotelType))throw new Error('Selecione o tipo de hospedagem.');
  if(!Number.isInteger(units)||units<1||units>10000)throw new Error('Informe o número de quartos ou unidades entre 1 e 10000.');
  if(!['whatsapp','motor','telefone','email','multiplos','nenhum','outro'].includes(directChannel))throw new Error('Selecione como o hóspede reserva direto hoje.');
  const whatsapp = contact.whatsapp ? text(contact.whatsapp,8,32,'WhatsApp') : '';
  if (whatsapp && (!/^[+\d\s().-]+$/.test(whatsapp) || whatsapp.replace(/\D/g,'').length < 8 || whatsapp.replace(/\D/g,'').length > 15)) throw new Error('Confira o número de WhatsApp.');
  const attribution = {};
  for (const key of ['utm_source','utm_medium','utm_campaign','utm_content','utm_term']) attribution[key] = typeof raw.attribution?.[key] === 'string' ? raw.attribution[key].slice(0,120) : '';
  try { attribution.referrer = raw.attribution?.referrer ? new URL(raw.attribution.referrer).origin : ''; } catch { attribution.referrer = ''; }
  if (raw.privacy_notice_version !== '2026-10-v1') throw new Error('Atualize a página para consultar o aviso de privacidade.');
  return {
    schema_version:VERSION, questionnaire_version:QUESTIONNAIRE_VERSION, submission_id:raw.submission_id,
    contact:{ name:text(contact.name,2,120,'nome'),email,hotel:text(contact.hotel,2,160,'hospedagem'),city:text(contact.city,2,120,'cidade'),region:text(contact.region,2,80,'estado ou país'),role,whatsapp,website,social,listing },
    qualification:{ stage,timing,hotel_type:hotelType,units,direct_channel:directChannel,challenge:text(raw.qualification?.challenge,10,1500,'principal desafio') },
    answers:raw.answers, scoring, attribution,
    newsletter_interest:raw.newsletter_interest === true, privacy_notice_version:'2026-10-v1'
  };
}
