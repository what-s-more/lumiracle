export function calculateReadingTime(content: string): number {
  const plainText = content
    .replace(/```[\s\S]*?```/g, '')
    .replace(/`[^`]*`/g, '')
    .replace(/!\[.*?\]\(.*?\)/g, '')
    .replace(/\[([^\]]*)\]\(.*?\)/g, '$1')
    .replace(/#{1,6}\s/g, '')
    .replace(/[*_~]+/g, '')
    .replace(/>\s/g, '')
    .replace(/[-*+]\s/g, '')
    .replace(/\d+\.\s/g, '')
    .replace(/---/g, '')
    .trim();

  const chineseChars = (plainText.match(/[\u4e00-\u9fff\u3400-\u4dbf]/g) || []).length;
  const englishWords = plainText
    .replace(/[\u4e00-\u9fff\u3400-\u4dbf]/g, ' ')
    .split(/\s+/)
    .filter((word) => word.length > 0).length;

  const chineseMinutes = chineseChars / 500;
  const englishMinutes = englishWords / 200;

  return Math.max(1, Math.ceil(chineseMinutes + englishMinutes));
}
