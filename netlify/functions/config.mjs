import config from '../../api/config.js';
import {adapt} from '../../server/netlify-adapter.mjs';
export const handler=adapt(config);
