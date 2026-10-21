'use client';
import * as Slider from '@radix-ui/react-slider';
import * as Switch from '@radix-ui/react-switch';
import { ShieldCheck } from 'lucide-react';
import { Modal, Button } from '@/components/ui/primitives';
import { RULES, DEFAULT_POLICY } from '@/lib/policy';
import type { Policy } from '@/lib/types';
export function PolicyDrawer({
  open,
  onOpenChange,
  policy,
  onChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  policy: Policy;
  onChange: (patch: Partial<Policy>) => void;
}) {
  return (
    <Modal
      drawer
      open={open}
      onOpenChange={onOpenChange}
      title="Your policy, in control."
      description="Changes apply instantly to pending actions. Past decisions keep their original risk assessment."
    >
      <div className="policy-section">
        <div className="slider-title">
          <label id="threshold-label">Review threshold</label>
          <strong>{policy.reviewThreshold}</strong>
        </div>
        <Slider.Root
          aria-labelledby="threshold-label"
          className="slider"
          value={[policy.reviewThreshold]}
          min={0}
          max={100}
          step={1}
          onValueChange={([reviewThreshold]) => onChange({ reviewThreshold })}
        >
          <Slider.Track className="slider-track">
            <Slider.Range className="slider-range" />
          </Slider.Track>
          <Slider.Thumb aria-label="Review threshold" className="slider-thumb" />
        </Slider.Root>
        <div className="range-labels">
          <span>More oversight</span>
          <span>More autonomy</span>
        </div>
        <p className="muted">
          Actions scoring {policy.reviewThreshold} or higher need review. Try 50 to graduate three
          actions.
        </p>
      </div>
      <div className="policy-fields">
        <label>
          Large-deal threshold ($)
          <input
            type="number"
            min={1}
            value={policy.largeDealAmount}
            onChange={(e) => {
              const n = Number(e.target.value);
              if (n > 0) onChange({ largeDealAmount: n });
            }}
          />
        </label>
        <label>
          Maximum discount (%)
          <input
            type="number"
            min={0}
            max={100}
            value={policy.maxDiscountPct}
            onChange={(e) => {
              const n = Number(e.target.value);
              if (n >= 0 && n <= 100) onChange({ maxDiscountPct: n });
            }}
          />
        </label>
      </div>
      <div className="section-caption">
        <ShieldCheck size={14} /> Risk signals & guardrails
      </div>
      <div className="rule-toggles">
        {RULES.map((rule) => (
          <div key={rule.id}>
            <label htmlFor={`rule-${rule.id}`}>
              {rule.label}
              {rule.hardBlock && <small>Hard block</small>}
            </label>
            <Switch.Root
              id={`rule-${rule.id}`}
              className="switch"
              checked={policy.rules[rule.id]}
              onCheckedChange={(value) =>
                onChange({ rules: { ...policy.rules, [rule.id]: value } })
              }
            >
              <Switch.Thumb className="switch-thumb" />
            </Switch.Root>
          </div>
        ))}
      </div>
      <Button className="full-width" onClick={() => onChange(DEFAULT_POLICY)}>
        Restore default policy
      </Button>
    </Modal>
  );
}
