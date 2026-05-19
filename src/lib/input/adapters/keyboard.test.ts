import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { INPUT_ACTIONS, INPUT_PHASES, INPUT_SOURCES, type InputEvent } from '../contracts';

import { createKeyboardInputAdapter } from './keyboard';

describe('createKeyboardInputAdapter', () => {
	let events: InputEvent[];
	let stop: (() => void) | undefined;

	beforeEach(() => {
		events = [];
		vi.spyOn(performance, 'now').mockReturnValue(1234);

		stop = createKeyboardInputAdapter().start((event) => {
			events.push(event);
		});
	});

	afterEach(() => {
		stop?.();
		stop = undefined;
		vi.restoreAllMocks();
		document.body.innerHTML = '';
	});

	it('dispatches mapped movement keys and marks repeated movement correctly', () => {
		const firstEvent = new KeyboardEvent('keydown', { key: 'ArrowRight', cancelable: true });
		window.dispatchEvent(firstEvent);

		const repeatEvent = new KeyboardEvent('keydown', {
			key: 'ArrowRight',
			cancelable: true,
			repeat: true
		});
		window.dispatchEvent(repeatEvent);

		expect(events).toEqual([
			{
				action: INPUT_ACTIONS.moveRight,
				source: INPUT_SOURCES.keyboard,
				at: 1234,
				repeat: false,
				phase: INPUT_PHASES.press
			},
			{
				action: INPUT_ACTIONS.moveRight,
				source: INPUT_SOURCES.keyboard,
				at: 1234,
				repeat: true,
				phase: INPUT_PHASES.press
			}
		]);
		expect(firstEvent.defaultPrevented).toBe(true);
		expect(repeatEvent.defaultPrevented).toBe(true);
	});

	it('suppresses repeat events for non-repeatable actions like confirm', () => {
		window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', cancelable: true }));
		window.dispatchEvent(
			new KeyboardEvent('keydown', {
				key: 'Enter',
				cancelable: true,
				repeat: true
			})
		);

		expect(events).toHaveLength(1);
		expect(events[0]?.action).toBe(INPUT_ACTIONS.confirm);
		expect(events[0]?.repeat).toBe(false);
	});

	it('maps Escape and O to cancel for keyboard parity with controller back buttons', () => {
		window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', cancelable: true }));
		window.dispatchEvent(new KeyboardEvent('keydown', { key: 'O', cancelable: true }));

		expect(events).toEqual([
			{
				action: INPUT_ACTIONS.cancel,
				source: INPUT_SOURCES.keyboard,
				at: 1234,
				repeat: false,
				phase: INPUT_PHASES.press
			},
			{
				action: INPUT_ACTIONS.cancel,
				source: INPUT_SOURCES.keyboard,
				at: 1234,
				repeat: false,
				phase: INPUT_PHASES.press
			}
		]);
	});

	it('dispatches release events for mapped keys', () => {
		const keyupEvent = new KeyboardEvent('keyup', { key: 'ArrowRight', cancelable: true });
		window.dispatchEvent(keyupEvent);

		expect(events).toEqual([
			{
				action: INPUT_ACTIONS.moveRight,
				source: INPUT_SOURCES.keyboard,
				at: 1234,
				repeat: false,
				phase: INPUT_PHASES.release
			}
		]);
		expect(keyupEvent.defaultPrevented).toBe(true);
	});

	it('ignores keys pressed from editable controls', () => {
		// Inputs should keep native keyboard behavior instead of being hijacked
		// by shell navigation shortcuts.
		const input = document.createElement('input');
		document.body.appendChild(input);

		input.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true }));

		expect(events).toHaveLength(0);
	});

	it('removes its keydown listener when stopped', () => {
		stop?.();
		stop = undefined;

		window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft' }));

		expect(events).toHaveLength(0);
	});
});
