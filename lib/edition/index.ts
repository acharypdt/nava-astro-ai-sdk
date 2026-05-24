export function getEdition(): 'community' | 'enterprise' {
  if (typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_EDITION === 'enterprise') {
    return 'enterprise';
  }
  return 'community';
}

export function isEnterprise(): boolean {
  return getEdition() === 'enterprise';
}
