type AdMobModule = any;
let AdMobRef: AdMobModule = null;
let BannerAdSizeRef: any = null;
let BannerAdPositionRef: any = null;
let BannerAdPluginEventsRef: any = null;
let InterstitialAdPluginEventsRef: any = null;
let RewardAdPluginEventsRef: any = null;

const isNativeApp = (): boolean => {
  return !!(window as any).Capacitor?.isNativePlatform?.();
};

const AD_UNIT_IDS = {
  banner: 'ca-app-pub-2693019276790458/4378029287',
  interstitial: 'ca-app-pub-2693019276790458/1752370525',
  rewardedInterstitial: 'ca-app-pub-2693019276790458/5866729569',
  rewarded: 'ca-app-pub-2693019276790458/8074090502',
};

let initialized = false;
let interstitialLoaded = false;
let rewardedLoaded = false;
let pageViewCount = 0;

async function loadAdMobModule(): Promise<boolean> {
  if (AdMobRef) return true;
  try {
    const mod = await import('@capacitor-community/admob');
    AdMobRef = mod.AdMob;
    BannerAdSizeRef = mod.BannerAdSize;
    BannerAdPositionRef = mod.BannerAdPosition;
    BannerAdPluginEventsRef = mod.BannerAdPluginEvents;
    InterstitialAdPluginEventsRef = mod.InterstitialAdPluginEvents;
    RewardAdPluginEventsRef = mod.RewardAdPluginEvents;
    return true;
  } catch {
    return false;
  }
}

export async function initializeAdMob(): Promise<void> {
  if (!isNativeApp() || initialized) return;

  const loaded = await loadAdMobModule();
  if (!loaded) return;

  try {
    await AdMobRef.initialize({
      initializeForTesting: false,
    });
    initialized = true;

    AdMobRef.addListener(BannerAdPluginEventsRef.SizeChanged, (info: any) => {
      const app = document.querySelector('#root');
      if (app) {
        (app as HTMLElement).style.marginBottom = `${info.height}px`;
      }
    });

    AdMobRef.addListener(InterstitialAdPluginEventsRef.Loaded, () => {
      interstitialLoaded = true;
    });

    AdMobRef.addListener(InterstitialAdPluginEventsRef.Dismissed, () => {
      interstitialLoaded = false;
      prepareInterstitial();
    });

    AdMobRef.addListener(InterstitialAdPluginEventsRef.FailedToLoad, () => {
      interstitialLoaded = false;
      setTimeout(() => prepareInterstitial(), 30000);
    });

    if (RewardAdPluginEventsRef) {
      AdMobRef.addListener(RewardAdPluginEventsRef.Loaded, () => {
        rewardedLoaded = true;
      });

      AdMobRef.addListener(RewardAdPluginEventsRef.Dismissed, () => {
        rewardedLoaded = false;
        prepareRewarded();
      });

      AdMobRef.addListener(RewardAdPluginEventsRef.FailedToLoad, () => {
        rewardedLoaded = false;
        setTimeout(() => prepareRewarded(), 30000);
      });
    }

    await prepareInterstitial();
    await prepareRewarded();
  } catch {
    // Not in native context
  }
}

export async function showBanner(): Promise<void> {
  if (!isNativeApp() || !initialized) return;

  try {
    await AdMobRef.showBanner({
      adId: AD_UNIT_IDS.banner,
      adSize: BannerAdSizeRef.ADAPTIVE_BANNER,
      position: BannerAdPositionRef.BOTTOM_CENTER,
      margin: 0,
      isTesting: false,
    });
  } catch {
    // Banner error
  }
}

export async function hideBanner(): Promise<void> {
  if (!isNativeApp() || !initialized) return;
  try {
    await AdMobRef.hideBanner();
  } catch {
    // Hide error
  }
}

export async function prepareInterstitial(): Promise<void> {
  if (!isNativeApp() || !initialized) return;

  try {
    await AdMobRef.prepareInterstitial({
      adId: AD_UNIT_IDS.interstitial,
      isTesting: false,
    });
  } catch {
    // Prep error
  }
}

export async function showInterstitial(): Promise<void> {
  if (!isNativeApp() || !initialized || !interstitialLoaded) return;

  try {
    await AdMobRef.showInterstitial();
  } catch {
    // Show error
  }
}

export async function showInterstitialAfterSpeedTest(): Promise<void> {
  if (!isNativeApp() || !initialized || !interstitialLoaded) return;

  try {
    await AdMobRef.showInterstitial();
  } catch {
    // Show error
  }
}

export async function showInterstitialOnPageChange(): Promise<void> {
  if (!isNativeApp() || !initialized) return;

  pageViewCount++;
  if (pageViewCount % 5 === 0 && interstitialLoaded) {
    try {
      await AdMobRef.showInterstitial();
    } catch {
      // Show error
    }
  }
}

export async function prepareRewarded(): Promise<void> {
  if (!isNativeApp() || !initialized) return;

  try {
    await AdMobRef.prepareRewardVideoAd({
      adId: AD_UNIT_IDS.rewarded,
      isTesting: false,
    });
  } catch {
    // Prep error
  }
}

export async function showRewarded(): Promise<boolean> {
  if (!isNativeApp() || !initialized || !rewardedLoaded) return false;

  try {
    const result = await AdMobRef.showRewardVideoAd();
    return !!result;
  } catch {
    return false;
  }
}

export function isRewardedReady(): boolean {
  return rewardedLoaded;
}

export { isNativeApp };
