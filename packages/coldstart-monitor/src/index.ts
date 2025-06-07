export interface ColdStartReport {
  type: 'ColdStartReport';
  tenantId: string;
  functionName: string;
  memorySizeMb: number;
  initDurationMs: number;
}

export interface ColdStartOptions {
  tenantId: string;
  logger?: (message: string) => void;
}

export function withColdStartLog<T extends (...args: any[]) => any>(
  handler: T,
  options: ColdStartOptions
): (...args: Parameters<T>) => Promise<ReturnType<T>> {
  let isWarm = false;
  const initTime = Date.now();
  const log = options.logger ?? console.log;

  return async (...args: Parameters<T>): Promise<ReturnType<T>> => {
    if (!isWarm) {
      const initDurationMs = Date.now() - initTime;
      const report: ColdStartReport = {
        type: 'ColdStartReport',
        tenantId: options.tenantId,
        functionName: process.env.AWS_LAMBDA_FUNCTION_NAME || '',
        memorySizeMb: Number(process.env.AWS_LAMBDA_FUNCTION_MEMORY_SIZE || '0'),
        initDurationMs,
      };
      log(JSON.stringify(report));
      isWarm = true;
    }
    return await handler(...args);
  };
}
