/**
 * Modular Instagram Data Integration Adapter
 *
 * Implements privacy-compliant, officially-sanctioned data workflows.
 * Avoids any scraping, private API abuse, session hijacking, or password requests.
 */

export interface GuideStep {
  stepNumber: number;
  title: string;
  description: string;
  actionUrl?: string;
  actionLabel?: string;
  tip?: string;
}

export interface InstagramSourceAdapter {
  id: string;
  name: string;
  description: string;
  isAvailable(): boolean;
  requiresExternalAuth(): boolean;
  getGuideSteps(): GuideStep[];
  openDataDownloadPortal(): void;
  openInstagramProfile(username: string): void;
}

export class OfficialExportAdapter implements InstagramSourceAdapter {
  id = 'official_export';
  name = 'Official Instagram Data Download (ZIP / JSON)';
  description = 'Privacy-first, 100% compliant with Instagram Terms of Service. Uses official Meta Accounts Center exports.';

  isAvailable(): boolean {
    return true;
  }

  requiresExternalAuth(): boolean {
    return false;
  }

  /**
   * Direct URL to Instagram Meta Accounts Center - Download Your Information
   */
  readonly ACCOUNTS_CENTER_DYI_URL =
    'https://accountscenter.instagram.com/info_and_permissions/dyi/';

  readonly INSTAGRAM_BASE_URL = 'https://www.instagram.com/';

  getGuideSteps(): GuideStep[] {
    return [
      {
        stepNumber: 1,
        title: 'Open Meta Accounts Center',
        description:
          'Click the button below to navigate directly to the official "Download Your Information" portal on Instagram/Meta.',
        actionUrl: this.ACCOUNTS_CENTER_DYI_URL,
        actionLabel: 'Open Download Portal',
        tip: 'Make sure you are logged in to your Instagram account in your browser.',
      },
      {
        stepNumber: 2,
        title: 'Request a Download',
        description:
          'Select "Download or transfer information" and choose your Instagram account. Select "Some of your information".',
        tip: 'Choosing "Some of your information" takes only a few minutes instead of hours.',
      },
      {
        stepNumber: 3,
        title: 'Select "Followers and following"',
        description:
          'Scroll down to Connections and check ONLY "Followers and following". Click Next.',
      },
      {
        stepNumber: 4,
        title: 'Choose JSON Format & All Time',
        description:
          'On the final options screen: Set "Download to device", Format: JSON, Date range: "All time". Click "Create files".',
        tip: 'JSON is crucial! InstaTrack parses JSON files and ZIP archives directly in your browser.',
      },
      {
        stepNumber: 5,
        title: 'Import into InstaTrack',
        description:
          'Meta will prepare your file within 5-15 minutes and send you an email. Download the ZIP file, then drag and drop it right into InstaTrack!',
      },
    ];
  }

  openDataDownloadPortal(): void {
    if (typeof chrome !== 'undefined' && chrome.tabs?.create) {
      chrome.tabs.create({ url: this.ACCOUNTS_CENTER_DYI_URL });
    } else {
      window.open(this.ACCOUNTS_CENTER_DYI_URL, '_blank', 'noopener,noreferrer');
    }
  }

  openInstagramProfile(username: string): void {
    const cleanUser = username.replace(/^@/, '').trim();
    const url = `${this.INSTAGRAM_BASE_URL}${cleanUser}/`;
    if (typeof chrome !== 'undefined' && chrome.tabs?.create) {
      chrome.tabs.create({ url });
    } else {
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  }
}

/**
 * Pluggable adapter for future official Meta Graph API / Instagram Basic Display API
 */
export class MetaGraphApiAdapter implements InstagramSourceAdapter {
  id = 'meta_graph_api';
  name = 'Meta Graph API (Authorized Developer App)';
  description = 'Direct API sync using Meta Developer App OAuth credentials.';

  isAvailable(): boolean {
    // Currently disabled until official app client ID is configured
    return false;
  }

  requiresExternalAuth(): boolean {
    return true;
  }

  getGuideSteps(): GuideStep[] {
    return [
      {
        stepNumber: 1,
        title: 'Register Meta Developer App',
        description:
          'Create a Meta Developer app and request Instagram Graph API business permissions.',
      },
    ];
  }

  openDataDownloadPortal(): void {
    window.open('https://developers.facebook.com/docs/instagram-api/', '_blank');
  }

  openInstagramProfile(username: string): void {
    window.open(`https://www.instagram.com/${username}/`, '_blank');
  }
}

// Default export adapter instance
export const officialExportAdapter = new OfficialExportAdapter();
export const metaGraphApiAdapter = new MetaGraphApiAdapter();

export const registeredAdapters: InstagramSourceAdapter[] = [
  officialExportAdapter,
  metaGraphApiAdapter,
];

