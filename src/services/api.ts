import type { ClientConfig, ModuleConfig, SurveyResponse } from '../types';

const APPS_SCRIPT_URL = import.meta.env.VITE_APPS_SCRIPT_URL as string;

if (!APPS_SCRIPT_URL) {
  console.warn('Falta VITE_APPS_SCRIPT_URL en las variables de entorno');
}

type ApiResponse<T> = {
  success: boolean;
  data: T;
  message?: string;
  stack?: string;
};

type UploadLogoResult = {
  fileId: string;
  fileUrl: string;
  fileName: string;
};

type InitialData = {
  clients: ClientConfig[];
  responses: SurveyResponse[];
  surveyConfig: Record<string, ModuleConfig[]>;
};

async function getJson<T>(params: Record<string, string>) {
  const url = new URL(APPS_SCRIPT_URL);
  Object.entries(params).forEach(([key, value]) => {
    url.searchParams.set(key, value);
  });

  const res = await fetch(url.toString(), {
    method: 'GET',
  });

  const data: ApiResponse<T> = await res.json();

  if (!data.success) {
    throw new Error(data.message || 'Error en GET');
  }

  return data.data;
}

async function postJson<T>(action: string, payload?: unknown) {
  const res = await fetch(APPS_SCRIPT_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'text/plain;charset=utf-8',
    },
    body: JSON.stringify({
      action,
      payload,
    }),
  });

  const data: ApiResponse<T> = await res.json();

  if (!data.success) {
    throw new Error(data.message || 'Error en POST');
  }

  return data.data;
}

export async function getInitialData(): Promise<InitialData> {
  return getJson<InitialData>({ action: 'getInitialData' });
}

export async function getClients(): Promise<ClientConfig[]> {
  return getJson<ClientConfig[]>({ action: 'getClients' });
}

export async function getResponses(): Promise<SurveyResponse[]> {
  return getJson<SurveyResponse[]>({ action: 'getResponses' });
}

export async function getSurveyConfig(): Promise<Record<string, ModuleConfig[]>> {
  return getJson<Record<string, ModuleConfig[]>>({ action: 'getConfig' });
}

export async function getClientBySlug(slug: string): Promise<ClientConfig | null> {
  return getJson<ClientConfig | null>({
    action: 'getClientBySlug',
    slug,
  });
}

export async function createClient(payload: Partial<ClientConfig> & { logoFileId?: string }) {
  return postJson<ClientConfig>('createClient', payload);
}

export async function updateClient(payload: Partial<ClientConfig> & { id: string; logoFileId?: string }) {
  return postJson<ClientConfig>('updateClient', payload);
}

export async function deleteClient(clientId: string) {
  return postJson<{ deleted: boolean; clientId: string }>('deleteClient', { clientId });
}

export async function saveSurveyResponse(payload: {
  clientId: string;
  answers: { questionId: string; value: string | number }[];
}) {
  return postJson<SurveyResponse>('saveSurveyResponse', payload);
}

export async function saveSurveyConfig(config: Record<string, ModuleConfig[]>) {
  return postJson<Record<string, ModuleConfig[]>>('saveConfig', { config });
}

export async function uploadLogo(payload: {
  clientId?: string;
  fileName: string;
  mimeType: string;
  base64: string;
}): Promise<UploadLogoResult> {
  return postJson<UploadLogoResult>('uploadLogo', payload);
}
