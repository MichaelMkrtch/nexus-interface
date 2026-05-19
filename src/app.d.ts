import type {
	ArtworkOverrideKind,
	ListSquareGridOptionsResult,
	SetArtworkOverrideResult
} from '$lib/features/games/artwork';
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
				onGamesUpdated?: (listener: (games: LibraryGameRecord[]) => void) => (() => void) | void;
				launchGame: (gameId: string) => Promise<LibraryLaunchResult>;
			};
			artwork?: {
				listSquareGridOptions: (gameId: string) => Promise<ListSquareGridOptionsResult>;
				pickLocalImageOverride?: (
					gameId: string,
					kind: ArtworkOverrideKind
				) => Promise<SetArtworkOverrideResult>;
				setSteamGridDbImageOverride?: (options: {
					gameId: string;
					kind: ArtworkOverrideKind;
					imageUrl: string;
					imageId?: number | string;
					originalFileName?: string;
				}) => Promise<SetArtworkOverrideResult>;
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
