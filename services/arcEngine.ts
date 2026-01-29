import { NarrativeArc } from '../types';

const DEFAULT_ARCS: NarrativeArc[] = [];

const nextArcId = (): string => `arc_${Math.random().toString(36).slice(2, 8)}`;

const ARC_KEYWORDS: Array<{ theme: NarrativeArc['theme']; regex: RegExp; title: string }> = [
  { theme: 'mentor', regex: /(mentor|teacher|coach|guide)/i, title: 'Mentorship' },
  { theme: 'illness', regex: /(ill|sick|hospital|diagnosis|chronic)/i, title: 'Health Challenge' },
  { theme: 'migration', regex: /(move|migrate|relocate|border|refugee)/i, title: 'Migration Journey' },
  { theme: 'passion', regex: /(music|art|craft|sport|passion|dream)/i, title: 'Calling' },
  { theme: 'injustice', regex: /(injustice|bias|unfair|discrimination)/i, title: 'Struggle for Dignity' },
  { theme: 'love', regex: /(love|relationship|partner|marriage)/i, title: 'Love Story' },
  { theme: 'loss', regex: /(loss|grief|death|funeral)/i, title: 'Loss & Healing' },
  { theme: 'calling', regex: /(purpose|mission|vocation)/i, title: 'Purpose' }
];

export const updateStoryArcs = (params: {
  arcs: NarrativeArc[] | undefined;
  description?: string;
  choiceText?: string | null;
}): NarrativeArc[] => {
  const { arcs = DEFAULT_ARCS, description = '', choiceText } = params;
  const context = `${description} ${choiceText || ''}`.trim();
  if (!context) return arcs;

  let nextArcs = [...arcs];

  ARC_KEYWORDS.forEach((rule) => {
    if (rule.regex.test(context)) {
      const existing = nextArcs.find((arc) => arc.theme === rule.theme && arc.status !== 'resolved');
      if (existing) {
        existing.intensity = Math.min(100, existing.intensity + 10);
        existing.status = existing.intensity > 70 ? 'active' : existing.status;
      } else {
        nextArcs = [
          {
            id: nextArcId(),
            title: rule.title,
            theme: rule.theme,
            status: 'emerging',
            intensity: 30
          },
          ...nextArcs
        ];
      }
    }
  });

  return nextArcs.slice(0, 6);
};
