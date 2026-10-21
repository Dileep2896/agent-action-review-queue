'use client';
import { useEffect, useReducer, useState } from 'react';
import * as Tabs from '@radix-ui/react-tabs';
import {
  SlidersHorizontal,
  Search,
  Check,
  Undo2,
  ArrowDownWideNarrow,
  Command as CommandIcon,
} from 'lucide-react';
import { toast } from 'sonner';
import { agents, contextFor } from '@/data/seed';
import { DEFAULT_POLICY } from '@/lib/policy';
import { createQueue, queueReducer, type QueueAction } from '@/lib/queue';
import { toolNames, type ProposedAction, type Tier } from '@/lib/types';
import { Button, Modal, Tip } from '@/components/ui/primitives';
import { TrustMeter } from './trust-meter';
import { ActionList } from './action-list';
import { ActionDetail } from './action-detail';
import { PolicyDrawer } from './policy-drawer';
import { AuditTimeline } from './audit-timeline';
import { CommandMenu } from './command-menu';
export function ReviewApp({ initialActions }: { initialActions: ProposedAction[] }) {
  const [state, dispatch] = useReducer(queueReducer, initialActions, (a) =>
    createQueue(a, DEFAULT_POLICY, contextFor),
  );
  const [tab, setTab] = useState<Tier | 'decided'>('review');
  const [activeId, setActiveId] = useState(initialActions[0]?.id);
  const [selected, setSelected] = useState<string[]>([]);
  const [agent, setAgent] = useState('all');
  const [tool, setTool] = useState('all');
  const [query, setQuery] = useState('');
  const [policyOpen, setPolicyOpen] = useState(false);
  const [commandOpen, setCommandOpen] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [reason, setReason] = useState('');
  const [draft, setDraft] = useState('');
  const [editError, setEditError] = useState('');
  const inTab = (i: (typeof state.items)[number]) =>
    tab === 'decided' ? i.status !== 'pending' : i.status === 'pending' && i.result.tier === tab;
  const visible = state.items.filter(
    (i) =>
      inTab(i) &&
      (agent === 'all' || i.action.agentId === agent) &&
      (tool === 'all' || i.action.tool === tool) &&
      (!query || i.action.summary?.toLowerCase().includes(query.toLowerCase())),
  );
  const active = visible.find((i) => i.action.id === activeId) ?? visible[0];
  const count = (t: typeof tab) =>
    state.items.filter((i) =>
      t === 'decided' ? i.status !== 'pending' : i.status === 'pending' && i.result.tier === t,
    ).length;
  const decide = (event: QueueAction) => {
    try {
      const next = queueReducer(state, event);
      if (next === state) {
        toast('No pending review actions match this command.');
        return;
      }
      dispatch(event);
      setSelected([]);
      toast(event.type === 'reject' ? 'Action rejected' : 'Decision recorded', {
        action: { label: 'Undo', onClick: () => dispatch({ type: 'undo' }) },
      });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Unable to record decision');
    }
  };
  const openReject = () => {
    setReason('');
    setRejectOpen(true);
  };
  const openEdit = () => {
    if (!active) return;
    setDraft(
      active.action.tool === 'send_email'
        ? active.action.payload.body
        : JSON.stringify(active.action.payload, null, 2),
    );
    setEditError('');
    setEditOpen(true);
  };
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setCommandOpen((v) => !v);
        return;
      }
      const target = e.target as HTMLElement;
      if (
        target.closest(
          'input,textarea,select,[contenteditable="true"],[role="dialog"],[role="slider"],[role="combobox"]',
        ) ||
        policyOpen ||
        commandOpen ||
        rejectOpen ||
        editOpen
      )
        return;
      if (e.key === 'j' || e.key === 'k') {
        e.preventDefault();
        const index = visible.findIndex((i) => i.action.id === active?.action.id);
        setActiveId(
          visible[Math.max(0, Math.min(visible.length - 1, index + (e.key === 'j' ? 1 : -1)))]
            ?.action.id,
        );
      }
      if (active?.status === 'pending' && active.result.tier === 'review') {
        if (e.key === 'a') {
          e.preventDefault();
          decide({ type: 'approve', id: active.action.id });
        }
        if (e.key === 'r') {
          e.preventDefault();
          openReject();
        }
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  });
  return (
    <main className="review-page">
      <div className="page-heading">
        <div>
          <div className="breadcrumb">
            Workspace <span>/</span> Agent oversight
          </div>
          <h1>
            Review queue
            <span className="live-dot" />
          </h1>
          <p>Your agents did the groundwork. Make the calls that matter.</p>
        </div>
        <div className="heading-actions">
          <Tip label="Search commands (⌘K)">
            <Button onClick={() => setCommandOpen(true)} aria-label="Open commands">
              <CommandIcon size={16} />
              <kbd>⌘ K</kbd>
            </Button>
          </Tip>
          <Button onClick={() => setPolicyOpen(true)} aria-label="Policy settings">
            <SlidersHorizontal size={16} />
            Policy settings
          </Button>
        </div>
      </div>
      <TrustMeter items={state.items} />
      <div className="queue-section-head">
        <div>
          <h2>A little oversight. A lot of progress.</h2>
          <p>
            Wednesday, October 21 <span>·</span> {initialActions.length} overnight actions
          </p>
        </div>
        <span className="workspace-chip">
          <i className="dot auto" />
          All agents active
        </span>
      </div>
      <Tabs.Root
        value={tab}
        onValueChange={(v) => {
          setTab(v as typeof tab);
          setSelected([]);
        }}
      >
        <div className="queue-toolbar">
          <Tabs.List aria-label="Action tiers" className="tabs">
            {(
              [
                ['review', 'Needs review'],
                ['auto', 'Auto-run'],
                ['blocked', 'Blocked'],
                ['decided', 'Decided'],
              ] as const
            ).map(([value, label]) => (
              <Tabs.Trigger key={value} value={value}>
                {label}
                <span>{count(value)}</span>
              </Tabs.Trigger>
            ))}
          </Tabs.List>
          <div className="keyboard-hint">
            <kbd>J</kbd>
            <kbd>K</kbd> to navigate
          </div>
        </div>
        <div className="queue-workspace">
          <aside className="list-panel">
            <div className="list-filters">
              <div className="search-field">
                <Search size={15} />
                <input
                  placeholder="Search actions…"
                  aria-label="Search actions"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
              </div>
              <div className="filter-row">
                <select
                  aria-label="Filter by agent"
                  value={agent}
                  onChange={(e) => setAgent(e.target.value)}
                >
                  <option value="all">All agents</option>
                  {agents.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name}
                    </option>
                  ))}
                </select>
                <select
                  aria-label="Filter by tool"
                  value={tool}
                  onChange={(e) => setTool(e.target.value)}
                >
                  <option value="all">All tools</option>
                  {toolNames.map((t) => (
                    <option key={t} value={t}>
                      {t.replaceAll('_', ' ')}
                    </option>
                  ))}
                </select>
                <ArrowDownWideNarrow size={16} />
              </div>
            </div>
            {selected.length > 0 && (
              <div className="batch-bar">
                <span>{selected.length} selected</span>
                <Button
                  variant="primary"
                  onClick={() =>
                    decide({
                      type: 'batchApprove',
                      ids: selected.filter((id) => visible.some((i) => i.action.id === id)),
                    })
                  }
                >
                  <Check size={14} />
                  Approve selected
                </Button>
              </div>
            )}
            <ActionList
              items={visible}
              activeId={active?.action.id}
              onSelect={setActiveId}
              selected={selected}
              onCheck={(id, checked) =>
                setSelected((s) => (checked ? [...s, id] : s.filter((v) => v !== id)))
              }
            />
            <div className="list-footer">
              {visible.length} actions <span>Policy threshold: {state.policy.reviewThreshold}</span>
            </div>
          </aside>
          {active ? (
            <ActionDetail
              entry={active}
              onApprove={() => decide({ type: 'approve', id: active.action.id })}
              onEdit={openEdit}
              onReject={openReject}
            />
          ) : (
            <div className="detail-empty">
              <Check size={32} />
              <h2>You’re all caught up.</h2>
              <p>Choose another view to see what your agents are working on.</p>
            </div>
          )}
        </div>
      </Tabs.Root>
      <div className="audit-heading">
        {state.history.length > 0 && (
          <Button variant="ghost" onClick={() => dispatch({ type: 'undo' })}>
            <Undo2 size={14} />
            Undo last decision
          </Button>
        )}
      </div>
      <AuditTimeline events={state.audit} />
      <footer className="review-footer">
        <span>
          <i className="logo-mark" />
          Agent Action Review Queue
        </span>
        <span>Fictional workspace · actions are simulated</span>
      </footer>
      <PolicyDrawer
        open={policyOpen}
        onOpenChange={setPolicyOpen}
        policy={state.policy}
        onChange={(patch) => dispatch({ type: 'setPolicy', patch })}
      />
      <CommandMenu
        open={commandOpen}
        onOpenChange={setCommandOpen}
        onPolicy={() => setPolicyOpen(true)}
        onBlocked={() => setTab('blocked')}
        onBatch={() =>
          decide({
            type: 'batchApprove',
            ids: state.items
              .filter(
                (i) =>
                  i.action.agentId === 'triage' &&
                  i.result.tier === 'review' &&
                  i.result.score < 50,
              )
              .map((i) => i.action.id),
          })
        }
      />
      <Modal
        open={rejectOpen}
        onOpenChange={setRejectOpen}
        title="Reject this action"
        description="Tell your team why this action should not run. The reason is saved in the audit trail."
      >
        <label className="form-label" htmlFor="reject-reason">
          Reason
        </label>
        <textarea
          id="reject-reason"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="What should the agent do differently?"
          rows={4}
        />
        <div className="modal-actions">
          <Button onClick={() => setRejectOpen(false)}>Cancel</Button>
          <Button
            variant="danger"
            disabled={!reason.trim()}
            onClick={() => {
              if (active) decide({ type: 'reject', id: active.action.id, reason });
              setRejectOpen(false);
            }}
          >
            Reject action
          </Button>
        </div>
      </Modal>
      <Modal
        open={editOpen}
        onOpenChange={setEditOpen}
        title="Make it your own"
        description="Edits are validated against policy and saved alongside your approval."
      >
        <label htmlFor="edit-draft" className="form-label">
          {active?.action.tool === 'send_email' ? 'Email draft' : 'Action payload (JSON)'}
        </label>
        <textarea
          id="edit-draft"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          rows={12}
        />
        {editError && (
          <p role="alert" className="text-blocked">
            {editError}
          </p>
        )}
        <div className="modal-actions">
          <Button onClick={() => setEditOpen(false)}>Cancel</Button>
          <Button
            variant="primary"
            disabled={!draft.trim()}
            onClick={() => {
              if (!active) return;
              try {
                const editedPayload =
                  active.action.tool === 'send_email'
                    ? { ...active.action.payload, body: draft }
                    : JSON.parse(draft);
                const event: QueueAction = { type: 'approve', id: active.action.id, editedPayload };
                queueReducer(state, event);
                decide(event);
                setEditOpen(false);
              } catch (e) {
                setEditError(e instanceof Error ? e.message : 'Invalid payload');
              }
            }}
          >
            Save & approve
          </Button>
        </div>
      </Modal>
    </main>
  );
}
