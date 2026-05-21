import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { INPUT_ACTIONS, INPUT_PHASES, INPUT_SOURCES, type InputEvent } from '../contracts';

import { createWebGamepadInputAdapter } from './web-gamepad';

describe('createWebGamepadInputAdapter', () => {
	let events: InputEvent[];
	let animationFrames: FrameRequestCallback[];
	let stop: (() => void) | undefined;
	let gamepad: Gamepad | null;

	beforeEach(() => {
		events = [];
		animationFrames = [];
		gamepad = createGamepad();

		vi.spyOn(performance, 'now').mockReturnValue(1234);
		Object.defineProperty(navigator, 'getGamepads', {
			configurable: true,
			value: vi.fn(() => [gamepad])
		});
		vi.spyOn(window, 'requestAnimationFrame').mockImplementation((callback) => {
			animationFrames.push(callback);
			return animationFrames.length;
		});
		vi.spyOn(window, 'cancelAnimationFrame').mockImplementation(() => undefined);

		stop = createWebGamepadInputAdapter().start((event) => {
			events.push(event);
		});
	});

	afterEach(() => {
		stop?.();
		stop = undefined;
		Reflect.deleteProperty(navigator, 'getGamepads');
		vi.restoreAllMocks();
	});

	it('dispatches a release event when held directional input is released', () => {
		setButtonPressed(15, true);
		animationFrames.shift()?.(100);

		setButtonPressed(15, false);
		animationFrames.shift()?.(116);

		expect(events).toEqual([
			{
				action: INPUT_ACTIONS.moveRight,
				source: INPUT_SOURCES.webGamepad,
				at: 1234,
				repeat: false,
				phase: INPUT_PHASES.press
			},
			{
				action: INPUT_ACTIONS.moveRight,
				source: INPUT_SOURCES.webGamepad,
				at: 1234,
				repeat: false,
				phase: INPUT_PHASES.release
			}
		]);
	});

	it('dispatches trigger button presses', () => {
		setButtonPressed(6, true);
		setButtonPressed(7, true);
		animationFrames.shift()?.(100);

		expect(events).toEqual([
			{
				action: INPUT_ACTIONS.triggerLeft,
				source: INPUT_SOURCES.webGamepad,
				at: 1234,
				repeat: false,
				phase: INPUT_PHASES.press
			},
			{
				action: INPUT_ACTIONS.triggerRight,
				source: INPUT_SOURCES.webGamepad,
				at: 1234,
				repeat: false,
				phase: INPUT_PHASES.press
			}
		]);
	});

	function setButtonPressed(index: number, pressed: boolean) {
		if (!gamepad) return;
		(gamepad.buttons[index] as { pressed: boolean }).pressed = pressed;
	}
});

function createGamepad(): Gamepad {
	return {
		axes: [0, 0, 0, 0],
		buttons: Array.from({ length: 16 }, () => ({ pressed: false, touched: false, value: 0 })),
		connected: true
	} as unknown as Gamepad;
}
