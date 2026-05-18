import { fireEvent, render, screen, waitFor } from '@testing-library/svelte';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { mockGames } from '$lib/features/games/mock-games';
import type { LibraryGameRecord, LibraryLaunchResult } from '$lib/features/games/library';
import {
	INPUT_ACTIONS,
	INPUT_SOURCES,
	type InputEvent,
	type InputListener
} from '$lib/input/contracts';

let runtimeListener: InputListener | undefined;
const launchGame = vi.fn<() => Promise<LibraryLaunchResult>>();
const listGames = vi.fn<() => Promise<LibraryGameRecord[]>>();
const getScanProgress = vi.fn();
const onScanProgress = vi.fn();

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

function emitInput(action: InputEvent['action']) {
	runtimeListener?.({
		action,
		source: INPUT_SOURCES.keyboard,
		at: 100,
		repeat: false
	});
}

describe('home page', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		runtimeListener = undefined;
		window.history.replaceState({}, '', '/home');
		listGames.mockResolvedValue(libraryGames);
		getScanProgress.mockResolvedValue({
			phase: 'idle',
			message: 'Waiting to scan your local library.'
		});
		onScanProgress.mockReturnValue(() => {});
		launchGame.mockResolvedValue({ ok: true, strategy: 'steam-applaunch' });
		window.api = {
			library: {
				listGames,
				refreshGames: listGames,
				getScanProgress,
				onScanProgress,
				launchGame
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
});
