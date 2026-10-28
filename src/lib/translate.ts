/**
 * Free translation: the browser's own on-device translator where it exists (Chrome), otherwise a
 * link that opens Google Translate with the text filled in, plus an offline phrasebook. No paid API.
 */
export type Language = { code: string; name: string; speech: string };

export const LANGUAGES: Language[] = [
  { code: "ar", name: "Arabic", speech: "ar-SA" },
  { code: "zh", name: "Chinese (Simplified)", speech: "zh-CN" },
  { code: "nl", name: "Dutch", speech: "nl-NL" },
  { code: "en", name: "English", speech: "en-GB" },
  { code: "fr", name: "French", speech: "fr-FR" },
  { code: "de", name: "German", speech: "de-DE" },
  { code: "el", name: "Greek", speech: "el-GR" },
  { code: "hi", name: "Hindi", speech: "hi-IN" },
  { code: "id", name: "Indonesian", speech: "id-ID" },
  { code: "it", name: "Italian", speech: "it-IT" },
  { code: "ja", name: "Japanese", speech: "ja-JP" },
  { code: "ko", name: "Korean", speech: "ko-KR" },
  { code: "ms", name: "Malay", speech: "ms-MY" },
  { code: "pt", name: "Portuguese (Brazil)", speech: "pt-BR" },
  { code: "ru", name: "Russian", speech: "ru-RU" },
  { code: "es", name: "Spanish", speech: "es-ES" },
  { code: "th", name: "Thai", speech: "th-TH" },
  { code: "tr", name: "Turkish", speech: "tr-TR" },
  { code: "ur", name: "Urdu", speech: "ur-PK" },
  { code: "vi", name: "Vietnamese", speech: "vi-VN" },
];

export const languageByCode = (code: string) => LANGUAGES.find((l) => l.code === code);

/** Opens Google Translate (site or app) with the text and target language already filled in. */
export function googleTranslateUrl(text: string, target: string, source = "auto") {
  const p = new URLSearchParams({ sl: source, tl: target, text, op: "translate" });
  return `https://translate.google.com/?${p.toString()}`;
}

export const PHRASES = [
  "Hello",
  "Thank you",
  "Please",
  "Excuse me",
  "Do you speak English?",
  "I don't understand",
  "How much is this?",
  "Where is the toilet?",
  "The bill, please",
  "I need help",
  "Call the police",
] as const;

/** Common travel phrases, in the same order as PHRASES. Have a native speaker review before launch. */
export const PHRASEBOOK: Record<string, string[]> = {
  ar: ["مرحباً", "شكراً", "من فضلك", "لو سمحت", "هل تتكلم الإنجليزية؟", "لا أفهم", "بكم هذا؟", "أين الحمام؟", "الحساب من فضلك", "أحتاج مساعدة", "اتصل بالشرطة"],
  fr: ["Bonjour", "Merci", "S'il vous plaît", "Excusez-moi", "Parlez-vous anglais ?", "Je ne comprends pas", "Combien ça coûte ?", "Où sont les toilettes ?", "L'addition, s'il vous plaît", "J'ai besoin d'aide", "Appelez la police"],
  es: ["Hola", "Gracias", "Por favor", "Disculpe", "¿Habla inglés?", "No entiendo", "¿Cuánto cuesta?", "¿Dónde está el baño?", "La cuenta, por favor", "Necesito ayuda", "Llame a la policía"],
  it: ["Buongiorno", "Grazie", "Per favore", "Mi scusi", "Parla inglese?", "Non capisco", "Quanto costa?", "Dov'è il bagno?", "Il conto, per favore", "Ho bisogno di aiuto", "Chiami la polizia"],
  de: ["Hallo", "Danke", "Bitte", "Entschuldigung", "Sprechen Sie Englisch?", "Ich verstehe nicht", "Wie viel kostet das?", "Wo ist die Toilette?", "Die Rechnung, bitte", "Ich brauche Hilfe", "Rufen Sie die Polizei"],
  tr: ["Merhaba", "Teşekkür ederim", "Lütfen", "Affedersiniz", "İngilizce biliyor musunuz?", "Anlamıyorum", "Bu ne kadar?", "Tuvalet nerede?", "Hesap, lütfen", "Yardıma ihtiyacım var", "Polisi arayın"],
  pt: ["Olá", "Obrigado / Obrigada", "Por favor", "Com licença", "Você fala inglês?", "Não entendo", "Quanto custa?", "Onde fica o banheiro?", "A conta, por favor", "Preciso de ajuda", "Chame a polícia"],
  hi: ["नमस्ते", "धन्यवाद", "कृपया", "माफ़ कीजिए", "क्या आप अंग्रेज़ी बोलते हैं?", "मुझे समझ नहीं आया", "यह कितने का है?", "शौचालय कहाँ है?", "कृपया बिल दीजिए", "मुझे मदद चाहिए", "पुलिस को बुलाइए"],
  ja: ["こんにちは", "ありがとうございます", "お願いします", "すみません", "英語を話せますか？", "わかりません", "これはいくらですか？", "トイレはどこですか？", "お会計をお願いします", "助けてください", "警察を呼んでください"],
  th: ["สวัสดี", "ขอบคุณ", "กรุณา", "ขอโทษ", "คุณพูดภาษาอังกฤษได้ไหม", "ฉันไม่เข้าใจ", "อันนี้ราคาเท่าไหร่", "ห้องน้ำอยู่ที่ไหน", "เช็คบิลด้วย", "ช่วยด้วย", "ช่วยเรียกตำรวจด้วย"],
};

export const phrasebookLanguages = () => LANGUAGES.filter((l) => PHRASEBOOK[l.code]);
