import {
  createCipheriv,
  createDecipheriv,
  createHash,
  pbkdf2,
  randomBytes,
} from 'crypto';
import { isEmpty } from 'lodash';
const algorithm = 'aes-256-cbc';
const iv = randomBytes(16);

export function secretMask(cc = '', num = 4, len = 32, mask = '*'): string {
  return cc ? cc.slice(-num).padStart(len, mask) : '';
}

export function JSON2Object<T>(jsonStringy: string, defaultValue = {}): T {
  try {
    defaultValue = JSON.parse(jsonStringy);
  } catch (error) {}

  return defaultValue as T;
}

export function randomTimeStampSeconds(min: number, max: number) {
  return parseInt(Math.random() * (max - min) + min + '');
}

export function encrypt(key, text) {
  // Creating Cipheriv with its parameter
  const cipher = createCipheriv(algorithm, Buffer.from(key), iv);

  // Updating text
  let encrypted = cipher.update(text);

  // Using concatenation
  encrypted = Buffer.concat([encrypted, cipher.final()]);

  // Returning iv and encrypted data
  const ivStr: string = iv.toString('hex');
  const encryptedData: string = encrypted.toString('hex');
  return `${encryptedData}:${ivStr}`;
}

export function decrypt(key, encryptedDataParam) {
  if (!encryptedDataParam) {
    return '';
  }
  const [encryptedData, textIv] = encryptedDataParam.split(':');
  const bufferIV = Buffer.from(textIv, 'hex');
  const encryptedText = Buffer.from(encryptedData, 'hex');
  // Creating Decipher
  const decipher = createDecipheriv(algorithm, Buffer.from(key), bufferIV);

  // Updating encrypted text
  let decrypted = decipher.update(encryptedText);
  decrypted = Buffer.concat([decrypted, decipher.final()]);
  return decrypted.toString();
}

export function toJSON(params: any): string {
  if (isEmpty(params)) {
    return '';
  }
  return JSON.stringify(params);
}

export function toObject<T>(params: string): T {
  if (isEmpty(params)) {
    return {} as T;
  }
  try {
    return JSON.parse(params) as T;
  } catch (error) {
    return {} as T;
  }
}

export function btoa(botaStr): string {
  return Buffer.from(botaStr).toString('base64');
}

export function atob(b64Encoded): string {
  return Buffer.from(b64Encoded, 'base64').toString();
}

export function joinKey(...keys: string[]) {
  return keys.reduce((total, cur) => {
    return total + ':' + cur;
  });
}

/**
 *
 * @param defaultStr
 * @param salt
 * @returns
 */
export function md5(defaultStr = '', salt = ''): string {
  const saltStr = `${defaultStr}:${salt}`;
  const md5 = createHash('md5');
  return md5.update(saltStr).digest('hex');
}
/**
 * pbkdf2 加密
 * @param userPassword
 * @returns
 */
export function encryptWithPbkdf2(
  encryptKey: string,
  encryptVal: string,
): Promise<string> {
  return new Promise((resolve, reject) => {
    pbkdf2(encryptVal, encryptKey, 1000, 64, 'sha512', (err, derivedKey) => {
      if (err) {
        reject('');
      } else {
        resolve(derivedKey.toString('hex'));
      }
    });
  });
}

export function moreThOne(param: any): boolean {
  if (Array.isArray(param)) {
    return param.length > 0;
  }
  return false;
}
