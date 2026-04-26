#!/usr/bin/env node
/**
 * tools/review-directions.js
 *
 * Interactive review of directional issues flagged by audit-directions.js.
 * For each critical issue, prints a Google Maps URL plotting the toll
 * booth + the bypass's exit and entry ramps. You eyeball the map and
 * answer:
 *
 *   y / yes      = the bypass is correct, false positive in audit
 *   n / no       = the bypass is genuinely wrong, fix the data
 *   s / skip     = move on, decide later
 *   q / quit     = stop the session, save progress
 *
 * Answers are saved to tools/direction-review.json. Re-running the tool
 * resumes where you left off. Read-only — no changes to data/tolls.js.
 *
 * Run from the repo root:
 *
 *     node tools/review-directions.js
 */

const fs       = require('fs');
const path     = require('path');
const readline = require('readline');

const auditPath  = path.join(__dirname, 'direction-audit.json');
const reviewPath = path.join(__dirname, 'direction-review.json');

if (!fs.existsSync(auditPath)) {
  console.error(`Missing ${auditPath}. Run \`node tools/audit-directions.js\` first.`);
  process.exit(1);
}

const audit = JSON.parse(fs.readFileSync(auditPath, 'utf8'));
const issues = audit.issues.filter(i => i.severity === 'critical');

console.log(`${issues.length} critical issues from ${audit.generated.slice(0, 10)}.`);

// Load existing review (resume support)
let reviewed = {};
if (fs.existsSync(reviewPath)) {
  try {
    reviewed = JSON.parse(fs.readFileSync(reviewPath, 'utf8')).answers || {};
    const done = Object.keys(reviewed).length;
    if (done > 0) {
      console.log(`Resuming — ${done} already reviewed.`);
    }
  } catch (e) {
    console.warn('Could not parse existing review file; starting fresh.');
  }
}

function keyFor(issue) {
  return `${issue.tollId}::${issue.dirKey}`;
}

// Google Maps "directions" URL plotting exit → toll → entry. The route
// engine will draw whatever it thinks is the natural path, but the three
// pins are what matters — you eyeball whether the geometry makes sense
// for the named direction of travel.
function gmapsURL(issue) {
  const d = issue.details;
  if (!d) return null;
  const origin   = `${d.exit.lat},${d.exit.lng}`;
  const dest     = `${d.entry.lat},${d.entry.lng}`;
  const waypoint = `${d.tollPos.lat},${d.tollPos.lng}`;
  return `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${dest}&waypoints=${waypoint}&travelmode=driving`;
}

// Plain "search the toll on the map" URL as a fallback for context.
function tollURL(issue) {
  const d = issue.details;
  if (!d) return null;
  return `https://www.google.com/maps/@${d.tollPos.lat},${d.tollPos.lng},14z`;
}

function saveProgress() {
  fs.writeFileSync(reviewPath, JSON.stringify({
    generated: new Date().toISOString(),
    answers: reviewed,
  }, null, 2));
}

function summary() {
  const counts = { ok: 0, broken: 0, skip: 0 };
  for (const v of Object.values(reviewed)) {
    if (v.answer === 'ok')     counts.ok++;
    if (v.answer === 'broken') counts.broken++;
    if (v.answer === 'skip')   counts.skip++;
  }
  return counts;
}

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
function ask(q) {
  return new Promise(res => rl.question(q, ans => res(ans.trim().toLowerCase())));
}

async function main() {
  let stopped = false;

  for (let i = 0; i < issues.length; i++) {
    const issue = issues[i];
    const k = keyFor(issue);
    if (reviewed[k]) continue; // already reviewed

    console.log('\n' + '═'.repeat(72));
    console.log(`[${i + 1}/${issues.length}] ${issue.tollId} · ${issue.name}`);
    console.log(`Direction: ${issue.dirLabel}`);
    for (const p of issue.problems) {
      console.log(`  ✗ ${p}`);
    }
    const d = issue.details;
    if (d) {
      console.log(`  toll  @ (${d.tollPos.lat.toFixed(5)}, ${d.tollPos.lng.toFixed(5)})`);
      console.log(`  exit  "${d.exitName}"  @ (${d.exit.lat.toFixed(5)}, ${d.exit.lng.toFixed(5)})`);
      console.log(`  entry "${d.entryName}" @ (${d.entry.lat.toFixed(5)}, ${d.entry.lng.toFixed(5)})`);
    }
    const url = gmapsURL(issue);
    if (url) {
      console.log(`\nOpen in Google Maps (Cmd-click the URL):`);
      console.log(`  ${url}`);
    }

    const ans = await ask('\n[y]es correct  [n]o broken  [s]kip  [q]uit > ');

    let answerCode;
    if (ans === 'y' || ans === 'yes')  answerCode = 'ok';
    else if (ans === 'n' || ans === 'no') answerCode = 'broken';
    else if (ans === 'q' || ans === 'quit') { stopped = true; break; }
    else answerCode = 'skip';

    reviewed[k] = {
      answer: answerCode,
      tollId: issue.tollId,
      dirKey: issue.dirKey,
      reviewedAt: new Date().toISOString(),
    };
    saveProgress();
  }

  rl.close();

  const c = summary();
  console.log('\n' + '═'.repeat(72));
  console.log(stopped ? 'Session paused.' : 'Review complete.');
  console.log(`  Reviewed:  ${c.ok + c.broken + c.skip} / ${issues.length}`);
  console.log(`  ✓ correct:  ${c.ok}  (false positives in audit)`);
  console.log(`  ✗ broken:   ${c.broken}  (need data fix)`);
  console.log(`  ? skipped:  ${c.skip}`);
  console.log(`\nProgress saved → ${reviewPath}`);

  if (c.broken > 0) {
    console.log(`\nBroken directions to fix:`);
    for (const [k, v] of Object.entries(reviewed)) {
      if (v.answer === 'broken') console.log(`  ${v.tollId} · ${v.dirKey}`);
    }
  }
}

main().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
