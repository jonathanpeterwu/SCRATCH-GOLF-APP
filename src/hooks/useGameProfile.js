import { useMemo } from 'react';
import { useAppStore } from '../store/appStore';
import { buildGameProfile } from '../services/gameProfile';

/**
 * The golfer's game profile, rebuilt whenever the inputs change.
 *
 * Every screen derives it through this hook rather than holding its own copy, so
 * the course list, the training brief, and the profile editor never disagree
 * about what the golfer is working on.
 */
export function useGameProfile() {
  const ghinData = useAppStore((state) => state.ghinData);
  const profileSettings = useAppStore((state) => state.profileSettings);
  const playLog = useAppStore((state) => state.playLog);

  return useMemo(
    () => buildGameProfile(ghinData, profileSettings, playLog),
    [ghinData, profileSettings, playLog]
  );
}
