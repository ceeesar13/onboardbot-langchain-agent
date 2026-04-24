export const INJECTION_PATTERNS: RegExp[] = [
  // Bypass instructions — ES
  /ignor(?:a|á|ar|en)\s+(?:las\s+|todas\s+las\s+)?instrucciones/i,
  /olvid(?:a|á|ar|en)\s+(?:las\s+|todas\s+las\s+)?instrucciones/i,
  // Bypass instructions — EN
  /ignore\s+(?:all\s+)?(?:previous|prior|above)\s+instructions/i,
  /forget\s+(?:all\s+)?(?:previous|prior|above)\s+instructions/i,
  // Reveal system prompt — ES
  /(?:revel(?:a|á|ar|en)|mostr(?:a|á|ar|en)|d(?:a|á|ame|ar))\s+(?:tu|el)\s+(?:system\s+)?prompt/i,
  // Reveal system prompt — EN
  /(?:reveal|show|give\s+me|print)\s+(?:your|the)\s+(?:system\s+)?prompt/i,
  // Role change — ES
  /(?:act(?:u(?:a|á)|uar)|sos|eres)\s+(?:ahora\s+)?como/i,
  // Role change — EN
  /\byou\s+are\s+now\b/i,
  /\bpretend\s+to\s+be\b/i,
  // "act as" but NOT "act as a helpful" — the negative lookahead keeps benign uses safe
  /\bact\s+as\s+(?!a\s+helpful)/i,
  // Common jailbreaks
  /\bDAN\b/,
  /developer\s+mode/i,
  /modo\s+desarrollador/i,
  /sin\s+restricciones/i,
];
