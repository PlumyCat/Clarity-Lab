import type { ParticipantResponse } from '../storage/types';

export interface TranscriptEntry {
  speaker: string;
  text: string;
  timestamp?: string;
}

/**
 * Parse un transcript Teams brut en entries individuelles.
 *
 * Supporte 3 formats :
 * 1. Format Teams classique (blocs de 3 lignes) :
 *      Nom Prénom
 *      HH:MM:SS
 *      Texte de l'intervention
 *
 * 2. Format "Nom: texte" (une ligne par intervention)
 *
 * 3. Fallback texte brut (tout le texte = un seul bloc anonyme)
 */
export function parseTranscript(rawText: string): TranscriptEntry[] {
  const trimmed = rawText.trim();
  if (!trimmed) return [];

  // Essayer le format Teams 3 lignes en premier
  const teamsEntries = parseTeamsFormat(trimmed);
  if (teamsEntries.length > 0) return teamsEntries;

  // Essayer le format "Nom: texte"
  const colonEntries = parseColonFormat(trimmed);
  if (colonEntries.length > 0) return colonEntries;

  // Fallback : texte brut comme un seul bloc
  return [{ speaker: 'Participant', text: trimmed }];
}

/**
 * Format Teams : blocs de 3 lignes séparés par des lignes vides.
 *   Ligne 1 : Nom du speaker
 *   Ligne 2 : Timestamp HH:MM:SS
 *   Ligne 3+ : Texte de l'intervention
 */
function parseTeamsFormat(text: string): TranscriptEntry[] {
  const entries: TranscriptEntry[] = [];
  const timestampRegex = /^\d{1,2}:\d{2}(:\d{2})?$/;

  // Séparer par lignes vides (un ou plusieurs \n consécutifs)
  const blocks = text.split(/\n\s*\n/).filter(b => b.trim());

  if (blocks.length < 2) {
    // Pas assez de blocs pour être un format Teams, essayer ligne par ligne
    const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
    if (lines.length >= 3) {
      return parseTeamsLines(lines);
    }
    return [];
  }

  for (const block of blocks) {
    const lines = block.split('\n').map(l => l.trim()).filter(Boolean);
    if (lines.length >= 3 && timestampRegex.test(lines[1])) {
      entries.push({
        speaker: lines[0],
        timestamp: lines[1],
        text: lines.slice(2).join(' '),
      });
    } else if (lines.length >= 2 && timestampRegex.test(lines[1])) {
      // Bloc avec timestamp mais sans texte : ignorer
      continue;
    }
  }

  return entries;
}

/**
 * Parse des lignes consécutives au format Teams sans séparation par lignes vides.
 * Pattern : Nom / Timestamp / Texte (possiblement multi-ligne avant le prochain nom+timestamp)
 */
function parseTeamsLines(lines: string[]): TranscriptEntry[] {
  const entries: TranscriptEntry[] = [];
  const timestampRegex = /^\d{1,2}:\d{2}(:\d{2})?$/;

  let i = 0;
  while (i < lines.length - 1) {
    // Chercher un pattern Nom + Timestamp
    if (i + 1 < lines.length && timestampRegex.test(lines[i + 1])) {
      const speaker = lines[i];
      const timestamp = lines[i + 1];
      const textLines: string[] = [];

      i += 2;
      // Collecter les lignes de texte jusqu'au prochain speaker+timestamp
      while (i < lines.length) {
        if (i + 1 < lines.length && timestampRegex.test(lines[i + 1])) {
          break; // Prochain bloc trouvé
        }
        textLines.push(lines[i]);
        i++;
      }

      if (textLines.length > 0) {
        entries.push({ speaker, timestamp, text: textLines.join(' ') });
      }
    } else {
      i++;
    }
  }

  return entries;
}

/**
 * Format "Nom: texte" — une ligne par intervention.
 * Au moins 2 lignes doivent matcher pour valider ce format.
 */
function parseColonFormat(text: string): TranscriptEntry[] {
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
  const colonRegex = /^([^:]{2,40}):\s+(.+)$/;

  const entries: TranscriptEntry[] = [];
  for (const line of lines) {
    const match = line.match(colonRegex);
    if (match) {
      entries.push({ speaker: match[1].trim(), text: match[2].trim() });
    }
  }

  // Ne valider que si au moins 2 lignes matchent (sinon c'est probablement du texte libre)
  return entries.length >= 2 ? entries : [];
}

/**
 * Fusionne les entries consécutives du meme speaker en ParticipantResponse[].
 * Chaque speaker unique produit une seule response avec le texte concaténé.
 */
export function transcriptToResponses(entries: TranscriptEntry[]): ParticipantResponse[] {
  if (entries.length === 0) return [];

  const merged: { speaker: string; texts: string[] }[] = [];

  for (const entry of entries) {
    const last = merged[merged.length - 1];
    if (last && last.speaker === entry.speaker) {
      // Meme speaker consécutif : fusionner
      last.texts.push(entry.text);
    } else {
      merged.push({ speaker: entry.speaker, texts: [entry.text] });
    }
  }

  return merged.map(m => ({
    participantId: `transcript_${m.speaker.toLowerCase().replace(/\s+/g, '_')}`,
    participantName: m.speaker,
    content: m.texts.join('\n'),
    timestamp: new Date(),
  }));
}
