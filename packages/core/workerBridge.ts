// Minimaler Web Worker-Bridge für Node (Worker Threads) und Browser (Web Worker)
// API: runSimulationInWorker(params, onProgress, onDone, onAbort)

// Für Node.js (Worker Threads)
import path from 'path';
import { fileURLToPath } from 'url';

function getCurrentDir() {
  // Node.js: __dirname is available in CJS, not in ESM. Use import.meta.url fallback.
  // This works for both CJS and ESM if transpiled.
  // @ts-ignore
  if (typeof __dirname !== 'undefined') return __dirname;
  return path.dirname(fileURLToPath(import.meta.url));
}
export async function runSimulationInWorkerNode(
  params: any,
  onProgress?: (progress: number) => void,
  onDone?: (result: any) => void,
  onAbort?: (err: any) => void
) {
  const { Worker } = await import('worker_threads');
  const workerPath = path.join(getCurrentDir(), 'dist', 'workerEntry.js');
  const worker = new Worker(workerPath, { workerData: params });
  worker.on('message', msg => {
    if (msg.type === 'progress') onProgress?.(msg.value);
    if (msg.type === 'done') onDone?.(msg.result);
  });
  worker.on('error', err => onAbort?.(err));
  worker.on('exit', code => { if (code !== 0) onAbort?.(new Error('Worker exited: ' + code)); });
  return () => worker.terminate();
}

// Für Browser (Web Worker)
export function runSimulationInWorkerBrowser(
  params: any,
  onProgress?: (progress: number) => void,
  onDone?: (result: any) => void,
  onAbort?: (err: any) => void
) {
  const worker = new Worker(new URL('./workerEntry.js', import.meta.url));
  worker.postMessage(params);
  worker.onmessage = e => {
    const msg = e.data;
    if (msg.type === 'progress') onProgress?.(msg.value);
    if (msg.type === 'done') onDone?.(msg.result);
  };
  worker.onerror = err => onAbort?.(err);
  return () => worker.terminate();
}
