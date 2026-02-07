export interface Taggable {
  data: {
    tags: string[];
  };
}

export function getUniqueTags(items: Taggable[]): string[] {
  const tagSet = new Set<string>();
  for (const item of items) {
    for (const tag of item.data.tags) {
      tagSet.add(tag);
    }
  }
  return [...tagSet].sort();
}

export function filterByTag<T extends Taggable>(items: T[], tag: string): T[] {
  return items.filter((item) => item.data.tags.includes(tag));
}
