const { expect } = require('chai');
const { extractPlainText } = require('../../../src/utils/richText');

describe('richText utils', () => {
  it('extracts text from Slate-style nested children', () => {
    const content = [
      { type: 'paragraph', children: [{ text: 'Hello ' }, { text: 'world' }] },
      { type: 'paragraph', children: [{ text: 'Second line' }] },
    ];
    expect(extractPlainText(content)).to.equal('Hello world Second line');
  });

  it('extracts text from Tiptap-style content', () => {
    const content = { type: 'doc', content: [{ type: 'text', text: 'Tiptap style' }] };
    expect(extractPlainText(content)).to.equal('Tiptap style');
  });

  it('ignores non-text metadata fields like "type" or "bold"', () => {
    const content = { type: 'paragraph', bold: true, children: [{ text: 'clean' }] };
    expect(extractPlainText(content)).to.equal('clean');
  });

  it('returns an empty string for an empty object', () => {
    expect(extractPlainText({})).to.equal('');
  });

  it('returns an empty string for null or undefined', () => {
    expect(extractPlainText(null)).to.equal('');
    expect(extractPlainText(undefined)).to.equal('');
  });

  it('returns a plain string unchanged (trimmed)', () => {
    expect(extractPlainText('  plain string content  ')).to.equal('plain string content');
  });

  it('collapses repeated whitespace between text nodes', () => {
    const content = [{ text: 'a' }, { text: '' }, { text: 'b' }];
    expect(extractPlainText(content)).to.equal('a b');
  });
});