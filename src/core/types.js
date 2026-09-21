/**
 * @typedef {'thai_id'|'thai_phone'|'email'|'credit_card'|'bank_account'|'thai_plate'|'thai_address'|'thai_name'|'passport'} FindingType
 */

/**
 * @typedef {Object} Finding
 * @property {FindingType} type
 * @property {string} value       original text that was detected
 * @property {number} start       start index in text
 * @property {number} end         end index (exclusive)
 * @property {number} confidence  0..1
 * @property {string} [reason]    why this score was given
 */

/**
 * @typedef {Object} Detector
 * @property {FindingType} type
 * @property {(text: string) => Finding[]} detect
 */

export const AUTO_MASK_THRESHOLD = 0.8;
export const SHOW_THRESHOLD = 0.5;

/** @type {Record<FindingType, string>} */
export const PLACEHOLDER_LABELS = Object.freeze({
  thai_id: 'บัตรปชช',
  thai_phone: 'เบอร์',
  email: 'อีเมล',
  credit_card: 'บัตรเครดิต',
  bank_account: 'บัญชี',
  thai_plate: 'ทะเบียน',
  thai_address: 'ที่อยู่',
  thai_name: 'บุคคล',
  passport: 'พาสปอร์ต'
});
