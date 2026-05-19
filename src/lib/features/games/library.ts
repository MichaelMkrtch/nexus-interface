import { mockGames } from './mock-games';
import type { Game } from './types';

export type LibraryGameRecord = {
	id: string;
	title: string;
	source: 'steam';
	installState: 'installed' | 'missing';
	installDirectory?: string;
	artwork?: {
		coverUrl?: string;
		heroUrl?: string;
	};
	executablePath?: string;
	executableConfidence: 'high' | 'medium' | 'low' | 'unresolved';
	launchable: boolean;
	hidden?: boolean;
	lastPlayedAt?: string;
	lastSeenInstalledAt?: string;
	missingSince?: string;
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

let preloadedHomeGames: Game[] | undefined;
let preloadHomeGamesPromise: Promise<Game[]> | undefined;

export function resetHomeGamesPreloadForTest() {
	preloadedHomeGames = undefined;
	preloadHomeGamesPromise = undefined;
}

export function preloadHomeGames() {
	if (preloadedHomeGames) return Promise.resolve(preloadedHomeGames);

	preloadHomeGamesPromise ??= loadHomeGamesFromApi().then((games) => {
		preloadedHomeGames = games;
		return games;
	});
	return preloadHomeGamesPromise;
}

export async function loadHomeGames(options: LoadHomeGamesOptions = {}) {
	if (preloadedHomeGames) return preloadedHomeGames;

	if (preloadHomeGamesPromise) {
		const libraryApi = getLibraryApi();
		const unsubscribeFromProgress = options.onScanProgress
			? subscribeToLibraryProgress(libraryApi, options.onScanProgress)
			: undefined;

		try {
			const games = await preloadHomeGamesPromise;
			preloadedHomeGames = games;
			return games;
		} finally {
			unsubscribeFromProgress?.();
		}
	}

	const games = await loadHomeGamesFromApi(options);
	preloadedHomeGames = games;
	return games;
}

async function loadHomeGamesFromApi(options: LoadHomeGamesOptions = {}) {
	const libraryApi = getLibraryApi();
	if (!libraryApi) {
		return mockGames;
	}

	const progressState = {
		receivedLiveProgress: false
	};
	const unsubscribeFromProgress = subscribeToLibraryProgress(
		libraryApi,
		options.onScanProgress,
		progressState
	);

	try {
		const currentProgress = await libraryApi.getScanProgress?.();
		if (currentProgress && !progressState.receivedLiveProgress) {
			options.onScanProgress?.(currentProgress);
		}

		const libraryGames = await libraryApi.listGames();
		return libraryGames.map(mapLibraryGameToHomeGame);
	} finally {
		unsubscribeFromProgress?.();
	}
}

function subscribeToLibraryProgress(
	libraryApi: ReturnType<typeof getLibraryApi>,
	onScanProgress: ((progress: LibraryScanProgressRecord) => void) | undefined,
	progressState = { receivedLiveProgress: false }
) {
	if (!onScanProgress) return undefined;

	return libraryApi?.onScanProgress?.((progress) => {
		progressState.receivedLiveProgress = true;
		onScanProgress(progress);
	});
}

export function subscribeToHomeGamesUpdates(listener: (games: Game[]) => void) {
	const libraryApi = getLibraryApi();
	if (!libraryApi?.onGamesUpdated) return () => {};

	const unsubscribe = libraryApi.onGamesUpdated((libraryGames) => {
		const games = libraryGames.map(mapLibraryGameToHomeGame);
		preloadedHomeGames = games;
		listener(games);
	});
	return unsubscribe ?? (() => {});
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
		launchable: game.launchable,
		lastPlayed: game.lastPlayedAt,
		installState: game.installState
	};
}

function getLibraryApi() {
	if (typeof window === 'undefined') return undefined;

	return window.api?.library;
}
