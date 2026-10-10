import {renderConfirmation} from './confirmation.mjs';
import {safeUrl} from './core.mjs';

const stage=document.getElementById('stage');
const defaults={bookingUrl:'https://cal.com/thebranceoffice/conversa-30min',newsletterUrl:'https://brance.substack.com/',masterclassUrl:''};
function render(config){
  stage.innerHTML=renderConfirmation({config});
  document.querySelectorAll('.booking-link').forEach(link=>{link.href=config.bookingUrl;});
}
render(defaults);
fetch('/api/config',{signal:AbortSignal.timeout(35000)})
  .then(response=>{if(!response.ok)throw new Error('CONFIG');return response.json();})
  .then(data=>render({bookingUrl:safeUrl(data.bookingUrl)||defaults.bookingUrl,newsletterUrl:safeUrl(data.newsletterUrl),masterclassUrl:safeUrl(data.masterclassUrl)}))
  .catch(()=>{});
