class AutoSkip {
  constructor() {
    this.isEnabled = true;
    this.checkInterval = null;
    this.originalSpeed = 1;
    this.isAdPlaying = false;
    this.init();
  }

  init() {
    this.loadPreferences();
    this.startWatching();
    this.watchForPageChanges();
  }

  loadPreferences() {
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.sync) {
      chrome.storage.sync.get(['autoSkipEnabled'], (result) => {
        this.isEnabled = result.autoSkipEnabled !== false;
      });
    } else {
      this.isEnabled = true;
    }
  }

  startWatching() {
    this.checkInterval = setInterval(() => {
      if (this.isEnabled) {
        this.handleAds();
      }
    }, 500);
  }

  handleAds() {
    const video = document.querySelector('video.html5-main-video');
    if (!video) return;

    const adContainer = document.querySelector('.video-ads.ytp-ad-module');
    const skipButton = document.querySelector('.ytp-skip-ad-button');
    const adOverlay = document.querySelector('.ytp-ad-player-overlay');
    const adText = document.querySelector('.ytp-ad-text');
    const adPreview = document.querySelector('.ytp-ad-preview-slot');
    const adPlayer = document.querySelector('.ytp-ad-player-overlay-skip-or-preview');
    
    const isShortVideo = video.duration && video.duration < 60;
    const hasAdElements = adContainer || skipButton || adOverlay || adText || adPreview || adPlayer;
    
    const isCurrentlyInAd = hasAdElements || (isShortVideo && hasAdElements);

    if (isCurrentlyInAd && !this.isAdPlaying) {
      this.startAdHandling(video);
    } else if (!isCurrentlyInAd && this.isAdPlaying) {
      this.endAdHandling(video);
    }

    if (isCurrentlyInAd && this.isAdPlaying) {
      this.optimizeAdSpeed();
    }
  }

  startAdHandling(video) {
    this.isAdPlaying = true;
    this.originalSpeed = video.playbackRate;
    video.playbackRate = 100;
    video.muted = true;
  }

  endAdHandling(video) {
    if (this.isAdPlaying) {
      video.playbackRate = this.originalSpeed;
      video.muted = false;
      this.isAdPlaying = false;
    }
  }

  optimizeAdSpeed() {
    const video = document.querySelector('video.html5-main-video');
    if (!video || !this.isAdPlaying) return;
    
    if (video.playbackRate < 100) {
      video.playbackRate = 100;
      video.muted = true;
    }
    
    if (video.duration && video.duration < 30) { 
      try {
        if (video.currentTime < video.duration - 0.1) {
          video.currentTime = video.duration - 0.05; 
        }
      } catch (e) {
      }
    }
  }

  watchForPageChanges() {
    let currentUrl = location.href;
    
    const observer = new MutationObserver(() => {
      if (location.href !== currentUrl) {
        currentUrl = location.href;
        this.isAdPlaying = false;
        setTimeout(() => {
          this.handleAds();
        }, 1000);
      }
    });
    
    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }

  enable() {
    this.isEnabled = true;
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.sync) {
      chrome.storage.sync.set({ autoSkipEnabled: true });
    }
  }

  disable() {
    this.isEnabled = false;
    
    const video = document.querySelector('video.html5-main-video');
    if (video && this.isAdPlaying) {
      video.playbackRate = this.originalSpeed;
      video.muted = false;
      this.isAdPlaying = false;
    }
    
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.sync) {
      chrome.storage.sync.set({ autoSkipEnabled: false });
    }
  }

  toggle() {
    if (this.isEnabled) {
      this.disable();
    } else {
      this.enable();
    }
  }

  destroy() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
    }
    
    const video = document.querySelector('video.html5-main-video');
    if (video && this.isAdPlaying) {
      video.playbackRate = this.originalSpeed;
      video.muted = false;
    }
  }
}

const autoSkip = new AutoSkip();
window.autoSkipExtension = autoSkip;

if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.onMessage) {
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'toggle') {
      autoSkip.toggle();
      sendResponse({ enabled: autoSkip.isEnabled });
    } else if (request.action === 'getStatus') {
      sendResponse({ enabled: autoSkip.isEnabled });
    }
    return true;
  });
}

window.addEventListener('beforeunload', () => {
  autoSkip.destroy();
});