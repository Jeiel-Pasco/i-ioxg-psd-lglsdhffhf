import { HUB } from '../config/hub';

export function isMarsUnlocked(archived: ReadonlySet<string>): boolean {
  return HUB.marsUnlockIds.every((id) => archived.has(id));
}
