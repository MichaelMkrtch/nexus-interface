import { describe, expect, it, vi } from 'vitest';

import { HOME_SECTIONS, createHomeNavigation } from './home-navigation.svelte';

describe('createHomeNavigation', () => {
	it('starts on the carousel with the first game and action selected', () => {
		const navigation = createHomeNavigation({ gameCount: 4, actionCount: 2 });

		expect(navigation.activeSection).toBe(HOME_SECTIONS.carousel);
		expect(navigation.focusedGameIndex).toBe(0);
		expect(navigation.focusedActionIndex).toBe(0);
	});

	it('clamps focus when a game or action index is outside the available range', () => {
		const navigation = createHomeNavigation({ gameCount: 3, actionCount: 2 });

		navigation.focusGame(99);
		expect(navigation.focusedGameIndex).toBe(2);

		navigation.focusGame(-10);
		expect(navigation.focusedGameIndex).toBe(0);

		navigation.focusAction(99);
		expect(navigation.activeSection).toBe(HOME_SECTIONS.actions);
		expect(navigation.focusedActionIndex).toBe(1);

		navigation.focusAction(-10);
		expect(navigation.focusedActionIndex).toBe(0);
	});

	it('moves horizontally within the active section and preserves boundaries', () => {
		const navigation = createHomeNavigation({ gameCount: 3, actionCount: 2 });

		navigation.move('left');
		expect(navigation.focusedGameIndex).toBe(0);

		navigation.move('right');
		navigation.move('right');
		navigation.move('right');
		expect(navigation.focusedGameIndex).toBe(2);

		navigation.focusAction(0);
		navigation.move('left');
		expect(navigation.focusedActionIndex).toBe(0);

		navigation.move('right');
		navigation.move('right');
		expect(navigation.focusedActionIndex).toBe(1);
	});

	it('moves vertically between sections without losing each section index', () => {
		const navigation = createHomeNavigation({ gameCount: 5, actionCount: 3 });

		navigation.focusGame(3);
		navigation.move('down');
		expect(navigation.activeSection).toBe(HOME_SECTIONS.actions);
		expect(navigation.focusedActionIndex).toBe(0);

		navigation.move('right');
		navigation.move('right');
		expect(navigation.focusedActionIndex).toBe(2);

		navigation.move('up');
		expect(navigation.activeSection).toBe(HOME_SECTIONS.carousel);
		expect(navigation.focusedGameIndex).toBe(3);

		// Returning to the actions section should restore the last action index
		// instead of resetting the user's place in the row.
		navigation.move('down');
		expect(navigation.focusedActionIndex).toBe(2);
	});

	it('confirms only when an action is focused', () => {
		const onConfirmAction = vi.fn();
		const navigation = createHomeNavigation({
			gameCount: 4,
			actionCount: 2,
			onConfirmAction
		});

		navigation.confirm();
		expect(onConfirmAction).not.toHaveBeenCalled();

		navigation.focusAction(1);
		navigation.confirm();
		expect(onConfirmAction).toHaveBeenCalledTimes(1);
		expect(onConfirmAction).toHaveBeenCalledWith(1);
	});
});
