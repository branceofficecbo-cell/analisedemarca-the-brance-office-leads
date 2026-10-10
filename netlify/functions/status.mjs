import status from '../../api/status.js';
import {adapt} from '../../server/netlify-adapter.mjs';
export const handler=adapt(status);
