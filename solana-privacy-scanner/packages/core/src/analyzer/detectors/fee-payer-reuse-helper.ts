/**
 * Helper to check if a node is inside another node's subtree
 */
export function isNodeInsideNode(searchNode: any, parentNode: any): boolean {
  if (!parentNode || !searchNode) return false;

  let found = false;

  function traverse(node: any): void {
    if (found) return;
    if (node === searchNode) {
      found = true;
      return;
    }

    if (!node || typeof node !== 'object') return;

    for (const key in node) {
      if (key === 'loc' || key === 'range' || key === 'parent') continue;
      const child = node[key];

      if (Array.isArray(child)) {
        child.forEach(traverse);
      } else if (child && typeof child === 'object') {
        traverse(child);
      }
    }
  }

  traverse(parentNode);
  return found;
}
