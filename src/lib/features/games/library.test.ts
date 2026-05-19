import { beforeEach, describe, expect, it, vi } from 'vitest';

import { mockGames } from './mock-games';
import {
	launchHomeGame,
	loadHomeGames,
	mapLibraryGameToHomeGame,
	preloadHomeGames,
	resetHomeGamesPreloadForTest,
	type LibraryGameRecord,
	type LibraryScanProgressRecord
} from './library';

const libraryGame: LibraryGameRecord = {
	id: 'steam:1091500',
	title: 'Cyberpunk 2077',
	source: 'steam',
	installState: 'installed',
	artwork: {
		coverUrl: 'nexus-artwork://local/cover',
		heroUrl: 'nexus-artwork://local/hero'
	},
	executableConfidence: 'medium',
	launchable: true
};

describe('games library client', () => {
	beforeEach(() => {
		resetHomeGamesPreloadForTest();
	});

	it('maps a discovered library record into the home game shape with Steam cache artwork', () => {
		const mappedGame = mapLibraryGameToHomeGame(libraryGame);

		expect(mappedGame.id).toBe(libraryGame.id);
		expect(mappedGame.title).toBe(libraryGame.title);
		expect(mappedGame.launchable).toBe(true);
		expect(mappedGame.cover).toBe(libraryGame.artwork?.coverUrl);
		expect(mappedGame.hero).toBe(libraryGame.artwork?.heroUrl);
	});

	it('leaves artwork empty instead of falling back to mock assets when cache artwork is missing', () => {
		const mappedGame = mapLibraryGameToHomeGame({
			...libraryGame,
			artwork: undefined
		});

		expect(mappedGame.cover).toBeUndefined();
		expect(mappedGame.hero).toBeUndefined();
	});

	it('falls back to mock games when the preload api is unavailable', async () => {
		const originalApi = window.api;
		window.api = undefined;

		try {
			const games = await loadHomeGames();
			expect(games).toEqual(mockGames);
		} finally {
			window.api = originalApi;
		}
	});

	it('loads discovered games through the preload api when it is available', async () => {
		const originalApi = window.api;
		const launchGame = vi.fn();
		const onScanProgress = vi.fn();
		window.api = {
			library: {
				listGames: vi.fn().mockResolvedValue([libraryGame]),
				refreshGames: vi.fn(),
				getScanProgress: vi.fn().mockResolvedValue({
					phase: 'reading-manifests',
					message: 'Reading Steam manifests (1/2).',
					source: 'steam',
					current: 1,
					total: 2
				} satisfies LibraryScanProgressRecord),
				onScanProgress: vi.fn().mockImplementation((listener) => {
					listener({
						phase: 'reading-libraries',
						message: 'Found 2 Steam library locations.',
						source: 'steam',
						current: 2,
						total: 2
					});
					return vi.fn();
				}),
				launchGame
			}
		};

		try {
			const games = await loadHomeGames({ onScanProgress });
			expect(games).toHaveLength(1);
			expect(games[0]?.title).toBe(libraryGame.title);
			expect(onScanProgress).toHaveBeenCalledWith({
				phase: 'reading-libraries',
				message: 'Found 2 Steam library locations.',
				source: 'steam',
				current: 2,
				total: 2
			});
			expect(onScanProgress).toHaveBeenCalledTimes(1);
		} finally {
			window.api = originalApi;
		}
	});

	it('reuses a boot-time preload when the home route asks for games', async () => {
		const originalApi = window.api;
		const listGames = vi.fn().mockResolvedValue([libraryGame]);
		window.api = {
			library: {
				listGames,
				refreshGames: vi.fn(),
				getScanProgress: vi.fn(),
				onScanProgress: vi.fn(),
				launchGame: vi.fn()
			}
		};

		try {
			await preloadHomeGames();
			await expect(loadHomeGames()).resolves.toHaveLength(1);
			expect(listGames).toHaveBeenCalledTimes(1);
		} finally {
			window.api = originalApi;
		}
	});

	it('shares an in-flight boot-time preload with home route progress listeners', async () => {
		const originalApi = window.api;
		let resolveGames!: (games: LibraryGameRecord[]) => void;
		const listGames = vi.fn(
			() =>
				new Promise<LibraryGameRecord[]>((resolve) => {
					resolveGames = resolve;
				})
		);
		const onScanProgress = vi.fn();
		window.api = {
			library: {
				listGames,
				refreshGames: vi.fn(),
				getScanProgress: vi.fn(),
				onScanProgress: vi.fn().mockImplementation((listener) => {
					listener({
						phase: 'reading-manifests',
						message: 'Reading Steam manifests (1/2).',
						source: 'steam',
						current: 1,
						total: 2
					});
					return vi.fn();
				}),
				launchGame: vi.fn()
			}
		};

		try {
			const preload = preloadHomeGames();
			const loaded = loadHomeGames({ onScanProgress });
			await Promise.resolve();
			resolveGames([libraryGame]);

			await expect(preload).resolves.toHaveLength(1);
			await expect(loaded).resolves.toHaveLength(1);
			expect(listGames).toHaveBeenCalledTimes(1);
			expect(onScanProgress).toHaveBeenCalledWith({
				phase: 'reading-manifests',
				message: 'Reading Steam manifests (1/2).',
				source: 'steam',
				current: 1,
				total: 2
			});
		} finally {
			window.api = originalApi;
		}
	});

	it('returns a clear error when launch is requested outside the electron shell', async () => {
		const originalApi = window.api;
		window.api = undefined;

		try {
			await expect(launchHomeGame('steam:1091500')).resolves.toEqual({
				ok: false,
				error: 'Local game launching is only available inside the Electron shell.'
			});
		} finally {
			window.api = originalApi;
		}
	});

	it('passes launch requests through to the preload api when it is available', async () => {
		const originalApi = window.api;
		const launchGame = vi.fn().mockResolvedValue({
			ok: true,
			strategy: 'steam-applaunch'
		});
		window.api = {
			library: {
				listGames: vi.fn(),
				refreshGames: vi.fn(),
				launchGame
			}
		};

		try {
			await expect(launchHomeGame('steam:1091500')).resolves.toEqual({
				ok: true,
				strategy: 'steam-applaunch'
			});
			expect(launchGame).toHaveBeenCalledWith('steam:1091500');
		} finally {
			window.api = originalApi;
		}
	});
});
