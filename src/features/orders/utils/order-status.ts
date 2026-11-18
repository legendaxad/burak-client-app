import type { IconName } from '@/components/common/icon';

import type { OrderStatus } from '../types';

export type StatusTone = 'accent' | 'info' | 'success' | 'danger';

export const ORDER_STATUS_META: Record<OrderStatus, { label: string; description: string; tone: StatusTone; icon: IconName }> = {
  PAUSE: {
    label: 'Awaiting confirmation',
    description: 'Confirm the order to send it to the kitchen, or cancel it.',
    tone: 'accent',
    icon: 'clock',
  },
  PROCESS: {
    label: 'In progress',
    description: 'The kitchen has your order. Mark it as received once it arrives.',
    tone: 'info',
    icon: 'dish',
  },
  FINISH: { label: 'Completed', description: 'This order was received.', tone: 'success', icon: 'checkCircle' },
  DELETED: { label: 'Cancelled', description: 'This order was cancelled.', tone: 'danger', icon: 'cancel' },
};

export type OrderActionId = 'confirm' | 'cancel' | 'received';

export interface OrderAction {
  id: OrderActionId;
  from: OrderStatus;
  to: OrderStatus;
  label: string;
  confirmTitle: string;
  confirmMessage: string;
  destructive: boolean;
}

/**
 * The customer workflow. The backend's /order/update accepts ANY status (it does not
 * validate transitions), so the app restricts itself to the original BURAK flow:
 *   PAUSE → PROCESS (confirm; the backend adds 1 point), PAUSE → DELETED (cancel),
 *   PROCESS → FINISH (received). FINISH and DELETED are final.
 * This is a client-side safeguard only; it cannot stop other clients.
 */
export const ORDER_ACTIONS: Record<OrderActionId, OrderAction> = {
  confirm: {
    id: 'confirm',
    from: 'PAUSE',
    to: 'PROCESS',
    label: 'Confirm order',
    confirmTitle: 'Send this order to the kitchen?',
    confirmMessage: 'You will earn 1 point when the order is confirmed.',
    destructive: false,
  },
  cancel: {
    id: 'cancel',
    from: 'PAUSE',
    to: 'DELETED',
    label: 'Cancel order',
    confirmTitle: 'Cancel this order?',
    confirmMessage: 'A cancelled order cannot be restored.',
    destructive: true,
  },
  received: {
    id: 'received',
    from: 'PROCESS',
    to: 'FINISH',
    label: 'Mark as received',
    confirmTitle: 'Did you receive this order?',
    confirmMessage: 'The order will be marked as completed.',
    destructive: false,
  },
};

export function availableActions(status: OrderStatus): OrderAction[] {
  return Object.values(ORDER_ACTIONS).filter((action) => action.from === status);
}

export function canPerform(status: OrderStatus, action: OrderAction): boolean {
  return action.from === status;
}

/** Short, readable reference derived from the Mongo id. */
export function formatOrderNumber(id: string): string {
  return `#${id.slice(-6).toUpperCase()}`;
}

export const ORDER_FILTERS: readonly { key: OrderStatus | 'ALL'; label: string }[] = [
  { key: 'ALL', label: 'All' },
  { key: 'PAUSE', label: 'To confirm' },
  { key: 'PROCESS', label: 'In progress' },
  { key: 'FINISH', label: 'Completed' },
  { key: 'DELETED', label: 'Cancelled' },
];
