'use client';
import { useAccessibleMotion } from '@/lib/use-reduced-motion';
import Link from 'next/link';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { motion, useInView, useScroll, useTransform } from 'motion/react';
import {
  ArrowRight,
  ArrowDown,
  Check,
  Mail,
  GitBranch,
  CreditCard,
  ShieldCheck,
  Workflow,
  CheckCheck,
  History,
  SlidersHorizontal,
} from 'lucide-react';
import { actions, contextFor } from '@/data/seed';
import { DEFAULT_POLICY, RULES } from '@/lib/policy';
import { scoreAll, tierCounts, autonomyRate } from '@/lib/score';
import { AnimatedNumber, TrustRing } from '@/components/review/trust-meter';
import { RiskBreakdown } from '@/components/review/risk-breakdown';
import { AuditTimeline } from '@/components/review/audit-timeline';
import { NOW } from '@/lib/time';
const baseline = scoreAll(actions, contextFor, DEFAULT_POLICY);
const relaxed = scoreAll(actions, contextFor, { ...DEFAULT_POLICY, reviewThreshold: 50 });
const counts = tierCounts(baseline);
const ease = [0.22, 1, 0.36, 1] as const;
function Reveal({
  children,
  className = '',
  delay = 0,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
}) {
  const reduced = useAccessibleMotion();
  return (
    <motion.div
      className={className}
      initial={reduced ? false : { opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.4 }}
      transition={{ duration: reduced ? 0 : 0.7, delay: reduced ? 0 : delay, ease }}
    >
      {children}
    </motion.div>
  );
}
function FlowDiagram() {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = useAccessibleMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start 85%', 'center 45%'] });
  const pathLength = useTransform(scrollYProgress, [0, 1], [0, 1]);
  return (
    <div className="flow-comparison" ref={ref}>
      <div className="flow-before">
        <div className="flow-caption">
          <span>Before</span>
          <small>One gate. Every action.</small>
        </div>
        <div className="before-dots">
          {Array.from({ length: 18 }, (_, i) => (
            <motion.i
              key={i}
              initial={reduced ? false : { opacity: 0, x: -25 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ delay: reduced ? 0 : i * 0.04 }}
            />
          ))}
        </div>
        <div className="funnel-lines" />
        <div className="human-node">
          <History size={22} />
          <strong>
            Human reviews
            <br />
            everything
          </strong>
        </div>
        <div className="waiting">
          <AnimatedNumber value={actions.length} /> actions waiting
        </div>
        <p>Autonomy stops at your inbox.</p>
      </div>
      <div className="flow-after">
        <div className="flow-caption">
          <span>With the review queue</span>
          <small>The right level of trust.</small>
        </div>
        <div className="routing-visual">
          <div className="engine-node">
            <Workflow size={24} />
            <strong>
              Policy
              <br />
              engine
            </strong>
            <span>Score every action</span>
          </div>
          <svg
            viewBox="0 0 300 260"
            preserveAspectRatio="none"
            className="branch-svg"
            aria-hidden="true"
          >
            {[
              'M 0 130 C 150 130 100 38 300 38',
              'M 0 130 L 300 130',
              'M 0 130 C 150 130 100 222 300 222',
            ].map((d, i) => (
              <motion.path
                key={d}
                d={d}
                className={['auto-stroke', 'review-stroke', 'blocked-stroke'][i]}
                style={{ pathLength: reduced ? 1 : pathLength }}
              />
            ))}
            {!reduced &&
              [38, 130, 222].map((y, i) => (
                <motion.circle
                  key={y}
                  r="4"
                  className={['auto-fill', 'review-fill', 'blocked-fill'][i]}
                  initial={{ cx: 0, cy: 130, opacity: 0 }}
                  whileInView={{
                    cx: [0, 150, 300],
                    cy: [130, (130 + y) / 2, y],
                    opacity: [0, 1, 0],
                  }}
                  transition={{ duration: 2.6, delay: i * 0.5, repeat: Infinity, ease: 'linear' }}
                />
              ))}
          </svg>
          <div className="route-destinations">
            {(['auto', 'review', 'blocked'] as const).map((t, i) => (
              <div key={t} className={`route-destination ${t}`}>
                <span>
                  <i className={`dot ${t}`} />
                  {['Auto-run', 'Review', 'Blocked'][i]}
                </span>
                <strong>
                  <AnimatedNumber
                    value={Math.round((counts[t] / actions.length) * 100)}
                    suffix="%"
                  />
                </strong>
                <small>
                  <AnimatedNumber value={counts[t]} /> actions
                </small>
              </div>
            ))}
          </div>
        </div>
        <p>Every action has a path. Every decision has a reason.</p>
      </div>
    </div>
  );
}
function Impact() {
  const ref = useRef<HTMLDivElement>(null);
  const visible = useInView(ref, { once: true, amount: 0.4 });
  const reduced = useAccessibleMotion();
  const [graduated, setGraduated] = useState(false);
  useEffect(() => {
    if (!visible || reduced) return;
    const timeout = setTimeout(() => setGraduated(true), 2600);
    return () => clearTimeout(timeout);
  }, [visible, reduced]);
  const final = reduced || graduated;
  const data = final ? relaxed : baseline;
  const unreviewed = data.filter(
    (x) => x.result.tier === 'auto' && x.result.score >= (final ? 50 : 40),
  ).length;
  return (
    <div ref={ref} className="impact-demo">
      <div className="impact-meter">
        <TrustRing value={visible || reduced ? autonomyRate(data) : 0} />
        <div>
          <span className="eyebrow">Trust, tuned to your team</span>
          <h3>
            More autonomy.
            <br />
            Same control.
          </h3>
          <p>
            {autonomyRate(baseline)}% → {autonomyRate(relaxed)}% of actions cleared automatically
          </p>
        </div>
      </div>
      <div className="impact-slider">
        <div>
          <SlidersHorizontal size={16} />
          <span>Review threshold</span>
          <strong>{final ? 50 : 40}</strong>
        </div>
        <div className="demo-slider-track">
          <motion.div
            initial={false}
            animate={{ scaleX: final ? 0.5 : 0.4 }}
            transition={{ duration: reduced ? 0 : 1 }}
          />
          <motion.i
            initial={false}
            animate={{ left: final ? '50%' : '40%' }}
            transition={{ duration: reduced ? 0 : 1 }}
          />
        </div>
        <p>
          {tierCounts(relaxed).auto - tierCounts(baseline).auto} more actions earn the green light.
        </p>
      </div>
      <div className="impact-outcomes">
        <div>
          <span>Policy-risky actions reaching customers unreviewed</span>
          <strong>
            <span className="muted">? → </span>
            <AnimatedNumber value={unreviewed} />
          </strong>
          <motion.div
            className="outcome-rule"
            initial={reduced ? false : { scaleX: 0 }}
            whileInView={{ scaleX: 1 }}
            viewport={{ once: true }}
            transition={{ duration: reduced ? 0 : 1 }}
            style={{ transformOrigin: 'left' }}
          />
          <small>Simulated outcome under the active policy; no actions are sent.</small>
        </div>
        <div>
          <span>Review time per action</span>
          <strong>
            <span className="muted">~2 min → </span>~15 s
          </strong>
          <small>Estimate with evidence + batch approval, not a measured result.</small>
        </div>
      </div>
    </div>
  );
}
export function Story() {
  const reduced = useAccessibleMotion();
  const hero = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: hero, offset: ['start start', 'end start'] });
  const y = useTransform(scrollYProgress, [0, 1], [0, 65]);
  return (
    <main className="story-page">
      <section className="story-hero" aria-label="The problem space" ref={hero}>
        <motion.div style={{ y: reduced ? 0 : y }} className="hero-content">
          <Reveal>
            <div className="hero-badges">
              <span>
                <i className="logo-mark" />
                Agent Action Review Queue
              </span>
              <span className="domain-chip">
                Open-source <span>· human-in-the-loop for CRM agents</span>
              </span>
            </div>
            <h1>
              AI agents now do CRM work
              <br className="desktop-break" /> on their own.
            </h1>
            <p className="hero-subtitle">
              They send the follow-ups, update the deals and change the subscriptions.
              <br />
              The next question is how a team can trust them.
            </p>
            <div className="hero-links">
              <Link className="button primary large" href="/review">
                Explore the review queue <ArrowRight size={18} />
              </Link>
              <a className="text-link" href="#permission-problem">
                See the thinking <ArrowDown size={15} />
              </a>
            </div>
          </Reveal>
          <div className="hero-stats">
            {[
              {
                value: actions.length,
                suffix: '',
                label: 'proposed agent actions in the demo workspace',
                source: 'Seeded, schema-validated actions',
              },
              {
                value: RULES.length,
                suffix: '',
                label: `explainable policy rules, ${RULES.filter((r) => r.hardBlock).length} of them hard blocks`,
                source: 'Deterministic scoring engine',
              },
              {
                value: autonomyRate(baseline),
                suffix: '%',
                label: 'of actions cleared to auto-run at the default policy',
                source: 'Computed live from the seed',
              },
            ].map((s, i) => (
              <Reveal key={s.label} delay={i * 0.08}>
                <strong>
                  <AnimatedNumber value={s.value} suffix={s.suffix} />
                </strong>
                <span>{s.label}</span>
                <small className="stat-source">{s.source}</small>
              </Reveal>
            ))}
          </div>
        </motion.div>
        <div className="hero-bottom">
          <span>An independent project · Built with Codex, verified by Claude Code</span>
          <span>
            From permission to judgment <ArrowDown size={14} />
          </span>
        </div>
      </section>
      <section
        id="permission-problem"
        className="story-section pain-section"
        aria-label="The permission problem"
      >
        <div className="pain-grid">
          <div>
            <Reveal>
              <h2>
                They can act.
                <br />
                But should they?
              </h2>
              <p className="section-intro">
                An email to the CFO. A deal marked lost. A promise that changes the price. Small
                actions can carry real consequences.
              </p>
            </Reveal>
            <Reveal delay={0.16}>
              <blockquote>
                “Never let your AI SDR send its first 1,000 emails without manually reviewing every
                single one.”
                <footer>
                  <span className="quote-avatar">
                    <Mail size={15} />
                  </span>
                  <div>
                    <strong>Common advice from sales leaders</strong>
                    <span>
                      Users of agentic CRM and AI SDR tools report damaged email domains, spam
                      complaints and pricing promises nobody approved.
                    </span>
                  </div>
                </footer>
              </blockquote>
            </Reveal>
          </div>
          <div className="action-stream">
            {[
              {
                Icon: Mail,
                title: 'Email the CFO of Northwind',
                text: '“We can offer a 15% discount…”',
                agent: 'Pipeline Monitor',
                tier: 'review',
              },
              {
                Icon: GitBranch,
                title: 'Move Lumen to Closed Lost',
                text: '$28,000 deal · stage change',
                agent: 'Pipeline Monitor',
                tier: 'review',
              },
              {
                Icon: CreditCard,
                title: 'Apply a Stripe discount',
                text: 'Annual subscription · 15% off',
                agent: 'Upsell Agent',
                tier: 'review',
              },
            ].map((a, i) => (
              <motion.div
                key={a.title}
                className="stream-card"
                initial={reduced ? false : { opacity: 0, x: 60, rotate: 3 }}
                whileInView={{ opacity: 1, x: 0, rotate: i === 1 ? -2 : 1 }}
                viewport={{ once: true }}
                transition={{ delay: reduced ? 0 : i * 0.15, duration: 0.6, ease }}
              >
                <div className="stream-icon">
                  <a.Icon size={21} />
                </div>
                <div>
                  <small>{a.agent}</small>
                  <strong>{a.title}</strong>
                  <p>{a.text}</p>
                </div>
                <span className="question-mark">?</span>
              </motion.div>
            ))}
            <div className="stream-caption">
              <span className="dot review" />
              Access granted. Judgment still needed.
            </div>
          </div>
        </div>
        <Reveal>
          <p className="pain-bottom">
            Scopes say <strong>can</strong> an agent act.
            <br />
            The review queue asks <strong>should this action run now?</strong>
          </p>
        </Reveal>
      </section>
      <section className="story-section flow-section" aria-label="Before and after">
        <Reveal>
          <div className="section-head">
            <h2>
              A checkpoint.
              <br />
              Not a bottleneck.
            </h2>
            <p>
              Let the safe work flow.
              <br />
              Bring the consequential decisions to you.
            </p>
          </div>
        </Reveal>
        <Reveal>
          <FlowDiagram />
        </Reveal>
      </section>
      <section className="story-section decision-section" aria-label="The decision">
        <Reveal>
          <h2>Build the missing layer.</h2>
          <p className="section-intro">Two useful ideas. One much bigger opening.</p>
        </Reveal>
        <div className="option-grid">
          <Reveal className="option-card dismissed">
            <span>Option A</span>
            <h3>
              Deal freshness
              <br />
              auto-updates
            </h3>
            <p>
              Valuable, but it helps one agent. Most agentic CRMs already sync deals from email and
              meetings.
            </p>
            <div className="option-status">Narrower reach</div>
          </Reveal>
          <Reveal className="option-card chosen" delay={0.08}>
            <span>
              Option B <Check size={18} />
            </span>
            <h3>
              Agent Action
              <br />
              Review Queue
            </h3>
            <p>A policy layer that gives every proposed action the right level of oversight.</p>
            <div className="option-status">
              <CheckCheck size={17} />
              The feature we built
            </div>
          </Reveal>
        </div>
        <div className="decision-reasons">
          {[
            'Builders in this space call agent permissioning an unsolved problem.',
            'It gates every agent, including deal updates.',
            'It extends the AI SDK’s existing needsApproval hook.',
          ].map((text, i) => (
            <Reveal key={text} delay={i * 0.08}>
              <Check size={17} />
              <p>{text}</p>
            </Reveal>
          ))}
        </div>
      </section>
      <section className="story-section how-section" aria-label="How it works">
        <Reveal>
          <h2>
            Context in.
            <br />
            Confidence out.
          </h2>
          <p className="section-intro">
            A deterministic policy. An explainable decision. A record you can follow.
          </p>
        </Reveal>
        <div className="steps-grid">
          <Reveal className="step" delay={0}>
            <span className="step-number">1</span>
            <h3>Score</h3>
            <p>Read the context. Add up the risk signals. Show exactly why.</p>
            <div className="step-demo">
              <RiskBreakdown loop reasons={baseline[0].result.reasons.slice(0, 3)} />
            </div>
          </Reveal>
          <Reveal className="step" delay={0.08}>
            <span className="step-number">2</span>
            <h3>Route</h3>
            <p>Auto-run the routine. Review the risky. Block policy violations.</p>
            <div className="step-demo route-mini">
              {(['auto', 'review', 'blocked'] as const).map((tier, i) => (
                <div key={tier}>
                  <span className={`dot ${tier}`} />
                  {['Auto-run', 'Review', 'Blocked'][i]}
                  <motion.span
                    className={`mini-card ${tier}`}
                    initial={false}
                    animate={reduced ? {} : { x: [-15, 0, 0], opacity: [0, 1, 1] }}
                    transition={{ duration: 3, delay: i * 0.35, repeat: Infinity }}
                  >
                    {counts[tier]} actions
                  </motion.span>
                </div>
              ))}
            </div>
          </Reveal>
          <Reveal className="step" delay={0.16}>
            <span className="step-number">3</span>
            <h3>Review & audit</h3>
            <p>Evidence beside the action. One click to decide. Every choice recorded.</p>
            <div className="step-demo audit-mini">
              <motion.div
                animate={reduced ? {} : { opacity: [0, 1, 1], y: [-8, 0, 0] }}
                transition={{ duration: 4, repeat: Infinity }}
              >
                <AuditTimeline
                  events={[
                    {
                      id: 'story-event',
                      actionId: 'a01',
                      actor: 'Alex Rivera',
                      decision: 'approved',
                      tierAtDecision: 'review',
                      score: baseline[0].result.score,
                      at: NOW,
                    },
                  ]}
                />
              </motion.div>
            </div>
          </Reveal>
        </div>
      </section>
      <section className="story-section impact-section" aria-label="The impact">
        <Reveal>
          <div className="section-head">
            <h2>
              Trust that grows
              <br />
              with your agents.
            </h2>
            <p>
              Real policy logic. Fictional workspace.
              <br />
              These numbers come from the {actions.length}-action seed.
            </p>
          </div>
        </Reveal>
        <Reveal>
          <Impact />
        </Reveal>
        <div className="story-cta">
          <ShieldCheck size={30} />
          <h2>
            Let your agents work.
            <br />
            Keep the final say.
          </h2>
          <Link className="button primary large" href="/review">
            Open the Review Queue <ArrowRight size={19} />
          </Link>
          <p>No sign-up. No credentials. Just a workspace to explore.</p>
        </div>
      </section>
      <footer className="story-footer">
        <Link className="brand" href="/story">
          <i className="logo-mark" />
          Review Queue
        </Link>
        <p>An independent open-source project. Built with Codex, verified by Claude Code.</p>
        <Link href="/review">
          Explore the demo <ArrowRight size={14} />
        </Link>
      </footer>
    </main>
  );
}
