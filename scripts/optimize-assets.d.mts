export function displayPath(source: string): string | null;
export function optimizeAsset(source: string, options?: { force?: boolean }): Promise<boolean>;
export function optimizeAssets(options?: { force?: boolean }): Promise<number>;
