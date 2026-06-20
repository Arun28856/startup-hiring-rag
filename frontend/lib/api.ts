import axios from 'axios'

const client = axios.create({
  baseURL: process.env.NEXT_PUBLIC_BACKEND_URL ?? 'http://localhost:3001',
  timeout: 180000,
})

export interface Source {
  content: string
  metadata: Record<string, string>
}

export interface QueryResponse {
  answer: string
  sources: Source[]
}

export interface IngestResponse {
  message: string
  chunksStored: number
}

export async function queryRAG(question: string): Promise<QueryResponse> {
  const { data } = await client.post<QueryResponse>('/query', { question })
  return data
}

export async function ingestDocument(
  filename: string,
  content: string,
  mimeType: string
): Promise<IngestResponse> {
  const { data } = await client.post<IngestResponse>('/ingest', { filename, content, mimeType })
  return data
}
