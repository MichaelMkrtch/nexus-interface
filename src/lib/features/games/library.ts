import { mockGames } from './mock-games';
import type { Game } from './types';

export type LibraryGameRecord = {
	id: string;
	title: string;
	source: 'steam';
	installState: 'installed';
	artwork?: {
		coverUrl?: string;
		heroUrl?: string;
	};
	executablePath?: string;
	executableConfidence: 'high' | 'medium' | 'low' | 'unresolved';
	launchable: boolean;
};

export type LibraryLaunchResult =
	| { ok: true; strategy: 'steam-applaunch' | 'direct' }
	| { ok: false; error: string };

export type LibraryScanProgressRecord = {
	phase:
		| 'idle'
		| 'discovering-sources'
		| 'discovering-launchers'
		| 'reading-libraries'
		| 'reading-manifests'
		| 'resolving-executables'
		| 'finalizing'
		| 'complete';
	message: string;
	source?: 'steam';
	current?: number;
	total?: number;
};

type LoadHomeGamesOptions = {
	onScanProgress?: (progress: LibraryScanProgressRecord) => void;
};

export async function loadHomeGames(options: LoadHomeGamesOptions = {}) {
	const libraryApi = getLibraryApi();
	if (!libraryApi) {
		return mockGames;
	}

	let receivedLiveProgress = false;
	const unsubscribeFromProgress = libraryApi.onScanProgress?.((progress) => {
		receivedLiveProgress = true;
		options.onScanProgress?.(progress);
	});

	try {
		const currentProgress = await libraryApi.getScanProgress?.();
		if (currentProgress && !receivedLiveProgress) {
			options.onScanProgress?.(currentProgress);
		}

		const libraryGames = await libraryApi.listGames();
		return libraryGames.map(mapLibraryGameToHomeGame);
	} finally {
		unsubscribeFromProgress?.();
	}
}

export async function launchHomeGame(gameId: string) {
	const libraryApi = getLibraryApi();
	if (!libraryApi) {
		return {
			ok: false,
			error: 'Local game launching is only available inside the Electron shell.'
		} satisfies LibraryLaunchResult;
	}

	return libraryApi.launchGame(gameId);
}

export function mapLibraryGameToHomeGame(game: LibraryGameRecord): Game {
	return {
		id: game.id,
		title: game.title,
		cover: game.artwork?.coverUrl,
		hero: game.artwork?.heroUrl,
		launchable: game.launchable
	};
}

function getLibraryApi() {
	if (typeof window === 'undefined') return undefined;

	return window.api?.library;
}
