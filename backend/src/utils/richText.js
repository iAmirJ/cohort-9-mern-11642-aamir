function extractPlainText(node) {
  const parts = [];

  const walk = (n) => {
    if (n === null || n === undefined) return;

    if (typeof n === 'string') {
      parts.push(n);
      return;
    }

    if (Array.isArray(n)) {
      n.forEach(walk);
      return;
    }

    if (typeof n === 'object') {
      if (typeof n.text === 'string') {
        parts.push(n.text);
      }
      Object.keys(n).forEach((key) => {
        if (key === 'text') return; // already captured above
        const value = n[key];
        if (typeof value === 'string') return; // skip metadata strings like 'type', not real content
        walk(value);
      });
    }
  };

  walk(node);

  return parts.join(' ').replace(/\s+/g, ' ').trim();
}

module.exports = { extractPlainText };