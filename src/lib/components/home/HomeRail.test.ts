import { fireEvent, render, screen } from '@testing-library/svelte';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { mockGames } from '$lib/features/games/mock-games';
import { HOME_SECTIONS } from '$lib/features/home/home-navigation.svelte';

import HomeRail from './HomeRail.svelte';

describe('HomeRail', () => {
	afterEach(() => {
		vi.useRealTimers();
	});

	it('anchors the selected card to one fixed landing position', () => {
		const { container } = render(HomeRail, {
			props: {
				games: mockGames,
				focusedIndex: 2,
				activeSection: HOME_SECTIONS.carousel
			}
		});

		const selectedItem = container.querySelector('.home-rail-item.is-selected');
		const previousItem = screen
			.getByRole('button', { name: mockGames[1]?.title ?? '' })
			.closest('.home-rail-item') as HTMLElement | null;

		expect(selectedItem).toHaveStyle('--home-rail-x: 0rem');
		expect(previousItem?.style.getPropertyValue('--home-rail-x')).not.toBe('0rem');
		expect(screen.getByText(mockGames[2]?.title ?? '')).toBeInTheDocument();
	});

	it('renders the active title in an anchored title shell on first paint', () => {
		const { container } = render(HomeRail, {
			props: {
				games: mockGames,
				focusedIndex: 0,
				activeSection: HOME_SECTIONS.carousel
			}
		});

		const titleShell = container.querySelector('.home-rail-title-shell');
		const title = container.querySelector('.home-rail-title h2');

		expect(window.getComputedStyle(titleShell as Element).left).toBe('0px');
		expect(window.getComputedStyle(titleShell as Element).top).toBe('0px');
		expect(title).toHaveTextContent(mockGames[0]?.title ?? '');
	});

	it('returns the selected card to standard size while hiding the rest in the actions section', () => {
		render(HomeRail, {
			props: {
				games: mockGames,
				focusedIndex: 1,
				activeSection: HOME_SECTIONS.actions
			}
		});

		const selectedCard = screen
			.getByRole('button', { name: mockGames[1]?.title ?? '' })
			.closest('.game-card');
		const hiddenCards = document.querySelectorAll('.home-rail-item.is-hidden-in-detail');
		const previousCardItem = screen
			.getByRole('button', { name: mockGames[0]?.title ?? '' })
			.closest('.home-rail-item') as HTMLElement | null;

		expect(selectedCard).not.toHaveClass('is-active');
		expect(selectedCard).not.toHaveClass('is-focused');
		expect(hiddenCards).toHaveLength(mockGames.length - 1);
		expect(
			Number.parseFloat(previousCardItem?.style.getPropertyValue('--home-rail-x') ?? '0')
		).toBeCloseTo(-3.45, 2);
		expect(previousCardItem?.style.getPropertyValue('--home-rail-y')).toBe('-15rem');
	});

	it('uses centered card alignment in carousel mode and start alignment in actions mode', async () => {
		const { container, rerender } = render(HomeRail, {
			props: {
				games: mockGames,
				focusedIndex: 1,
				activeSection: HOME_SECTIONS.carousel
			}
		});

		const carouselCard = screen
			.getByRole('button', { name: mockGames[1]?.title ?? '' })
			.closest('.game-card');
		const carouselTitleShell = container.querySelector(
			'.home-rail-title-shell'
		) as HTMLElement | null;
		expect(carouselCard).not.toHaveClass('align-start');
		expect(carouselTitleShell?.style.transform).toContain('translate3d(23rem');

		await rerender({
			games: mockGames,
			focusedIndex: 1,
			activeSection: HOME_SECTIONS.actions
		});

		const actionCard = screen
			.getByRole('button', { name: mockGames[1]?.title ?? '' })
			.closest('.game-card');
		const actionTitleShell = container.querySelector(
			'.home-rail-title-shell'
		) as HTMLElement | null;
		expect(actionCard).toHaveClass('align-start');
		expect(actionTitleShell?.style.transform).toContain('translate3d(12.875rem');
	});

	it('lets the card scale first, then fades the new title and focus chrome in together', async () => {
		vi.useFakeTimers();
		const { container, rerender } = render(HomeRail, {
			props: {
				games: mockGames,
				focusedIndex: 0,
				activeSection: HOME_SECTIONS.carousel
			}
		});

		await rerender({
			games: mockGames,
			focusedIndex: 3,
			activeSection: HOME_SECTIONS.carousel
		});

		const previousCard = screen
			.getByRole('button', { name: mockGames[0]?.title ?? '' })
			.closest('.game-card');
		expect(previousCard).not.toHaveClass('is-focused');

		const selectedCard = screen
			.getByRole('button', { name: mockGames[3]?.title ?? '' })
			.closest('.game-card');
		expect(selectedCard).toHaveClass('is-active');
		expect(selectedCard).not.toHaveClass('is-focused');
		expect(screen.queryByText(mockGames[3]?.title ?? '')).toBeNull();

		// The scale-up gets a short head start before the focus border and title
		// fade in so the motion reads as one intentional sequence.
		await vi.advanceTimersByTimeAsync(100);

		const title = screen.getByText(mockGames[3]?.title ?? '');
		expect(title).toBeInTheDocument();
		expect(title.closest('.home-rail-title')).not.toBeNull();
		expect(container.querySelector('.home-rail-item.is-selected .game-card')).toHaveClass(
			'is-focused'
		);
	});

	it('forwards card pointer interactions with the selected index', async () => {
		const onCardPress = vi.fn();
		render(HomeRail, {
			props: {
				games: mockGames,
				focusedIndex: 0,
				activeSection: HOME_SECTIONS.carousel,
				onCardPress
			}
		});

		await fireEvent.pointerDown(screen.getByRole('button', { name: mockGames[2]?.title ?? '' }));

		expect(onCardPress).toHaveBeenCalledTimes(1);
		expect(onCardPress).toHaveBeenCalledWith(2);
	});
});
