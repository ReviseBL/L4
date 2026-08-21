export function resolveDeveloperToolsEnabled(devMode: boolean, explicitFlag: string | undefined): boolean {
  return devMode || explicitFlag === 'true';
}
