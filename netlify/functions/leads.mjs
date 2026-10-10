import leads from '../../api/leads.js';
import {adapt} from '../../server/netlify-adapter.mjs';
export const handler=adapt(leads);
