/**
 * Utility to convert addresses and names to natural Japanese (Hiragana & Kanji) for Japanese PDF invoices.
 * Prevents unwanted Katakana conversion of business addresses.
 */

const fullAddressMap: { [key: string]: string } = {
  // Full address exact mappings
  '305-0861, ibaraki-ken, tsukuba-shi, yatabe 1077-58': '〒305-0861 茨城県つくば市谷田部 1077-58',
  '305-0861 ibaraki-ken tsukuba-shi yatabe 1077-58': '〒305-0861 茨城県つくば市谷田部 1077-58',
  '106-0044, tokyo, minato-ku, highashiazabu 1-9-11': '〒106-0044 東京都港区東麻布 1-9-11',
  '106-0044, tokyo, minato-ku, higashiazabu 1-9-11': '〒106-0044 東京都港区東麻布 1-9-11',
  '106-0044 tokyo minato-ku highashiazabu 1-9-11': '〒106-0044 東京都港区東麻布 1-9-11',
  '106-0044, tokyo, minato-ku, highashiazabu 3-4-17, higashi azabu k building 3f': '〒106-0044 東京都港区東麻布 3-4-17 東麻布Kビル 3F',
  '106-0044, tokyo, minato-ku, higashiazabu 3-4-17, higashi azabu k building 3f': '〒106-0044 東京都港区東麻布 3-4-17 東麻布Kビル 3F',
  '210-0025, kanagawa-ken, kawasaki-shi, kawasaki-ku, shimonamiki 11-5, kawasaki sight city 4-809': '〒210-0025 神奈川県川崎市川崎区下並木 11-5 川崎サイトシティ 4-809',
};

const tokenMap: { [key: string]: string } = {
  // Prefectures / Cities / Wards in Hiragana & Kanji
  'ibaraki-ken': '茨城県',
  'ibaraki ken': '茨城県',
  'ibaraki': '茨城県',
  'tsukuba-shi': 'つくば市',
  'tsukuba shi': 'つくば市',
  'tsukuba': 'つくば',
  'yatabe': '谷田部',
  'tokyo': '東京都',
  'tokyo-to': '東京都',
  'minato-ku': '港区',
  'minato ku': '港区',
  'highashiazabu': '東麻布',
  'higashiazabu': '東麻布',
  'higashi azabu': '東麻布',
  'kanagawa-ken': '神奈川県',
  'kanagawa ken': '神奈川県',
  'kanagawa': '神奈川',
  'kawasaki-shi': '川崎市',
  'kawasaki shi': '川崎市',
  'kawasaki-ku': '川崎区',
  'kawasaki ku': '川崎区',
  'shimonamiki': '下並木',
  'kawasaki sight city': '川崎サイトシティ',
  'higashi azabu k building 3f': '東麻布Kビル 3F',
  'k building': 'Kビル',
  'building': 'ビル',
  'floor': '階',
  'india': 'インド',
  'japan': '日本',
  'andhra pradesh': 'アンドラ・プラデシュ州',
  'nellore': 'ネロール'
};

const companyNameMap: { [key: string]: string } = {
  'vision ai llc': '合同会社Vision AI',
  'ideal folks llc': '合同会社Ideal Folks',
  'vcas consulting llc': '合同会社VCAS Consulting',
  'kk blue arbarao': '株式会社Blue Arbarao'
};

/**
 * Converts English address strings to natural Hiragana & Kanji format.
 * If already containing Japanese Kanji/Hiragana, returns directly.
 */
export const toNaturalJapaneseAddress = (text: string): string => {
  if (!text) return '';
  const trimmed = text.trim();

  // If already contains Japanese Kanji or Hiragana (or natural postal format with Kanji), keep as is
  if (/[\u3040-\u309F\u4E00-\u9FAF]/.test(trimmed)) {
    return trimmed;
  }

  const lower = trimmed.toLowerCase();
  if (fullAddressMap[lower]) {
    return fullAddressMap[lower];
  }

  // Replace individual address tokens in natural order
  let result = trimmed;
  // Sort tokens by length descending so longer phrases match first
  const sortedTokens = Object.keys(tokenMap).sort((a, b) => b.length - a.length);
  for (const token of sortedTokens) {
    const regex = new RegExp(`\\b${token}\\b`, 'gi');
    result = result.replace(regex, tokenMap[token]);
  }

  // If result has postal code at start (e.g., 305-0861 or 106-0044) without 〒, add 〒
  if (/^\d{3}-\d{4}/.test(result) && !result.startsWith('〒')) {
    result = '〒' + result;
  }

  return result;
};

/**
 * Converts company/client names to natural Japanese format.
 */
export const toNaturalJapaneseName = (text: string): string => {
  if (!text) return '';
  const trimmed = text.trim();
  if (/[\u3040-\u309F\u4E00-\u9FAF]/.test(trimmed)) {
    return trimmed;
  }
  const lower = trimmed.toLowerCase();
  if (companyNameMap[lower]) {
    return companyNameMap[lower];
  }
  // For company names not mapped, return natural name without katakana mangling
  return trimmed;
};

/**
 * Legacy toKatakana export preserved for backwards compatibility.
 * Now routes through natural Japanese address/name conversion instead of forcing katakana.
 */
export const toKatakana = (text: string): string => {
  if (!text) return '';
  const trimmed = text.trim();
  if (/[\u3040-\u309F\u4E00-\u9FAF]/.test(trimmed)) {
    return trimmed;
  }
  const lower = trimmed.toLowerCase();
  if (fullAddressMap[lower]) {
    return fullAddressMap[lower];
  }
  if (companyNameMap[lower]) {
    return companyNameMap[lower];
  }
  return toNaturalJapaneseAddress(trimmed);
};
