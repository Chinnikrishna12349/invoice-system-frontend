/**
 * Utility to convert addresses and names to natural Japanese (Hiragana & Kanji) for Japanese PDF invoices,
 * and convert person/item names in service descriptions to Katakana.
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

const exactNameMap: { [key: string]: string } = {
  'vijayalakshmi': 'ヴィジャヤラクシュミ',
  'vijayalakshmi m': 'ヴィジャヤラクシュミ M',
  'vijayalakshmi. m': 'ヴィジャヤラクシュミ M',
  'vijayalakshmi m.': 'ヴィジャヤラクシュミ M',
  'chinnikrishna': 'チンニクリシュナ',
  'chinnikrishna maddana': 'チンニクリシュナ・マッダナ',
  'ram kumar': 'ラム・クマール',
  'ram': 'ラム',
  'suresh': 'スレシュ',
  'anitha': 'アニタ',
  'priya': 'プリヤ',
  'lakshmi': 'ラクシュミ',
  'vijay': 'ヴィジャイ',
  'arun': 'アルン',
  'karthik': 'カルティク',
  'divya': 'ディヴィヤ',
  'rajesh': 'ラジェシュ',
  'working days': '稼働日',
  'working days (ot)': '稼働日 (残業)',
  'holiday': '休日',
  'holiday (ot)': '休日 (残業)'
};

const phonemeMap: { [key: string]: string } = {
  // Vowels
  'a': 'ア', 'i': 'イ', 'u': 'ウ', 'e': 'エ', 'o': 'オ',
  // Consonants + Vowels
  'ka': 'カ', 'ki': 'キ', 'ku': 'ク', 'ke': 'ケ', 'ko': 'コ',
  'ga': 'ガ', 'gi': 'ギ', 'gu': 'グ', 'ge': 'ゲ', 'go': 'ゴ',
  'sa': 'サ', 'shi': 'シ', 'su': 'ス', 'se': 'セ', 'so': 'ソ',
  'za': 'ザ', 'ji': 'ジ', 'zu': 'ズ', 'ze': 'ゼ', 'zo': 'ゾ',
  'ta': 'タ', 'chi': 'チ', 'tsu': 'ツ', 'te': 'テ', 'to': 'ト',
  'da': 'ダ', 'di': 'ディ', 'du': 'ドゥ', 'de': 'デ', 'do': 'ド',
  'na': 'ナ', 'ni': 'ニ', 'nu': 'ヌ', 'ne': 'ネ', 'no': 'ノ',
  'ha': 'ハ', 'hi': 'ヒ', 'fu': 'フ', 'he': 'ヘ', 'ho': 'ホ',
  'ba': 'バ', 'bi': 'ビ', 'bu': 'ブ', 'be': 'ベ', 'bo': 'ボ',
  'pa': 'パ', 'pi': 'ピ', 'pu': 'プ', 'pe': 'ペ', 'po': 'ポ',
  'ma': 'マ', 'mi': 'ミ', 'mu': 'ム', 'me': 'メ', 'mo': 'モ',
  'ya': 'ヤ', 'yu': 'ユ', 'yo': 'ヨ',
  'ra': 'ラ', 'ri': 'リ', 'ru': 'ル', 're': 'レ', 'ro': 'ロ',
  'wa': 'ワ', 'wo': 'ヲ', 'nn': 'ン',
  // Combinations
  'kya': 'キャ', 'kyu': 'キュ', 'kyo': 'キョ',
  'sha': 'シャ', 'shu': 'シュ', 'sho': 'ショ',
  'cha': 'チャ', 'chu': 'チュ', 'cho': 'チョ',
  'nya': 'ニャ', 'nyu': 'ニュ', 'nyo': 'ニョ',
  'hya': 'ヒャ', 'hyu': 'ヒュ', 'hyo': 'ヒョ',
  'mya': 'ミャ', 'myu': 'ミュ', 'myo': 'ミョ',
  'rya': 'リャ', 'ryu': 'リュ', 'ryo': 'リョ',
  'gya': 'ギャ', 'gyu': 'ギュ', 'gyo': 'ギョ',
  'ja': 'ジャ', 'ju': 'ジュ', 'jo': 'ジョ',
  'bya': 'ビャ', 'byu': 'ビュ', 'byo': 'ビョ',
  'pya': 'ピャ', 'pyu': 'ピュ', 'pyo': 'ピョ',
  // Additional
  'va': 'ヴァ', 'vi': 'ヴィ', 'vu': 'ヴ', 've': 'ヴェ', 'vo': 'ヴォ',
  'fa': 'ファ', 'fi': 'フィ', 'fe': 'フェ', 'fo': 'フォ',
  'ti': 'ティ', 'tu': 'トゥ',
  'la': 'ラ', 'li': 'リ', 'lu': 'ル', 'le': 'レ', 'lo': 'ロ',
  'v': 'ヴ', 'th': 'サ', 'ph': 'フ',
  // Fallbacks
  'b': 'ブ', 'c': 'ク', 'd': 'ド', 'f': 'フ', 'g': 'グ', 'h': 'ハ',
  'j': 'ジュ', 'k': 'ク', 'l': 'ル', 'm': 'ム', 'n': 'ン', 'p': 'プ',
  'r': 'ル', 's': 'ス', 't': 'ト', 'w': 'ウ', 'z': 'ズ',
  'sh': 'シ', 'ch': 'チ', 'ts': 'ツ',
  'y': 'イ', 'q': 'ク', 'x': 'エクス',
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
  const sortedTokens = Object.keys(tokenMap).sort((a, b) => b.length - a.length);
  for (const token of sortedTokens) {
    const regex = new RegExp(`\\b${token}\\b`, 'gi');
    result = result.replace(regex, tokenMap[token]);
  }

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
  return trimmed;
};

/**
 * Converts person/service names in descriptions to Katakana when generating Japanese PDF invoices.
 */
export const toPhoneticKatakana = (text: string): string => {
  if (!text) return '';
  // If already contains Japanese, return as is
  if (/[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/.test(text)) {
    return text;
  }
  const trimmed = text.trim();
  const lower = trimmed.toLowerCase();
  if (exactNameMap[lower]) {
    return exactNameMap[lower];
  }

  const words = trimmed.split(/\s+/);
  const katakanaWords = words.map(word => {
    const wLower = word.toLowerCase();
    if (exactNameMap[wLower]) {
      return exactNameMap[wLower];
    }
    // Single capital letter like 'M' or 'M.'
    if (word.length === 1 && /[A-Z]/i.test(word)) {
      return word.toUpperCase();
    }
    if (word.length === 2 && word.endsWith('.') && /[A-Z]/i.test(word[0])) {
      return word[0].toUpperCase() + '.';
    }

    let res = '';
    let i = 0;
    while (i < wLower.length) {
      const char = wLower[i];
      if (/[0-9\-_.]/.test(char)) {
        res += char;
        i++;
        continue;
      }
      if (/[^a-z]/.test(char)) {
        i++;
        continue;
      }
      let matched = false;
      for (let len = 4; len >= 1; len--) {
        if (i + len <= wLower.length) {
          const sub = wLower.substring(i, i + len);
          if (phonemeMap[sub]) {
            res += phonemeMap[sub];
            i += len;
            matched = true;
            break;
          }
        }
      }
      if (!matched) {
        if (phonemeMap[char]) {
          res += phonemeMap[char];
        }
        i++;
      }
    }
    return res
      .replace(/ッッ/g, 'ッ')
      .replace(/ー+/g, 'ー');
  });

  return katakanaWords.join(' ');
};

/**
 * Legacy toKatakana export preserved for backwards compatibility.
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
