import dotenv from 'dotenv';
import admin from 'firebase-admin';
import { readFileSync, existsSync } from 'fs';

dotenv.config();

function buildCredential() {
  if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
    return admin.credential.cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON));
  }
  if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    return admin.credential.applicationDefault();
  }
  const localFile = new URL('./serviceAccountKey.json', import.meta.url);
  if (existsSync(localFile)) {
    return admin.credential.cert(JSON.parse(readFileSync(localFile)));
  }
  throw new Error('No Firebase credentials. Set GOOGLE_APPLICATION_CREDENTIALS in backend/.env.');
}

admin.initializeApp({ credential: buildCredential() });

export const auth = admin.auth();
export const db = admin.firestore();
export default admin;