import { describe, expect, it, vi } from 'vitest';

import { INPUT_ACTIONS, INPUT_SOURCES, type InputEvent } from '$lib/input/contracts';

import type { HomeNav } from './home-navigation.svelte';

import { HOME_MOVE_DIRECTIONS } from './home-navigation.svelte';
import { createHomeInputHandler } from './home-input';

const FIRST_CALL = 1;
const SECOND_CALL = 2;
const THIRD_CALL = 3;
const FOURTH_CALL = 4;
const ONCE = 1;

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
		expect(navigation.move).toHaveBeenNthCalledWith(FIRST_CALL, HOME_MOVE_DIRECTIONS.left);
		expect(navigation.move).toHaveBeenNthCalledWith(SECOND_CALL, HOME_MOVE_DIRECTIONS.right);
		expect(navigation.move).toHaveBeenNthCalledWith(THIRD_CALL, HOME_MOVE_DIRECTIONS.up);
		expect(navigation.move).toHaveBeenNthCalledWith(FOURTH_CALL, HOME_MOVE_DIRECTIONS.down);
	});

	it('routes confirm actions and ignores unrelated input actions', () => {
		const navigation = createNavigationMock();
		const handleInput = createHomeInputHandler({ navigation });

		handleInput(createInputEvent(INPUT_ACTIONS.confirm));
		handleInput(createInputEvent(INPUT_ACTIONS.cancel));
		handleInput(createInputEvent(INPUT_ACTIONS.options));

		expect(navigation.confirm).toHaveBeenCalledTimes(ONCE);
		expect(navigation.move).not.toHaveBeenCalled();
	});
});
