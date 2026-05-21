import { describe, expect, it, vi } from 'vitest';

import { HOME_SECTIONS, createHomeNavigation } from './home-navigation.svelte';

describe('createHomeNavigation', () => {
	it('starts on the carousel with the first game and action selected', () => {
		const navigation = createHomeNavigation({ gameCount: 4, actionCount: 2, libraryItemCount: 10 });

		expect(navigation.activeSection).toBe(HOME_SECTIONS.carousel);
		expect(navigation.focusedGameIndex).toBe(0);
		expect(navigation.focusedActionIndex).toBe(0);
		expect(navigation.focusedLibraryIndex).toBe(0);
	});

	it('clamps focus when a game or action index is outside the available range', () => {
		const navigation = createHomeNavigation({ gameCount: 3, actionCount: 2, libraryItemCount: 7 });

		navigation.focusGame(99);
		expect(navigation.focusedGameIndex).toBe(2);

		navigation.focusGame(-10);
		expect(navigation.focusedGameIndex).toBe(0);

		navigation.focusAction(99);
		expect(navigation.activeSection).toBe(HOME_SECTIONS.actions);
		expect(navigation.focusedActionIndex).toBe(1);

		navigation.focusAction(-10);
		expect(navigation.focusedActionIndex).toBe(0);

		navigation.focusLibrary(99);
		expect(navigation.activeSection).toBe(HOME_SECTIONS.library);
		expect(navigation.focusedLibraryIndex).toBe(6);

		navigation.focusLibrary(-10);
		expect(navigation.focusedLibraryIndex).toBe(0);
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

	it('supports accelerated horizontal movement within the active section', () => {
		const navigation = createHomeNavigation({ gameCount: 10, actionCount: 2 });

		navigation.move('right', 4);
		expect(navigation.focusedGameIndex).toBe(4);

		navigation.move('right', 20);
		expect(navigation.focusedGameIndex).toBe(9);

		navigation.move('left', 3);
		expect(navigation.focusedGameIndex).toBe(6);
	});

	it('jumps to the first and last home rail items from the carousel', () => {
		const navigation = createHomeNavigation({ gameCount: 8, actionCount: 2 });

		navigation.jumpToLastRailItem();
		expect(navigation.activeSection).toBe(HOME_SECTIONS.carousel);
		expect(navigation.focusedGameIndex).toBe(7);

		navigation.jumpToFirstRailItem();
		expect(navigation.focusedGameIndex).toBe(0);
	});

	it('ignores home rail edge jumps when another section is active', () => {
		const navigation = createHomeNavigation({ gameCount: 8, actionCount: 2, libraryItemCount: 8 });

		navigation.focusGame(3);
		navigation.focusAction(1);
		navigation.jumpToLastRailItem();
		expect(navigation.activeSection).toBe(HOME_SECTIONS.actions);
		expect(navigation.focusedGameIndex).toBe(3);

		navigation.focusLibrary(4);
		navigation.jumpToFirstRailItem();
		expect(navigation.activeSection).toBe(HOME_SECTIONS.library);
		expect(navigation.focusedGameIndex).toBe(3);
	});

	it('moves vertically between carousel and actions with play selected on entry', () => {
		const navigation = createHomeNavigation({ gameCount: 5, actionCount: 3, libraryItemCount: 12 });

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

		navigation.move('down');
		expect(navigation.focusedActionIndex).toBe(0);
	});

	it('moves down from the library rail item into the library grid', () => {
		const navigation = createHomeNavigation({
			gameCount: 5,
			actionCount: 2,
			libraryItemCount: 12,
			libraryColumnCount: 5
		});

		navigation.focusGame(4);
		navigation.move('down');
		expect(navigation.activeSection).toBe(HOME_SECTIONS.library);
		expect(navigation.focusedLibraryIndex).toBe(0);

		navigation.move('right');
		expect(navigation.focusedLibraryIndex).toBe(1);

		navigation.move('down');
		expect(navigation.focusedLibraryIndex).toBe(6);

		navigation.move('up');
		expect(navigation.focusedLibraryIndex).toBe(1);
	});

	it('resets library focus to the first card when entering from the rail', () => {
		const navigation = createHomeNavigation({
			gameCount: 5,
			actionCount: 2,
			libraryItemCount: 12,
			libraryColumnCount: 5
		});

		navigation.focusLibrary(7);
		expect(navigation.focusedLibraryIndex).toBe(7);

		navigation.focusGame(4);
		navigation.move('down');
		expect(navigation.activeSection).toBe(HOME_SECTIONS.library);
		expect(navigation.focusedLibraryIndex).toBe(0);

		navigation.focusLibrary(8);
		navigation.focusGame(4);
		navigation.confirm();
		expect(navigation.activeSection).toBe(HOME_SECTIONS.library);
		expect(navigation.focusedLibraryIndex).toBe(0);
	});

	it('moves up from the library grid first row back to the library rail item', () => {
		const navigation = createHomeNavigation({
			gameCount: 5,
			actionCount: 2,
			libraryItemCount: 12,
			libraryColumnCount: 5
		});

		navigation.focusGame(4);
		navigation.move('down');
		expect(navigation.activeSection).toBe(HOME_SECTIONS.library);

		navigation.move('up');

		expect(navigation.activeSection).toBe(HOME_SECTIONS.carousel);
		expect(navigation.focusedGameIndex).toBe(4);
		expect(navigation.focusedLibraryIndex).toBe(0);
	});

	it('confirms from the library rail item into the library grid', () => {
		const navigation = createHomeNavigation({
			gameCount: 5,
			actionCount: 2,
			libraryItemCount: 12,
			libraryColumnCount: 5
		});

		navigation.focusGame(4);
		navigation.confirm();

		expect(navigation.activeSection).toBe(HOME_SECTIONS.library);
		expect(navigation.focusedLibraryIndex).toBe(0);
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
