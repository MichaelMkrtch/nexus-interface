import { describe, expect, it, vi } from 'vitest';

import { INPUT_ACTIONS, INPUT_SOURCES, type InputEvent } from '$lib/input/contracts';

import type { HomeNav } from './home-navigation.svelte';

import { createHomeInputHandler } from './home-input';

function createInputEvent(action: InputEvent['action']): InputEvent {
	return {
		action,
		source: INPUT_SOURCES.keyboard,
		at: 100,
		repeat: false
	};
}

function createNavigationMock(): HomeNav {
	return {
		activeSection: 'carousel',
		focusedGameIndex: 0,
		focusedActionIndex: 0,
		focusGame: vi.fn(),
		focusAction: vi.fn(),
		move: vi.fn(),
		confirm: vi.fn()
	};
}

describe('createHomeInputHandler', () => {
	it('maps directional actions to navigation movement', () => {
		const navigation = createNavigationMock();
		const handleInput = createHomeInputHandler({ navigation });

		handleInput(createInputEvent(INPUT_ACTIONS.moveLeft));
		handleInput(createInputEvent(INPUT_ACTIONS.moveRight));
		handleInput(createInputEvent(INPUT_ACTIONS.moveUp));
		handleInput(createInputEvent(INPUT_ACTIONS.moveDown));

		expect(navigation.move).toHaveBeenCalledTimes(4);
		expect(navigation.move).toHaveBeenNthCalledWith(1, 'left');
		expect(navigation.move).toHaveBeenNthCalledWith(2, 'right');
		expect(navigation.move).toHaveBeenNthCalledWith(3, 'up');
		expect(navigation.move).toHaveBeenNthCalledWith(4, 'down');
	});

	it('routes confirm actions and ignores unrelated input actions', () => {
		const navigation = createNavigationMock();
		const handleInput = createHomeInputHandler({ navigation });

		handleInput(createInputEvent(INPUT_ACTIONS.confirm));
		handleInput(createInputEvent(INPUT_ACTIONS.cancel));
		handleInput(createInputEvent(INPUT_ACTIONS.options));

		expect(navigation.confirm).toHaveBeenCalledTimes(1);
		expect(navigation.move).not.toHaveBeenCalled();
	});
});
