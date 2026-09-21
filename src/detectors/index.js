import * as thaiId from './thai-id.js';
import * as thaiPhone from './thai-phone.js';
import * as email from './email.js';
import * as creditCard from './credit-card.js';
import * as bankAccount from './bank-account.js';
import * as thaiPlate from './thai-plate.js';
import * as thaiAddress from './thai-address.js';
import * as thaiName from './thai-name.js';
import * as passport from './passport.js';

/** @type {import('../core/types.js').Detector[]} */
export const DETECTORS = [
  thaiId, thaiPhone, email, creditCard, bankAccount, thaiPlate, thaiAddress, thaiName, passport
];

export const DETECTOR_MAP = Object.fromEntries(DETECTORS.map((d) => [d.type, d]));
