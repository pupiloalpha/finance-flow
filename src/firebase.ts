import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  signOut,
} from 'firebase/auth';
import { getFirestore, doc, getDocFromServer } from 'firebase/firestore';

// Configuration provisioned for this application
const defaultFirebaseConfig = {
  apiKey: "AIzaSyAjSyNL60Hfr-adXnQEuZcfEANLLDpLbQE",
  projectId: "gen-lang-client-0784398756",
  authDomain: "gen-lang-client-0784398756.firebaseapp.com",
  firestoreDatabaseId: "ai-studio-fdb98fbf-32f6-4c68-beb9-28f7e4548ce9",
  appId: "1:692398978702:web:43fdc9ccd65515d3c6fbdf",
  storageBucket: "gen-lang-client-0784398756.firebasestorage.app",
  messagingSenderId: "692398978702",
};

export const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || defaultFirebaseConfig.apiKey,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || defaultFirebaseConfig.projectId,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || defaultFirebaseConfig.authDomain,
  firestoreDatabaseId: import.meta.env.VITE_FIREBASE_DATABASE_ID || defaultFirebaseConfig.firestoreDatabaseId,
  appId: import.meta.env.VITE_FIREBASE_APP_ID || defaultFirebaseConfig.appId,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || defaultFirebaseConfig.storageBucket,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || defaultFirebaseConfig.messagingSenderId,
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

export const auth = getAuth(app);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

export const DRIVE_SCOPE = 'https://www.googleapis.com/auth/drive.file';
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });
googleProvider.addScope(DRIVE_SCOPE);

// In-memory OAuth access token caching (per workspace-integration skill)
let cachedAccessToken: string | null = null;

export function getCachedAccessToken(): string | null {
  return cachedAccessToken;
}

export function setCachedAccessToken(token: string | null) {
  cachedAccessToken = token;
}

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export async function testConnection(): Promise<boolean> {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    return true;
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Firebase client is offline or server unreachable.');
      return false;
    }
    // Any permission-denied here just means Firestore is reached and rules rejected unauthenticated test doc, which confirms connectivity!
    return true;
  }
}

export async function loginWithGoogle() {
  const isMobile =
    typeof window !== 'undefined' &&
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  const isStandalone =
    typeof window !== 'undefined' &&
    (window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true);

  // In standalone installed PWA mode, popup windows cannot be launched inside the web app shell.
  // We use signInWithRedirect directly to ensure seamless authentication.
  if (isStandalone) {
    return await signInWithRedirect(auth, googleProvider);
  }

  try {
    const result = await signInWithPopup(auth, googleProvider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (credential?.accessToken) {
      setCachedAccessToken(credential.accessToken);
    }
    return result;
  } catch (err: any) {
    console.warn('Tentativa de login via popup falhou, chaveando para redirect:', err);
    if (
      err?.code === 'auth/popup-blocked' ||
      err?.code === 'auth/popup-closed-by-user' ||
      err?.code === 'auth/cancelled-popup-request' ||
      err?.code === 'auth/operation-not-supported-in-this-environment' ||
      err?.code === 'auth/unauthorized-domain' ||
      isMobile
    ) {
      return await signInWithRedirect(auth, googleProvider);
    }
    throw err;
  }
}

/**
 * Ensures a valid OAuth access token for Google Drive is available.
 * If not already cached, initiates authentication flow.
 */
export async function requestDriveAccessToken(): Promise<string> {
  const existing = getCachedAccessToken();
  if (existing) return existing;

  const res = await loginWithGoogle();
  if (res && 'user' in res) {
    const credential = GoogleAuthProvider.credentialFromResult(res);
    if (credential?.accessToken) {
      setCachedAccessToken(credential.accessToken);
      return credential.accessToken;
    }
  }

  const token = getCachedAccessToken();
  if (!token) {
    throw new Error('Não foi possível obter o token de acesso do Google Drive. Faça login novamente.');
  }
  return token;
}

export { getRedirectResult, signInWithRedirect, signInWithPopup };

export async function logoutUser() {
  try {
    setCachedAccessToken(null);
    await signOut(auth);
  } catch (err) {
    console.error('Erro ao efetuar logout:', err);
    throw err;
  }
}
