import { describe, expect, it, vi } from 'vitest';

import { INPUT_ACTIONS, INPUT_SOURCES, type InputAdapter, type InputDispatch } from './contracts';
import { createInputRuntime } from './runtime';

function createInputEvent() {
	return {
		action: INPUT_ACTIONS.confirm,
		source: INPUT_SOURCES.keyboard,
		at: 1,
		repeat: false
	} as const;
}

describe('createInputRuntime', () => {
	it('starts adapters once when the first listener subscribes', () => {
		const cleanup = vi.fn();
		const start = vi.fn(() => cleanup);
		const runtime = createInputRuntime({
			adapters: [{ id: 'keyboard', start }]
		});

		const unsubscribeA = runtime.subscribe(() => undefined);
		const unsubscribeB = runtime.subscribe(() => undefined);

		expect(start).toHaveBeenCalledTimes(1);

		unsubscribeA();
		expect(cleanup).not.toHaveBeenCalled();

		unsubscribeB();
		expect(cleanup).toHaveBeenCalledTimes(1);
	});

	it('dispatches adapter events to every active listener', () => {
		let dispatchFromAdapter: InputDispatch | undefined;
		const runtime = createInputRuntime({
			adapters: [
				{
					id: 'keyboard',
					start(dispatch) {
						dispatchFromAdapter = dispatch;
						return () => undefined;
					}
				}
			]
		});

		const listenerA = vi.fn();
		const listenerB = vi.fn();
		runtime.subscribe(listenerA);
		runtime.subscribe(listenerB);

		const event = createInputEvent();
		dispatchFromAdapter?.(event);

		expect(listenerA).toHaveBeenCalledWith(event);
		expect(listenerB).toHaveBeenCalledWith(event);
	});

	it('stops every adapter when stop is called explicitly', () => {
		const cleanups = [vi.fn(), vi.fn()];
		const adapters: InputAdapter[] = cleanups.map((cleanup, index) => ({
			id: `adapter-${index}`,
			start: vi.fn(() => cleanup)
		}));
		const runtime = createInputRuntime({ adapters });

		runtime.subscribe(() => undefined);
		runtime.stop();

		expect(cleanups[0]).toHaveBeenCalledTimes(1);
		expect(cleanups[1]).toHaveBeenCalledTimes(1);
	});
});
