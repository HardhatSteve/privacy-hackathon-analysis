
export function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(' ');
}

export function truncateAddress(address: string) {
  if (!address) return '';
  return `${address.slice(0, 4)}...${address.slice(-4)}`;
}

export function getRiskColor(level: string) {
  switch (level.toLowerCase()) {
    case 'low': return 'text-green-400 bg-green-400/10 border-green-400/20';
    case 'medium': return 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20';
    case 'high': return 'text-orange-400 bg-orange-400/10 border-orange-400/20';
    case 'critical': return 'text-red-400 bg-red-400/10 border-red-400/20';
    default: return 'text-gray-400 bg-gray-400/10 border-gray-400/20';
  }
}
