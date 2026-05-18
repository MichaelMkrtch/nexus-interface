import type {
	LibraryGameRecord,
	LibraryLaunchResult,
	LibraryScanProgressRecord
} from '$lib/features/games/library';

// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
declare global {
	interface Window {
		api?: {
			library?: {
				listGames: () => Promise<LibraryGameRecord[]>;
				refreshGames: () => Promise<LibraryGameRecord[]>;
				getScanProgress?: () => Promise<LibraryScanProgressRecord>;
				onScanProgress?: (
					listener: (progress: LibraryScanProgressRecord) => void
				) => (() => void) | void;
				launchGame: (gameId: string) => Promise<LibraryLaunchResult>;
			};
		};
	}

	namespace App {
		// interface Error {}
		// interface Locals {}
		// interface PageData {}
		// interface PageState {}
		// interface Platform {}
	}
}

export {};
