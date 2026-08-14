export type AdPlacement = 'banner' | 'interstitial' | 'rewarded';

export type AdServiceConfig = {
  enabled: boolean;
  provider: 'none' | 'approved-network';
};

/**
 * Replace these no-op methods with an approved ad SDK when monetization is configured.
 * Gameplay never depends on an ad response, and the default is intentionally disabled.
 */
export const adService: AdServiceConfig & {
  showBanner: (placement: AdPlacement) => boolean;
  showInterstitial: (placement: AdPlacement) => Promise<boolean>;
  requestRewardedHint: () => Promise<boolean>;
} = {
  enabled: false,
  provider: 'none',
  showBanner: () => false,
  showInterstitial: async () => false,
  requestRewardedHint: async () => false,
};