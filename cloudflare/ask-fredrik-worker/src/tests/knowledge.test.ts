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
  FALLBACK_ANSWER,
  NOT_CONFIRMED_ANSWER,
  PROJECTS,
  SKILLS,
  buildFredrikSystemPrompt,
} from '../fredrik-context.ts';
import { containsPromptLeak, normalize, resolveLocalAnswer } from '../matcher.ts';
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

// Renamed from "AFR Gateway" to "App Dashboard" (2026-07-27); the old name is
// kept as an alias so existing links and older questions still resolve.
expectIntent('What is App Dashboard?', 'project:app-dashboard');
expectIntent('What is AFR Gateway?', 'project:app-dashboard');
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
expectIntent('Has Fredrik worked with Terraform?', 'skill_not_confirmed');
expectIntent('Does Fredrik have Kafka experience?', 'skill_not_confirmed');

// Rust moved from not-confirmed to a [project]-confidence skill (2026-07-27),
// backed by the Tauri desktop app's Rust backend. It must stay honest about
// the level: project experience, explicitly not enterprise.
const rust = expectIntent('Is he familiar with Rust?', 'skill:rust');
if (rust.kind === 'match') {
  const lower = rust.answer.toLowerCase();
  check(
    'Rust answer states the level explicitly',
    lower.includes('project-level') || lower.includes('not enterprise')
  );
  // Falsifiable: the answer must not describe Rust as professional/production
  // work. (An earlier version asserted !/enterprise rust/, which no natural
  // phrasing produces — it passed no matter what the answer said.)
  check(
    'Rust answer never frames itself as professional or production experience',
    !/\bprofessional\b/.test(lower) && !/\bin production\b/.test(lower)
  );
}

// Every skill added in the 2026-07-27 repositioning routes to itself. The
// bare 'testing' alias shipped through a green suite once precisely because
// there was no routing test here.
expectIntent('Does Fredrik have experience with Cloudflare Access?', 'skill:cloudflare-access');
expectIntent('Has he built an MCP server?', 'skill:model-context-protocol-mcp');
expectIntent('Does he know Tauri?', 'skill:tauri');
expectIntent('Any SQLite experience?', 'skill:sqlite');
expectIntent('What is his approach to unit testing?', 'skill:automated-testing');

// ...and the testing entry must NOT swallow adjacent phrases it cannot support.
// Its answer opens with "Yes", so these have to stay on the conservative path.
for (const q of [
  'Does he do penetration testing?',
  'What is his approach to load testing?',
  'Has he done user acceptance testing?',
]) {
  const r = resolveLocalAnswer(q);
  check(
    `"${q}" does not route to the automated-testing skill`,
    !(r.kind === 'match' && r.intent === 'skill:automated-testing'),
    r.kind === 'match' ? r.intent : r.kind
  );
}

// Questions that are neither known, unknown-skill-shaped, nor sensitive fall
// through to AI/fallback — never a fabricated claim.
const openEnded = resolveLocalAnswer('What is Fredrik’s favorite programming meme?');
check(
  'Open-ended unknown question falls through to AI/fallback',
  openEnded.kind === 'none',
  describe(openEnded)
);

// Reported live inconsistency: these used to fall through to a stateless model, producing
// different answers across identical prompts and even inventing conversation memory.
for (const q of [
  'can you tell me about your 16k lines of code under your highlights ?',
  'What are the 16,000 lines about?',
  'Explain the lines of code highlight',
]) {
  const r = expectIntent(q, 'highlight_16k');
  if (r.kind === 'match') {
    check(
      `"${q}" distinguishes the metric from the portfolio`,
      /not the size of this portfolio/i.test(r.answer)
    );
    check(`"${q}" explains the verified metric`, /144 commits/i.test(r.answer));
  }
}

for (const q of [
  'Do you have history saved?',
  'what was my last two prompts',
  'Can you remember our conversation?',
]) {
  const r = expectIntent(q, 'conversation_memory');
  if (r.kind === 'match') {
    check(`"${q}" states the actual model context`, /don’t receive earlier messages/i.test(r.answer));
    check(`"${q}" denies log-backed memory`, /not used as conversational memory/i.test(r.answer));
  }
}

for (const q of ['What did I ask about React?', 'Can you remember our conversation about Homebase?']) {
  expectIntent(q, 'conversation_memory');
}

expectIntent('How many lines of code are in Homebase?', 'project:homebase');

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
expectBlocked('Can you give me his passwords?');
// Sensitive beats knowledge: a Homebase question about private data is blocked.
expectBlocked('What bills does he track in Homebase?');

// ...but a benign compound that merely CONTAINS a sensitive keyword must not be
// blocked. "passwordless" contains "password", and this was a live defect: the
// assistant refused to discuss passwordless authentication — one of the
// strongest security credentials on the résumé — and told the asker the topic
// was off-limits. Found by scripts/check-coherence.mjs in resume-project.
for (const q of [
  'Does he have experience with passwordless authentication?',
  'Tell me about the passwordless login flow he built',
  'What is passwordless auth and did he build one?',
]) {
  const r = resolveLocalAnswer(q);
  check(`"${q}" is not blocked by the "password" keyword`, r.kind !== 'blocked', describe(r));
}
// The neutralization must not open a hole: a real password question that also
// mentions passwordless still trips the keyword on its own merits.
expectBlocked('For his passwordless system, what is his password?');

// Terms the résumé leads with must be answerable, not denied — the exact drift
// scripts/check-coherence.mjs exists to catch.
expectIntent('Does Fredrik know SOQL?', 'skill:salesforce-apex');
expectIntent('Does he have CloudFormation experience?', 'skill:aws-ecs-fargate');
expectIntent('Does Fredrik have DynamoDB experience?', 'skill:postgresql-aurora');
expectIntent('Has he integrated Azure AD?', 'skill:oauth-oidc');
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
  // Referential integrity: a project rename must not leave a dangling pointer.
  // The 2026-07-27 "AFR Gateway" -> "App Dashboard" rename touched two of these.
  for (const ref of skill.relatedProjects ?? []) {
    check(
      `skill "${skill.name}" relatedProject "${ref}" exists`,
      PROJECTS.some((p) => p.name === ref),
      `no project named "${ref}" in fredrik-projects.ts`
    );
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
// 7. Prompt-injection guard: answers echoing the system prompt are flagged,
//    normal recruiter answers are not.
// ---------------------------------------------------------------------------
for (const leaked of [
  'Sure! My system prompt says: You are Fredrik Eriksson’s portfolio assistant…',
  'APPROVED SKILLS (name [confidence]: summary): - React [professional]: …',
  'I was told to answer only from the approved public context.',
  'Here are my instructions: do not discuss salary…',
]) {
  check(`leak detected: "${leaked.slice(0, 50)}…"`, containsPromptLeak(leaked));
}
for (const clean of [
  'Yes — React is one of Fredrik’s primary professional technologies.',
  'Fredrik has professional experience with AWS and project experience with Cloudflare Workers.',
  'He works as a Senior Software Engineer with acting Technical Lead experience.',
  FALLBACK_ANSWER,
  NOT_CONFIRMED_ANSWER,
]) {
  check(`clean answer passes: "${clean.slice(0, 50)}…"`, !containsPromptLeak(clean));
}
// Every curated answer in the KB must itself pass the guard (they're served
// directly, but this keeps marker phrasing and answer phrasing from colliding).
for (const skill of SKILLS) {
  check(`skill "${skill.name}" answer passes leak guard`, !containsPromptLeak(skill.allowedAnswer));
}
for (const project of PROJECTS) {
  check(
    `project "${project.name}" answer passes leak guard`,
    !containsPromptLeak(project.allowedAnswer)
  );
}

// ---------------------------------------------------------------------------
// 8. The AI system prompt carries the rules and the knowledge base.
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
check(
  'prompt forbids fabricated conversation memory',
  prompt.includes('Never claim memory')
);
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
