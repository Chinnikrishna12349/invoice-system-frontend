/**
 * Utility to convert English phonetic strings (names, addresses) to Katakana.
 * 
 * Note: This is an approximation based on common phonetic rules.
 * Professional Japanese systems usually require manual input for names (Reading/Furigana).
 */

const mapping: { [key: string]: string } = {
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
  'ha': 'ハ', 'hi': 'ヒ', 'fu': 'フ', 'he': 'ヘ', 'ho': 'オ', // 'ho' as 'ho' or 'o'
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
  
  // Additional for better English approx
  'va': 'ヴァ', 'vi': 'ヴィ', 'vu': 'ヴ', 've': 'ヴェ', 'vo': 'ヴォ',
  'fa': 'ファ', 'fi': 'フィ', 'fe': 'フェ', 'fo': 'フォ',
  'ti': 'ティ', 'tu': 'トゥ',
  'la': 'ラ', 'li': 'リ', 'lu': 'ル', 'le': 'レ', 'lo': 'ロ', // Map L to R
  'v': 'ブ', 'th': 'サ', 'ph': 'フ',
};

// Custom replacements for common terms
const termReplacements: { [key: string]: string } = {
  'street': 'ストリート',
  'road': 'ロード',
  'floor': '階',
  'building': 'ビル',
  'india': 'インディア',
  'japan': 'ジャパン',
};

// Single Letters (Initials)
const initials: { [key: string]: string } = {
  'A': 'エー', 'B': 'ビー', 'C': 'シー', 'D': 'ディー', 'E': 'イー', 
  'F': 'エフ', 'G': 'ジー', 'H': 'エイチ', 'I': 'アイ', 'J': 'ジェー', 
  'K': 'ケー', 'L': 'エル', 'M': 'エム', 'N': 'エヌ', 'O': 'オー', 
  'P': 'ピー', 'Q': 'キュー', 'R': 'アール', 'S': 'エス', 'T': 'ティー', 
  'U': 'ユー', 'V': 'ブイ', 'W': 'ダブリュー', 'X': 'エックス', 'Y': 'ワイ', 'Z': 'ゼット'
};

/**
 * Converts English text to Katakana
 */
export const toKatakana = (text: string): string => {
  if (!text) return '';
  
  // If it already contains Japanese, return as is
  if (/[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/.test(text)) {
    return text;
  }

  let result = '';
  let i = 0;
  
  // Pre-processing: Apply term replacements for whole words
  let processedText = text;
  for (const [eng, kat] of Object.entries(termReplacements)) {
    const regex = new RegExp(`\\b${eng}\\b`, 'gi');
    processedText = processedText.replace(regex, kat);
  }

  const lowerText = processedText.toLowerCase();
  
  while (i < processedText.length) {
    const char = processedText[i];
    
    // Handle whitespace and punctuation
    if (/\s/.test(char)) {
      result += ' ';
      i++;
      continue;
    }
    
    // Handle numbers - keep them as is
    if (/[0-9]/.test(char)) {
      result += char;
      i++;
      continue;
    }

    if (/[^a-zA-Z]/.test(char)) {
      result += char;
      i++;
      continue;
    }

    // Handle Single Capital Initial followed by dot or space (e.g. "M.")
    if (/[A-Z]/.test(char) && (i + 1 === processedText.length || !/[a-z]/.test(processedText[i + 1]))) {
      result += initials[char] || char;
      i++;
      continue;
    }

    // Try to match phonemes (greedy match)
    let found = false;
    // Try 3-char, then 2-char, then 1-char
    for (let len = 3; len >= 1; len--) {
      if (i + len <= processedText.length) {
        const sub = lowerText.substring(i, i + len);
        if (mapping[sub]) {
          result += mapping[sub];
          i += len;
          found = true;
          break;
        }
      }
    }

    if (!found) {
      // Fallback for individual consonants
      const c = lowerText[i];
      if (/[bcdfghjklmnpqrstvwxyz]/.test(c)) {
        const fallback: { [key: string]: string } = {
          'b': 'ブ', 'c': 'ク', 'd': 'ド', 'f': 'フ', 'g': 'グ', 'h': 'ホ', 
          'j': 'ジュ', 'k': 'ク', 'l': 'ル', 'm': 'ム', 'n': 'ン', 'p': 'プ', 
          'r': 'ル', 's': 'ス', 't': 'ト', 'v': 'ヴ', 'w': 'ウ', 'z': 'ズ'
        };
        result += fallback[c] || c;
      } else {
        result += char;
      }
      i++;
    }
  }

  // Cleanup: Fix double vowels/consonants approx
  return result
    .replace(/ッッ/g, 'ッ')
    .replace(/ー+/g, 'ー')
    .replace(/アァ/g, 'ア')
    .replace(/イィ/g, 'イ')
    .replace(/ウゥ/g, 'ウ')
    .replace(/エェ/g, 'エ')
    .replace(/オォ/g, 'オ');
};
