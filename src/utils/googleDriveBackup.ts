import { CategoryBudget, MonthlyBudget, Transaction } from '../types';

export interface AppBackupPayload {
  version: 1;
  appName: 'Minhas Contas';
  createdAt: string;
  userEmail?: string;
  totalTransactions: number;
  transactions: Transaction[];
  categoryBudgets: CategoryBudget[];
  monthlyBudgets?: Record<string, MonthlyBudget>;
}

export interface DriveBackupFile {
  id: string;
  name: string;
  createdTime: string;
  size?: string;
  modifiedTime?: string;
}

const BACKUP_PREFIX = 'MinhasContas_Backup_';

/**
 * Uploads a structured JSON backup to the user's Google Drive using the drive.file scope.
 */
export async function uploadBackupToDrive(
  accessToken: string,
  backupData: AppBackupPayload
): Promise<DriveBackupFile> {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const fileName = `${BACKUP_PREFIX}${timestamp}.json`;

  const metadata = {
    name: fileName,
    mimeType: 'application/json',
    description: `Backup do app Minhas Contas contendo ${backupData.transactions.length} transações. Criado em ${new Date().toLocaleString('pt-BR')}.`,
  };

  const boundary = '-------314159265358979323846';
  const delimiter = `\r\n--${boundary}\r\n`;
  const closeDelimiter = `\r\n--${boundary}--`;

  const multipartRequestBody =
    delimiter +
    'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
    JSON.stringify(metadata) +
    delimiter +
    'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
    JSON.stringify(backupData, null, 2) +
    closeDelimiter;

  const response = await fetch(
    'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,createdTime,size,modifiedTime',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': `multipart/related; boundary=${boundary}`,
      },
      body: multipartRequestBody,
    }
  );

  if (!response.ok) {
    const errorJson = await response.json().catch(() => ({}));
    const message = errorJson?.error?.message || `Erro HTTP ${response.status} ao salvar no Google Drive`;
    throw new Error(message);
  }

  const uploadedFile: DriveBackupFile = await response.json();
  return uploadedFile;
}

/**
 * Lists backups created by this application in the user's Google Drive.
 */
export async function listBackupsFromDrive(accessToken: string): Promise<DriveBackupFile[]> {
  const query = `name contains '${BACKUP_PREFIX}' and trashed = false`;
  const url = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(
    query
  )}&orderBy=createdTime desc&pageSize=20&fields=files(id,name,createdTime,size,modifiedTime)`;

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    const errorJson = await response.json().catch(() => ({}));
    const message = errorJson?.error?.message || `Erro HTTP ${response.status} ao listar backups no Google Drive`;
    throw new Error(message);
  }

  const data = await response.json();
  return (data.files || []) as DriveBackupFile[];
}

/**
 * Downloads a backup file content from Google Drive.
 */
export async function downloadBackupFromDrive(
  accessToken: string,
  fileId: string
): Promise<AppBackupPayload> {
  const url = `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`;

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    const errorJson = await response.json().catch(() => ({}));
    const message = errorJson?.error?.message || `Erro HTTP ${response.status} ao baixar arquivo do Google Drive`;
    throw new Error(message);
  }

  const payload: AppBackupPayload = await response.json();
  if (!payload || !Array.isArray(payload.transactions)) {
    throw new Error('Arquivo de backup inválido ou em formato incompatível.');
  }

  return payload;
}

/**
 * Deletes a specific backup file from Google Drive (with confirmation from caller).
 */
export async function deleteBackupFromDrive(accessToken: string, fileId: string): Promise<void> {
  const url = `https://www.googleapis.com/drive/v3/files/${fileId}`;

  const response = await fetch(url, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    const errorJson = await response.json().catch(() => ({}));
    const message = errorJson?.error?.message || `Erro HTTP ${response.status} ao excluir backup do Google Drive`;
    throw new Error(message);
  }
}
