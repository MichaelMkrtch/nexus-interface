import { fireEvent, render, screen, waitFor } from '@testing-library/svelte';
import { readFileSync } from 'node:fs';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type {
	ListSquareGridOptionsResult,
	SetArtworkOverrideResult
} from '$lib/features/games/artwork';
import {
	resetHomeGamesPreloadForTest,
	type LibraryGameRecord,
	type LibraryLaunchResult
} from '$lib/features/games/library';
import { mockGames } from '$lib/features/games/mock-games';
import {
	INPUT_ACTIONS,
	INPUT_PHASES,
	INPUT_SOURCES,
	type InputEvent,
	type InputListener
} from '$lib/input/contracts';

let runtimeListener: InputListener | undefined;
let gamesUpdatedListener: ((games: LibraryGameRecord[]) => void) | undefined;
const launchGame = vi.fn<() => Promise<LibraryLaunchResult>>();
const listGames = vi.fn<() => Promise<LibraryGameRecord[]>>();
const getScanProgress = vi.fn();
const onScanProgress = vi.fn();
const onGamesUpdated = vi.fn();
const listSquareGridOptions = vi.fn<(gameId: string) => Promise<ListSquareGridOptionsResult>>();
const pickLocalImageOverride =
	vi.fn<(gameId: string, kind: 'cover' | 'background') => Promise<SetArtworkOverrideResult>>();
const setSteamGridDbImageOverride =
	vi.fn<
		(options: {
			gameId: string;
			kind: 'cover' | 'background';
			imageUrl: string;
			imageId?: number | string;
			originalFileName?: string;
		}) => Promise<SetArtworkOverrideResult>
	>();
const COVER_OPTIONS_BUTTON_NAME = 'Game cover options';
const UPDATE_COVER_MENU_ITEM_NAME = 'Update cover image';
const UPDATE_BACKGROUND_MENU_ITEM_NAME = 'Update background image';

const libraryGames: LibraryGameRecord[] = mockGames.map((game) => ({
	id: game.id,
	title: game.title,
	source: 'steam',
	installState: 'installed',
	artwork: {
		coverUrl: `nexus-artwork://local/${game.id}-cover`,
		heroUrl: `nexus-artwork://local/${game.id}-hero`
	},
	executableConfidence: 'high',
	launchable: true
}));

vi.mock('$lib/input/runtime', () => ({
	createInputRuntime: () => ({
		subscribe(listener: InputListener) {
			runtimeListener = listener;
			return () => {
				runtimeListener = undefined;
			};
		},
		stop: vi.fn()
	})
}));

vi.mock('$lib/input/adapters/keyboard', () => ({
	createKeyboardInputAdapter: () => ({
		id: 'keyboard',
		start: vi.fn()
	})
}));

vi.mock('$lib/input/adapters/web-gamepad', () => ({
	createWebGamepadInputAdapter: () => ({
		id: 'web-gamepad',
		start: vi.fn()
	})
}));

function emitInput(
	action: InputEvent['action'],
	overrides: Partial<Pick<InputEvent, 'at' | 'repeat' | 'phase'>> = {}
) {
	runtimeListener?.({
		action,
		source: INPUT_SOURCES.keyboard,
		at: 100,
		repeat: false,
		...overrides
	});
}

function emitRepeatedInput(action: InputEvent['action']) {
	runtimeListener?.({
		action,
		source: INPUT_SOURCES.keyboard,
		at: 140,
		repeat: true,
		phase: INPUT_PHASES.press
	});
}

describe('home page', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		resetHomeGamesPreloadForTest();
		runtimeListener = undefined;
		gamesUpdatedListener = undefined;
		window.history.replaceState({}, '', '/home');
		listGames.mockResolvedValue(libraryGames);
		getScanProgress.mockResolvedValue({
			phase: 'idle',
			message: 'Waiting to scan your local library.'
		});
		onScanProgress.mockReturnValue(() => {});
		onGamesUpdated.mockImplementation((listener) => {
			gamesUpdatedListener = listener;
			return () => {
				gamesUpdatedListener = undefined;
			};
		});
		launchGame.mockResolvedValue({ ok: true, strategy: 'steam-applaunch' });
		listSquareGridOptions.mockResolvedValue({
			ok: true,
			options: [
				{
					id: 1,
					url: 'https://images.example.test/cyberpunk-square.png',
					thumbnailUrl: 'https://images.example.test/cyberpunk-square-thumb.png',
					width: 1024,
					height: 1024,
					style: [],
					score: 0,
					nsfw: false,
					humor: false
				},
				{
					id: 2,
					url: 'https://images.example.test/cyberpunk-square-alt.png',
					thumbnailUrl: 'https://images.example.test/cyberpunk-square-alt-thumb.png',
					width: 1024,
					height: 1024,
					style: [],
					score: 0,
					nsfw: false,
					humor: false
				}
			]
		});
		pickLocalImageOverride.mockImplementation(async (gameId, kind) => ({
			ok: true,
			override: {
				gameId,
				kind,
				imageUrl: `nexus-artwork://local/custom-${kind}`,
				storagePath: `artwork/overrides/${gameId}/${kind}.png`,
				source: 'local-file',
				originalFileName: `${kind}.png`,
				contentHash: `${kind}-hash`,
				updatedAt: '2026-05-18T00:00:00.000Z'
			}
		}));
		setSteamGridDbImageOverride.mockImplementation(async (options) => ({
			ok: true,
			override: {
				gameId: options.gameId,
				kind: options.kind,
				imageUrl: `nexus-artwork://local/steamgriddb-${options.imageId}`,
				storagePath: `artwork/overrides/${options.gameId}/${options.kind}.png`,
				source: 'steamgriddb',
				sourceUrl: options.imageUrl,
				sourceId: String(options.imageId),
				originalFileName: options.originalFileName,
				contentHash: `${options.imageId}-hash`,
				updatedAt: '2026-05-18T00:00:00.000Z'
			}
		}));
		window.api = {
			library: {
				listGames,
				refreshGames: listGames,
				getScanProgress,
				onScanProgress,
				onGamesUpdated,
				launchGame
			},
			artwork: {
				listSquareGridOptions,
				pickLocalImageOverride,
				setSteamGridDbImageOverride
			}
		};
	});

	it('renders the initial focus state from app-owned navigation state', async () => {
		const { default: HomePage } = await import('./+page.svelte');
		render(HomePage);

		await waitFor(() => {
			expect(screen.getByRole('button', { name: 'Play Game' })).toBeInTheDocument();
		});

		const playButton = screen.getByRole('button', { name: 'Play Game' });
		const firstGame = screen.getByRole('button', { name: mockGames[0]?.title ?? '' });

		expect(playButton).not.toHaveAttribute('aria-current');
		expect(firstGame.closest('.game-card')).toHaveClass('is-active', 'is-focused');
	});

	it('updates focus through the injected input runtime and pointer interactions', async () => {
		const { default: HomePage } = await import('./+page.svelte');
		const { container } = render(HomePage);

		await waitFor(() => {
			expect(screen.getByRole('button', { name: 'Play Game' })).toBeInTheDocument();
		});

		const playButton = screen.getByRole('button', { name: 'Play Game' });
		emitInput(INPUT_ACTIONS.moveDown);

		await waitFor(() => {
			expect(playButton).toHaveAttribute('aria-current', 'true');
		});

		const header = container.querySelector('.home-overview-header');
		expect(header).toHaveClass('is-hidden-in-detail');

		emitInput(INPUT_ACTIONS.moveUp);
		emitInput(INPUT_ACTIONS.moveRight);

		await waitFor(() => {
			const secondGame = screen.getByRole('button', { name: mockGames[1]?.title ?? '' });
			expect(secondGame.closest('.game-card')).toHaveClass('is-active');
		});

		expect(header).not.toHaveClass('is-hidden-in-detail');

		// Pointer input should focus the selected action directly instead of
		// depending on browser focus events.
		await fireEvent.pointerDown(playButton);

		await waitFor(() => {
			expect(playButton).toHaveAttribute('aria-current', 'true');
		});
	});

	it('lets pointer selection move carousel focus directly to a chosen game', async () => {
		const { default: HomePage } = await import('./+page.svelte');
		render(HomePage);

		await waitFor(() => {
			expect(screen.getByRole('button', { name: mockGames[0]?.title ?? '' })).toBeInTheDocument();
		});

		const targetGame = screen.getByRole('button', { name: mockGames[2]?.title ?? '' });
		await fireEvent.pointerDown(targetGame);

		await waitFor(() => {
			expect(targetGame.closest('.game-card')).toHaveClass('is-active');
		});
	});

	it('renders an empty-state message when no local games are discovered', async () => {
		listGames.mockResolvedValueOnce([]);
		const { default: HomePage } = await import('./+page.svelte');
		render(HomePage);

		await waitFor(() => {
			expect(screen.getByText('No local games found')).toBeInTheDocument();
		});
	});

	it('shows live scan progress while the library is loading', async () => {
		let resolveGames!: (games: LibraryGameRecord[]) => void;
		const pendingGames = new Promise<LibraryGameRecord[]>((resolve) => {
			resolveGames = resolve;
		});
		listGames.mockReturnValueOnce(pendingGames);
		onScanProgress.mockImplementationOnce((listener) => {
			listener({
				phase: 'reading-manifests',
				message: 'Reading Steam manifests (5/12).',
				source: 'steam',
				current: 5,
				total: 12
			});
			return () => {};
		});

		const { default: HomePage } = await import('./+page.svelte');
		render(HomePage);

		expect(screen.getByText('Loading your local library')).toBeInTheDocument();
		expect(screen.getByText('Reading Steam manifests (5/12).')).toBeInTheDocument();
		expect(screen.getByText('5 of 12')).toBeInTheDocument();

		resolveGames(libraryGames);

		await waitFor(() => {
			expect(screen.getByRole('button', { name: 'Play Game' })).toBeInTheDocument();
		});
	});

	it('shows launch failures while the library is already loaded', async () => {
		launchGame.mockResolvedValueOnce({
			ok: false,
			error: 'Steam could not launch Cyberpunk 2077.'
		});
		const { default: HomePage } = await import('./+page.svelte');
		render(HomePage);

		await waitFor(() => {
			expect(screen.getByRole('button', { name: 'Play Game' })).toBeInTheDocument();
		});

		emitInput(INPUT_ACTIONS.moveDown);
		emitInput(INPUT_ACTIONS.confirm);

		await waitFor(() => {
			expect(screen.getByRole('alert')).toHaveTextContent('Steam could not launch Cyberpunk 2077.');
		});

		emitInput(INPUT_ACTIONS.moveUp);

		await waitFor(() => {
			expect(screen.queryByRole('alert')).not.toBeInTheDocument();
		});
	});

	it('does not try to launch titles that are not launchable', async () => {
		listGames.mockResolvedValueOnce([
			{
				...libraryGames[0],
				launchable: false
			},
			...libraryGames.slice(1)
		]);
		const { default: HomePage } = await import('./+page.svelte');
		render(HomePage);

		await waitFor(() => {
			expect(screen.getByRole('button', { name: 'Unavailable' })).toBeInTheDocument();
		});

		emitInput(INPUT_ACTIONS.moveDown);
		emitInput(INPUT_ACTIONS.confirm);

		expect(launchGame).not.toHaveBeenCalled();
		expect(screen.queryByRole('alert')).not.toBeInTheDocument();
	});

	it('shows install action copy for saved games that are no longer installed', async () => {
		listGames.mockResolvedValueOnce([
			{
				...libraryGames[0],
				installState: 'missing',
				launchable: false
			},
			...libraryGames.slice(1)
		]);
		const { default: HomePage } = await import('./+page.svelte');
		render(HomePage);

		await waitFor(() => {
			expect(screen.getByRole('button', { name: 'Install Game' })).toBeInTheDocument();
		});

		emitInput(INPUT_ACTIONS.moveDown);
		emitInput(INPUT_ACTIONS.confirm);

		expect(launchGame).not.toHaveBeenCalled();
	});

	it('updates the rendered library when a background refresh publishes game changes', async () => {
		const { default: HomePage } = await import('./+page.svelte');
		render(HomePage);

		await waitFor(() => {
			expect(
				screen.getByRole('button', { name: libraryGames[0]?.title ?? '' })
			).toBeInTheDocument();
		});

		gamesUpdatedListener?.([
			...libraryGames,
			{
				...libraryGames[0],
				id: 'steam:292030',
				title: 'The Witcher 3: Wild Hunt'
			}
		]);

		await waitFor(() => {
			expect(screen.getByRole('button', { name: 'The Witcher 3: Wild Hunt' })).toBeInTheDocument();
		});
	});

	it('opens SteamGridDB cover options and applies a selected cover locally', async () => {
		const { default: HomePage } = await import('./+page.svelte');
		const { container } = render(HomePage);

		await waitFor(() => {
			expect(screen.getByRole('button', { name: COVER_OPTIONS_BUTTON_NAME })).toBeInTheDocument();
		});

		const coverButton = screen.getByRole('button', { name: COVER_OPTIONS_BUTTON_NAME });
		await fireEvent.pointerDown(coverButton);
		await fireEvent.click(coverButton);

		await waitFor(() => {
			expect(screen.getByRole('menu', { name: 'Game cover options' })).toBeInTheDocument();
			expect(
				screen.getByRole('menuitem', { name: UPDATE_BACKGROUND_MENU_ITEM_NAME })
			).toBeInTheDocument();
		});

		await fireEvent.click(screen.getByRole('menuitem', { name: UPDATE_COVER_MENU_ITEM_NAME }));

		await waitFor(() => {
			expect(listSquareGridOptions).toHaveBeenCalledWith(mockGames[0]?.id);
			expect(screen.getByRole('dialog', { name: mockGames[0]?.title })).toBeInTheDocument();
		});

		await fireEvent.click(
			screen.getByRole('button', {
				name: `Use cover option 1 for ${mockGames[0]?.title}`
			})
		);

		await waitFor(() => {
			expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
		});

		const selectedCover = container.querySelector(
			'.home-rail-item.is-selected [data-game-cover] img'
		);
		expect(setSteamGridDbImageOverride).toHaveBeenCalledWith({
			gameId: mockGames[0]?.id,
			kind: 'cover',
			imageUrl: 'https://images.example.test/cyberpunk-square.png',
			imageId: 1,
			originalFileName: 'cyberpunk-square.png'
		});
		expect(selectedCover).toHaveAttribute('src', 'nexus-artwork://local/steamgriddb-1');
	});

	it('routes directional and confirm input to the open cover picker', async () => {
		const { default: HomePage } = await import('./+page.svelte');
		const { container } = render(HomePage);

		await waitFor(() => {
			expect(screen.getByRole('button', { name: COVER_OPTIONS_BUTTON_NAME })).toBeInTheDocument();
		});

		emitInput(INPUT_ACTIONS.moveDown);
		emitInput(INPUT_ACTIONS.moveRight);
		emitInput(INPUT_ACTIONS.confirm);

		await waitFor(() => {
			expect(screen.getByRole('menuitem', { name: UPDATE_COVER_MENU_ITEM_NAME })).toHaveAttribute(
				'aria-current',
				'true'
			);
			expect(
				screen.getByRole('menuitem', { name: UPDATE_BACKGROUND_MENU_ITEM_NAME })
			).not.toHaveAttribute('aria-current');
		});

		emitInput(INPUT_ACTIONS.confirm);

		await waitFor(() => {
			expect(screen.getByRole('dialog', { name: mockGames[0]?.title })).toBeInTheDocument();
		});

		emitInput(INPUT_ACTIONS.moveRight);
		emitRepeatedInput(INPUT_ACTIONS.moveRight);
		emitInput(INPUT_ACTIONS.confirm);

		await waitFor(() => {
			expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
		});

		emitInput(INPUT_ACTIONS.confirm, { phase: INPUT_PHASES.release });

		expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
		expect(screen.getByRole('button', { name: COVER_OPTIONS_BUTTON_NAME })).toHaveAttribute(
			'aria-current',
			'true'
		);
		expect(launchGame).not.toHaveBeenCalled();
		const selectedCover = container.querySelector(
			'.home-rail-item.is-selected [data-game-cover] img'
		);
		expect(setSteamGridDbImageOverride).toHaveBeenCalledWith({
			gameId: mockGames[0]?.id,
			kind: 'cover',
			imageUrl: 'https://images.example.test/cyberpunk-square.png',
			imageId: 1,
			originalFileName: 'cyberpunk-square.png'
		});
		expect(selectedCover).toHaveAttribute('src', 'nexus-artwork://local/steamgriddb-1');

		emitInput(INPUT_ACTIONS.cancel);

		await waitFor(() => {
			expect(screen.getByRole('button', { name: 'Play Game' })).not.toHaveAttribute('aria-current');
			expect(
				screen.getByRole('button', { name: mockGames[0]?.title ?? '' }).closest('.game-card')
			).toHaveClass('is-active', 'is-focused');
		});
	});

	it('supports uploading a local cover image from the cover picker', async () => {
		const { default: HomePage } = await import('./+page.svelte');
		const { container } = render(HomePage);

		await waitFor(() => {
			expect(screen.getByRole('button', { name: COVER_OPTIONS_BUTTON_NAME })).toBeInTheDocument();
		});

		emitInput(INPUT_ACTIONS.moveDown);
		emitInput(INPUT_ACTIONS.moveRight);
		emitInput(INPUT_ACTIONS.confirm);
		emitInput(INPUT_ACTIONS.confirm);

		await waitFor(() => {
			expect(screen.getByRole('dialog', { name: mockGames[0]?.title })).toBeInTheDocument();
		});

		emitInput(INPUT_ACTIONS.confirm);

		await waitFor(() => {
			expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
		});

		expect(pickLocalImageOverride).toHaveBeenCalledWith(mockGames[0]?.id, 'cover');
		const selectedCover = container.querySelector(
			'.home-rail-item.is-selected [data-game-cover] img'
		);
		expect(selectedCover).toHaveAttribute('src', 'nexus-artwork://local/custom-cover');
	});

	it('keeps local cover upload available when SteamGridDB lookup fails', async () => {
		listSquareGridOptions.mockResolvedValueOnce({
			ok: false,
			reason: 'missing-api-key',
			error: 'SteamGridDB API key is not configured.'
		});
		const { default: HomePage } = await import('./+page.svelte');
		const { container } = render(HomePage);

		await waitFor(() => {
			expect(screen.getByRole('button', { name: COVER_OPTIONS_BUTTON_NAME })).toBeInTheDocument();
		});

		emitInput(INPUT_ACTIONS.moveDown);
		emitInput(INPUT_ACTIONS.moveRight);
		emitInput(INPUT_ACTIONS.confirm);
		emitInput(INPUT_ACTIONS.confirm);

		await waitFor(() => {
			expect(screen.getByRole('alert')).toHaveTextContent('SteamGridDB API key is not configured.');
		});

		emitInput(INPUT_ACTIONS.confirm);

		await waitFor(() => {
			expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
		});

		expect(pickLocalImageOverride).toHaveBeenCalledWith(mockGames[0]?.id, 'cover');
		const selectedCover = container.querySelector(
			'.home-rail-item.is-selected [data-game-cover] img'
		);
		expect(selectedCover).toHaveAttribute('src', 'nexus-artwork://local/custom-cover');
	});

	it('closes the open cover picker on cancel input and returns control to home', async () => {
		const { default: HomePage } = await import('./+page.svelte');
		render(HomePage);

		await waitFor(() => {
			expect(screen.getByRole('button', { name: COVER_OPTIONS_BUTTON_NAME })).toBeInTheDocument();
		});

		emitInput(INPUT_ACTIONS.moveDown);
		emitInput(INPUT_ACTIONS.moveRight);
		emitInput(INPUT_ACTIONS.confirm);
		emitInput(INPUT_ACTIONS.confirm);

		await waitFor(() => {
			expect(screen.getByRole('dialog', { name: mockGames[0]?.title })).toBeInTheDocument();
		});

		emitInput(INPUT_ACTIONS.cancel);

		await waitFor(() => {
			expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
		});

		emitInput(INPUT_ACTIONS.cancel, { phase: INPUT_PHASES.release });

		await waitFor(() => {
			expect(screen.getByRole('button', { name: COVER_OPTIONS_BUTTON_NAME })).toHaveAttribute(
				'aria-current',
				'true'
			);
		});

		emitInput(INPUT_ACTIONS.moveLeft);

		await waitFor(() => {
			expect(screen.getByRole('button', { name: 'Play Game' })).toHaveAttribute(
				'aria-current',
				'true'
			);
		});
	});

	it('closes the cover action popup on cancel input and returns focus to the ellipsis button', async () => {
		const { default: HomePage } = await import('./+page.svelte');
		render(HomePage);

		await waitFor(() => {
			expect(screen.getByRole('button', { name: COVER_OPTIONS_BUTTON_NAME })).toBeInTheDocument();
		});

		emitInput(INPUT_ACTIONS.moveDown);
		emitInput(INPUT_ACTIONS.moveRight);
		emitInput(INPUT_ACTIONS.confirm);

		await waitFor(() => {
			expect(screen.getByRole('menu', { name: 'Game cover options' })).toBeInTheDocument();
		});

		emitInput(INPUT_ACTIONS.cancel);
		emitInput(INPUT_ACTIONS.cancel, { phase: INPUT_PHASES.release });

		await waitFor(() => {
			expect(screen.queryByRole('menu')).not.toBeInTheDocument();
			expect(screen.getByRole('button', { name: COVER_OPTIONS_BUTTON_NAME })).toHaveAttribute(
				'aria-current',
				'true'
			);
		});
	});

	it('moves focus between cover action popup options and uploads a background image', async () => {
		const { default: HomePage } = await import('./+page.svelte');
		const { container } = render(HomePage);

		await waitFor(() => {
			expect(screen.getByRole('button', { name: COVER_OPTIONS_BUTTON_NAME })).toBeInTheDocument();
		});

		emitInput(INPUT_ACTIONS.moveDown);
		emitInput(INPUT_ACTIONS.moveRight);
		emitInput(INPUT_ACTIONS.confirm);

		await waitFor(() => {
			expect(screen.getByRole('menuitem', { name: UPDATE_COVER_MENU_ITEM_NAME })).toHaveAttribute(
				'aria-current',
				'true'
			);
		});

		emitInput(INPUT_ACTIONS.moveDown);

		await waitFor(() => {
			expect(
				screen.getByRole('menuitem', { name: UPDATE_BACKGROUND_MENU_ITEM_NAME })
			).toHaveAttribute('aria-current', 'true');
		});

		emitInput(INPUT_ACTIONS.confirm);

		await waitFor(() => {
			expect(screen.queryByRole('menu')).not.toBeInTheDocument();
		});
		expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
		expect(pickLocalImageOverride).toHaveBeenCalledWith(mockGames[0]?.id, 'background');
		const heroImage = container.querySelector('.game-hero-image');
		expect(heroImage).toHaveAttribute('src', 'nexus-artwork://local/custom-background');
	});

	it('returns from the action buttons to the home rail on cancel input', async () => {
		const { default: HomePage } = await import('./+page.svelte');
		render(HomePage);

		await waitFor(() => {
			expect(screen.getByRole('button', { name: 'Play Game' })).toBeInTheDocument();
		});

		emitInput(INPUT_ACTIONS.moveDown);

		await waitFor(() => {
			expect(screen.getByRole('button', { name: 'Play Game' })).toHaveAttribute(
				'aria-current',
				'true'
			);
		});

		emitInput(INPUT_ACTIONS.cancel);

		await waitFor(() => {
			expect(screen.getByRole('button', { name: 'Play Game' })).not.toHaveAttribute('aria-current');
			expect(
				screen.getByRole('button', { name: mockGames[0]?.title ?? '' }).closest('.game-card')
			).toHaveClass('is-active', 'is-focused');
		});
	});

	it('does not define mouse-hover behavior for the cover picker', () => {
		const coverPickerSource = readFileSync(
			'C:/Users/Michael/Developer/Projects/nexus/interface/src/lib/components/home/CoverArtPicker.svelte',
			'utf8'
		);
		const coverActionMenuSource = readFileSync(
			'C:/Users/Michael/Developer/Projects/nexus/interface/src/lib/components/home/CoverActionMenu.svelte',
			'utf8'
		);

		expect(coverPickerSource).not.toContain(':hover');
		expect(coverPickerSource).not.toContain('onpointerenter');
		expect(coverPickerSource).toContain('artwork-card-frame');
		expect(coverPickerSource).toContain('artwork-card-surface');
		expect(coverPickerSource).toContain('--artwork-card-frame-padding: 5px');
		expect(coverPickerSource).toContain('--artwork-card-border-radius: 28px');
		expect(coverPickerSource).toContain('--artwork-card-cover-radius: 24px');
		expect(coverPickerSource).not.toContain('.cover-picker-option-frame.is-focused');
		expect(coverPickerSource).toContain('.cover-picker-option:focus-visible');
		expect(coverPickerSource).toContain('outline: none');
		expect(coverActionMenuSource).not.toContain(':hover');
		expect(coverActionMenuSource).not.toContain('onpointerenter');
	});
});
