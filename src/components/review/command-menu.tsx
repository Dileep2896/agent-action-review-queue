'use client';
import { Command } from 'cmdk';
import { Search, SlidersHorizontal, ShieldAlert, CheckCheck } from 'lucide-react';
import { Modal } from '@/components/ui/primitives';
export function CommandMenu({
  open,
  onOpenChange,
  onPolicy,
  onBlocked,
  onBatch,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onPolicy: () => void;
  onBlocked: () => void;
  onBatch: () => void;
}) {
  const run = (fn: () => void) => {
    onOpenChange(false);
    fn();
  };
  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title="Commands"
      description="A shortcut to your next decision."
    >
      <Command>
        <div className="command-search">
          <Search size={18} />
          <Command.Input placeholder="What would you like to do?" aria-label="Search commands" />
        </div>
        <Command.List>
          <Command.Empty>No commands found.</Command.Empty>
          <Command.Item onSelect={() => run(onBatch)}>
            <CheckCheck size={17} />
            Approve all low-risk from Inbound Triage
          </Command.Item>
          <Command.Item onSelect={() => run(onPolicy)}>
            <SlidersHorizontal size={17} />
            Open policy
          </Command.Item>
          <Command.Item onSelect={() => run(onBlocked)}>
            <ShieldAlert size={17} />
            Jump to blocked
          </Command.Item>
        </Command.List>
      </Command>
    </Modal>
  );
}
