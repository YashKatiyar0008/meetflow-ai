/**
 * Prepare copied Wispr Flow Notetaker content for the Meeting-to-Execution agent.
 * This is an import adapter, not an authenticated Wispr account connection.
 * All processing here is local in the browser or server process.
 */
export type WisprImport = {
  transcript: string;
  title: string | null;
  speakers: string[];
  source: "wispr-notetaker" | "plain-transcript";
  warning: string | null;
};

const transcriptHeading = /^\s*#{1,6}\s+(?:full\s+|live\s+)?transcript(?:ion)?\b/i;
const headingPattern = /^\s*(#{1,6})\s+(.+?)\s*$/;
const speakerPattern = /^\s*(?:[-*]\s+)?(?:\[(?:\d{1,2}:)?\d{1,2}:\d{2}(?:\.\d+)?\]\s*)?(?:\*\*)?([A-Za-z][\p{L}\p{N} ._()'-]{0,60})(?:\*\*)?\s*:\s*(.+)$/u;

export function importWisprFlow(input: string): WisprImport {
  if (typeof input !== "string" || !input.trim()) throw new Error("Add or copy a transcript first.");
  const normalized = input.replace(/\r\n?/g, "\n").trim();
  if (normalized.length > 80000) throw new Error("Transcript is too long (maximum 80,000 characters).");
  const lines = normalized.split("\n");
  const firstTitle = lines.find(x => /^#\s+\S/.test(x));
  const title = firstTitle ? firstTitle.replace(/^#\s+/, "").trim().slice(0,120) : null;
  const headingIndex = lines.findIndex(line => transcriptHeading.test(line));
  let source: WisprImport["source"] = "plain-transcript";
  let section = lines;

  if (headingIndex >= 0) {
    source = "wispr-notetaker";
    const level = lines[headingIndex].match(/^\s*(#+)/)?.[1].length ?? 2;
    const rest = lines.slice(headingIndex + 1);
    const end = rest.findIndex(line => {
      const match = line.match(headingPattern);
      return match !== null && match[1].length <= level;
    });
    section = end < 0 ? rest : rest.slice(0, end);
  }

  // Preserve spoken content and speaker attribution, remove only obvious
  // Markdown formatting from a full-meeting export.
  const out: string[] = [];
  let currentSpeaker: string | null = null;
  const speakers = new Set<string>();
  for (const raw of section) {
    const line = raw.trim();
    if (!line || line === "---" || /^\s*\|\s*[-: ]+\|/.test(line)) continue;
    const speaker = line.match(speakerPattern);
    if (speaker) {
      currentSpeaker = speaker[1].trim();
      speakers.add(currentSpeaker);
      out.push(currentSpeaker + ": " + speaker[2].trim());
      continue;
    }
    // Don't treat arbitrary markdown section headers as dialogue.
    if (headingPattern.test(line)) { currentSpeaker = null; continue; }
    if (/^\s*\[(?:\d{1,2}:)?\d{1,2}:\d{2}\]/.test(line) && currentSpeaker) {
      out.push(currentSpeaker + ": " + line.replace(/^\s*\[[^\]]+\]\s*/, ""));
      continue;
    }
    if (currentSpeaker && source === "wispr-notetaker") {
      // Merge wrapped lines to preserve the speaker for the AI extractor.
      out[out.length - 1] += " " + line.replace(/^[*-]\s*/, "");
      continue;
    }
    out.push(line);
  }

  if (source === "wispr-notetaker" && out.length === 0) {
    throw new Error("The Flow export contains no Transcript section content. Copy the full meeting again.");
  }
  if (!out.length) throw new Error("No transcript text found.");
  return {
    transcript: out.join("\n").slice(0,80000),
    title,
    speakers: Array.from(speakers),
    source,
    warning: source === "plain-transcript" && /^#\s+/m.test(normalized)
      ? "No Transcript heading was detected. Check that you copied the full Wispr Flow meeting, not only its summary."
      : null
  };
}
