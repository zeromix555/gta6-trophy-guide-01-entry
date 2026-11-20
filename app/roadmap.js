// roadmap.js — the platinum roadmap and the Next-up planner.
// Stages follow PowerPyx's three-step roadmap: story, 100% checklist, cleanup.
// Each stage lists what to do and why, in the order the game wants it.
export const ROADMAP_STAGES = [
  {
    stage: 1,
    title: 'Stage 1 — Play the story (60–80 hours)',
    time: 'Chapters 1–5, one playthrough',
    blurb:
      'Finish all five chapters and the final mission. There is no mission replay and no New Game+, so do optional missions, stranger strands and the first meditation spot as they appear. Progress banked now already counts toward the 100% checklist.',
    tip: 'Scan vehicles and study animals with the binoculars between missions — the checklist later wants 200 of 277 vehicles and 100 of 255 animals.',
  },
  {
    stage: 2,
    title: 'Stage 2 — The 100% Completion checklist (~100 hours)',
    time: 'After the credits, free-roam',
    blurb:
      'The checklist unlocks under Progress > Stats > 100% Completion once the story ends. Its thresholds are lenient — closer to 60% true completion — but this is still the bulk of the platinum: 70 of 80 challenges, 300 stunts, 200 of 277 vehicles, 100 of 255 animals, 50 of 66 weapons, plus the big collectible and activity trophies.',
    tip: 'Work the checklist lines in parallel: a road trip that visits new areas also banks stunts, vehicle scans, WAiNK spots and meditation spots.',
  },
  {
    stage: 3,
    title: 'Stage 3 — Strangers & Freaks and cleanup (~10 hours)',
    time: 'Free-roam, after the checklist',
    blurb:
      'Finish the 8 stranger strands and the five named character quests (Andy, Kenton, Billy, Randy, Tyrone), then clean up the robberies, money trophies and the odd one-offs. Most of these pop along the way if the strands were started early.',
    tip: 'Leave cheats off for the whole run — guides agree cheats disable trophies, and they only unlock after the story anyway.',
  },
];

// Order the Next-up list: current stage first, missable first within a stage,
// then story, then the big grinds, then cleanup. Returns [{ trophy, why }].
export function nextUpOrder(trophies, earnedSet) {
  const remaining = trophies.filter((t) => !earnedSet.has(t.id));
  const stageOf = (t) => t.stage || 3;
  const rank = (t) => {
    if (t.missable) return 0;
    if (t.kind === 'story') return 1;
    if (t.grade === 'gold' || t.grade === 'silver') return 2;
    if (t.kind === 'collectibles') return 3;
    return 4;
  };
  const whyFor = (t) => {
    if (t.missable) return 'Do this FIRST — the only potentially missable trophy. The first meditation spot can be missed in Chapter 1.';
    if (t.kind === 'story') return 'Story progress — unlocks automatically as you play the chapters.';
    if (t.id === 'a-long-road') return 'The big one: the 100% checklist. Work it across the whole run; it pops last.';
    if (t.kind === 'collectibles') return 'Collectible grind — fold it into exploration trips so you do not re-drive the same roads.';
    if (t.grade === 'silver') return 'A long activity grind — chip away at it between story missions.';
    return 'Cleanup — best done in free-roam after the story, when nothing is locked behind missions.';
  };
  return remaining
    .map((t) => ({ trophy: t, why: whyFor(t) }))
    .sort((a, b) => stageOf(a.trophy) - stageOf(b.trophy) || rank(a.trophy) - rank(b.trophy));
}
