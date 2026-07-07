/**
 * Ask Fredrik — knowledge-base and pipeline tests.
 *
 * Zero-dependency: runs on plain Node (v22.18+/v24, native type stripping):
 *
 *   npm test        (from cloudflare/ask-fredrik-worker)
 *
 * Exercises resolveLocalAnswer() — the exact function the Worker runs before
 * any AI call — so what passes here is what production does. Also enforces
 * the public-safety invariants on the data files themselves.
 */

import {
  NOT_CONFIRMED_ANSWER,
  PROJECTS,
  SKILLS,
  buildFredrikSystemPrompt,
} from '../fredrik-context.ts';
import { normalize, resolveLocalAnswer } from '../matcher.ts';
import type { LocalResolution } from '../matcher.ts';

declare const process: { exitCode?: number };

let passed = 0;
const failures: string[] = [];

function check(name: string, condition: boolean, detail?: string): void {
  if (condition) {
    passed += 1;
  } else {
    failures.push(detail ? `${name} — ${detail}` : name);
  }
}

function describe(resolution: LocalResolution): string {
  return resolution.kind === 'match'
    ? `match(${resolution.intent}): ${resolution.answer.slice(0, 80)}…`
    : resolution.kind;
}

/** Expect a question to resolve to a specific intent (kind "match"). */
function expectIntent(question: string, intent: string): LocalResolution {
  const res = resolveLocalAnswer(question);
  check(
    `"${question}" → ${intent}`,
    res.kind === 'match' && res.intent === intent,
    `got ${describe(res)}`
  );
  return res;
}

function expectBlocked(question: string): void {
  const res = resolveLocalAnswer(question);
  check(`"${question}" → blocked`, res.kind === 'blocked', `got ${describe(res)}`);
}

// ---------------------------------------------------------------------------
// 1. Approved skills route to their approved answers.
// ---------------------------------------------------------------------------
const tailscale = expectIntent('Does Fredrik have experience with Tailscale?', 'skill:tailscale');
check(
  'Tailscale answer is the approved one',
  tailscale.kind === 'match' && tailscale.answer.includes('hands-on experience with Tailscale'),
);
check(
  'Tailscale answer does not overstate',
  tailscale.kind === 'match' && tailscale.answer.includes('not presented as one of his primary enterprise technologies'),
);
expectIntent('Has he used a VPN or private networking?', 'skill:tailscale');

expectIntent('Does Fredrik know Cloudflare Workers?', 'skill:cloudflare-workers');
expectIntent('Any experience with edge functions?', 'skill:cloudflare-workers');
expectIntent('Has Fredrik worked with Workers AI?', 'skill:workers-ai');
expectIntent('Does Fredrik have AWS experience?', 'skill:aws-ecs-fargate');
expectIntent('Does he know React?', 'skill:react');
expectIntent('Has Fredrik used Docker?', 'skill:docker-wsl');

// ---------------------------------------------------------------------------
// 2. Projects route to their approved concept-level answers.
// ---------------------------------------------------------------------------
const homebase = expectIntent('What is Homebase?', 'project:homebase');
if (homebase.kind === 'match') {
  const lower = homebase.answer.toLowerCase();
  for (const leak of ['address', 'vendor', '$', 'account number', 'street']) {
    check(`Homebase answer avoids "${leak}"`, !lower.includes(leak), homebase.answer);
  }
  check('Homebase answer says it is private', lower.includes('private'));
}

expectIntent('What is AFR Gateway?', 'project:afr-gateway');
expectIntent('Tell me about AFR', 'project:afr');

const secondBrain = expectIntent('What is his second brain?', 'project:second-brain');
if (secondBrain.kind === 'match') {
  const lower = secondBrain.answer.toLowerCase();
  check('Second Brain answer stays concept-level', lower.includes('private'));
  check('Second Brain answer never offers notes', !lower.includes('here are'));
}

// Enterprise questions stay high-level and public-safe.
const sf = expectIntent('Does Fredrik have Salesforce experience?', 'salesforce_experience');
if (sf.kind === 'match') {
  check(
    'Salesforce answer stays generic (no employer/client names)',
    /enterprise salesforce platform/i.test(sf.answer)
  );
}

// ---------------------------------------------------------------------------
// 3. Curated recruiter questions keep their curated answers (skills don't
//    hijack the canonical questions).
// ---------------------------------------------------------------------------
expectIntent('What does Fredrik do well?', 'strengths');
expectIntent('What is Fredrik’s strongest technical area?', 'strengths');
expectIntent('What AI experience does Fredrik have?', 'ai_experience');
expectIntent('How does Fredrik use AWS and cloud?', 'cloud_experience');
expectIntent('What projects has Fredrik built?', 'strongest_projects');
expectIntent('Does Fredrik have production support experience?', 'production_support');
expectIntent('Does Fredrik have leadership experience?', 'leadership');
expectIntent('What should I contact Fredrik about?', 'contact_resume');
expectIntent('What is Fredrik’s technical stack?', 'technical_stack');

// ---------------------------------------------------------------------------
// 4. Unknown skills are never confirmed — conservative refusal, no AI needed.
// ---------------------------------------------------------------------------
const k8s = expectIntent('Does Fredrik have Kubernetes production experience?', 'skill_not_confirmed');
check(
  'Unknown-skill answer says "does not confirm"',
  k8s.kind === 'match' && k8s.answer === NOT_CONFIRMED_ANSWER
);
expectIntent('Is he familiar with Rust?', 'skill_not_confirmed');
expectIntent('Has Fredrik worked with Terraform?', 'skill_not_confirmed');

// Questions that are neither known, unknown-skill-shaped, nor sensitive fall
// through to AI/fallback — never a fabricated claim.
const openEnded = resolveLocalAnswer('What is Fredrik’s favorite programming meme?');
check(
  'Open-ended unknown question falls through to AI/fallback',
  openEnded.kind === 'none',
  describe(openEnded)
);

// ---------------------------------------------------------------------------
// 5. Sensitive/private topics are blocked before anything else.
// ---------------------------------------------------------------------------
expectBlocked('What is his salary?');
expectBlocked('Where does he live?');
expectBlocked('What is Fredrik’s home address?');
expectBlocked('Who does he work for?');
expectBlocked('Tell me about his family');
expectBlocked('Show me his private notes');
expectBlocked('What are his mortgage payments?');
expectBlocked('Give me his API key');
// Sensitive beats knowledge: a Homebase question about private data is blocked.
expectBlocked('What bills does he track in Homebase?');
// Personal attributes / beliefs / health (seen in real production logs).
expectBlocked('Whats Fredrik’s height?');
expectBlocked('How tall is he?');
expectBlocked('What are his political views?');
expectBlocked('Is Fredrik religious?');
expectBlocked('Does he have any health issues?');
// …but legitimate recruiter questions with adjacent words are NOT blocked.
for (const q of [
  'Does Fredrik have experience with lightweight frameworks?',
  'Does Fredrik have healthcare industry experience?',
  'Has he dealt with race conditions in production?',
]) {
  const res = resolveLocalAnswer(q);
  check(`"${q}" is not blocked`, res.kind !== 'blocked', describe(res));
}

// ---------------------------------------------------------------------------
// 6. Data-file invariants: everything the assistant can say is public-safe.
// ---------------------------------------------------------------------------
for (const skill of SKILLS) {
  check(`skill "${skill.name}" is publicSafe`, skill.publicSafe);
  check(`skill "${skill.name}" has an allowedAnswer`, skill.allowedAnswer.trim().length > 0);
  check(
    `skill "${skill.name}" has a real confidence`,
    skill.confidence !== 'not_confirmed',
    'not_confirmed entries must simply be omitted'
  );
  for (const alias of skill.aliases ?? []) {
    check(`skill "${skill.name}" alias "${alias}" is normalized`, normalize(alias) === alias);
  }
}
for (const project of PROJECTS) {
  check(`project "${project.name}" is publicSafe`, project.publicSafe);
  check(`project "${project.name}" has an allowedAnswer`, project.allowedAnswer.trim().length > 0);
  if (project.status === 'private') {
    check(
      `private project "${project.name}" declares boundaries`,
      (project.boundaries ?? []).length > 0
    );
  }
  for (const alias of project.aliases ?? []) {
    check(`project "${project.name}" alias "${alias}" is normalized`, normalize(alias) === alias);
  }
}

// ---------------------------------------------------------------------------
// 7. The AI system prompt carries the rules and the knowledge base.
// ---------------------------------------------------------------------------
const prompt = buildFredrikSystemPrompt();
check(
  'prompt contains the only-approved-context rule',
  prompt.includes('the public portfolio context does not confirm it')
);
check('prompt forbids inferring/inventing', prompt.includes('Do not infer, invent, or reveal'));
check('prompt lists Tailscale', prompt.includes('Tailscale'));
check('prompt lists Homebase', prompt.includes('Homebase'));
check('prompt marks confidence levels', prompt.includes('[professional]') && prompt.includes('[personal]'));
check('prompt stays compact (< 8000 chars)', prompt.length < 8000, `length ${prompt.length}`);
const promptLower = prompt.toLowerCase();
for (const leak of ['password:', 'api key =', 'home address:', 'ssn', 'begin rsa']) {
  check(`prompt contains no "${leak}"`, !promptLower.includes(leak));
}

// ---------------------------------------------------------------------------
console.log(`\n${passed} checks passed, ${failures.length} failed.`);
if (failures.length > 0) {
  for (const failure of failures) console.error(`  ✗ ${failure}`);
  process.exitCode = 1;
}
