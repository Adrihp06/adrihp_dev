import { describe, it, expect } from 'vitest';
import { getUniqueTags, filterByTag } from '../utils/tags';

describe('Tag Utilities', () => {
  const mockPosts = [
    { data: { tags: ['genai', 'agents'] } },
    { data: { tags: ['mlops', 'docker'] } },
    { data: { tags: ['genai', 'llm'] } },
    { data: { tags: ['data-science', 'deep-learning'] } },
  ];

  describe('getUniqueTags', () => {
    it('should return unique tags from a list of items', () => {
      const tags = getUniqueTags(mockPosts);
      expect(tags).toEqual([
        'agents', 'data-science', 'deep-learning', 'docker', 'genai', 'llm', 'mlops',
      ]);
    });

    it('should return tags sorted alphabetically', () => {
      const tags = getUniqueTags(mockPosts);
      const sorted = [...tags].sort();
      expect(tags).toEqual(sorted);
    });

    it('should return empty array for empty input', () => {
      const tags = getUniqueTags([]);
      expect(tags).toEqual([]);
    });

    it('should deduplicate tags across items', () => {
      const tags = getUniqueTags(mockPosts);
      const genaiCount = tags.filter((t) => t === 'genai').length;
      expect(genaiCount).toBe(1);
    });
  });

  describe('filterByTag', () => {
    it('should filter items by a specific tag', () => {
      const result = filterByTag(mockPosts, 'genai');
      expect(result).toHaveLength(2);
    });

    it('should return empty array if no items match the tag', () => {
      const result = filterByTag(mockPosts, 'nonexistent');
      expect(result).toHaveLength(0);
    });

    it('should return all items with a shared tag', () => {
      const result = filterByTag(mockPosts, 'docker');
      expect(result).toHaveLength(1);
      expect(result[0].data.tags).toContain('docker');
    });
  });
});
