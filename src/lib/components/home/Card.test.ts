import { fireEvent, render, screen } from '@testing-library/svelte';
import { describe, expect, it, vi } from 'vitest';

import type { Game } from '$lib/features/games/types';

import Card from './Card.svelte';

const game: Game = {
	id: 'game-1',
	title: 'Persona 5 Royal',
	cover: '/persona5royalcover.png',
	hero: '/persona5royalhero.jpg'
};

describe('Card', () => {
	it('renders the supplied game and applies active and focused styling', () => {
		render(Card, {
			props: {
				index: 2,
				game,
				isActive: true,
				isFocused: true,
				align: 'start'
			}
		});

		const button = screen.getByRole('button', { name: game.title });
		const shell = button.closest('.game-card');

		expect(button).toHaveAttribute('tabindex', '-1');
		expect(screen.getByAltText(game.title)).toHaveAttribute('src', game.cover);
		expect(shell).toHaveClass('game-card', 'is-active', 'is-focused', 'align-start');
		expect(shell?.querySelector('.active-card-border')).not.toBeNull();
	});

	it('forwards pointer interactions with the card index', async () => {
		const onPress = vi.fn();
		render(Card, {
			props: {
				index: 3,
				game,
				onPress
			}
		});

		await fireEvent.pointerDown(screen.getByRole('button', { name: game.title }));

		expect(onPress).toHaveBeenCalledTimes(1);
		expect(onPress).toHaveBeenCalledWith(3);
	});

	it('renders a missing artwork state when no cover image is available', () => {
		render(Card, {
			props: {
				index: 0,
				game: {
					...game,
					cover: undefined
				}
			}
		});

		expect(screen.getByText('Artwork missing')).toBeInTheDocument();
		expect(screen.getByText(game.title)).toBeInTheDocument();
		expect(screen.queryByAltText(game.title)).not.toBeInTheDocument();
	});
});
