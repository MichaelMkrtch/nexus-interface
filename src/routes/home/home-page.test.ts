import { fireEvent, render, screen, waitFor } from '@testing-library/svelte';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { mockGames } from '$lib/features/games/mock-games';
import {
	INPUT_ACTIONS,
	INPUT_SOURCES,
	type InputEvent,
	type InputListener
} from '$lib/input/contracts';

let runtimeListener: InputListener | undefined;

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
		runtimeListener = undefined;
		window.history.replaceState({}, '', '/home');
	});

	it('renders the initial focus state from app-owned navigation state', async () => {
		const { default: HomePage } = await import('./+page.svelte');
		render(HomePage);

		const playButton = screen.getByRole('button', { name: 'Play Game' });
		const firstGame = screen.getByRole('button', { name: mockGames[0]?.title ?? '' });
		const firstCard = firstGame.closest('.game-card');

		expect(playButton).not.toHaveAttribute('aria-current');
		expect(firstCard).toHaveClass('is-active', 'is-focused');
	});

	it('updates focus through the injected input runtime and pointer interactions', async () => {
		const { default: HomePage } = await import('./+page.svelte');
		const { container } = render(HomePage);

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

		const targetGame = screen.getByRole('button', { name: mockGames[2]?.title ?? '' });
		await fireEvent.pointerDown(targetGame);

		await waitFor(() => {
			expect(targetGame.closest('.game-card')).toHaveClass('is-active');
		});
	});
});
