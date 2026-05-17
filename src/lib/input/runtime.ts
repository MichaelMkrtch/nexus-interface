import type { InputAdapter, InputEvent, InputListener, InputUnsubscribe } from './contracts';

type InputRuntimeOptions = {
	adapters: InputAdapter[];
};

export function createInputRuntime({ adapters }: InputRuntimeOptions) {
	const listeners = new Set<InputListener>();
	let adapterCleanup: InputUnsubscribe[] = [];
	let isRunning = false;

	function dispatch(event: InputEvent) {
		for (const listener of listeners) {
			listener(event);
		}
	}

	function startAdapters() {
		if (isRunning) return;

		adapterCleanup = adapters.map((adapter) => adapter.start(dispatch));
		isRunning = true;
	}

	function stopAdapters() {
		if (!isRunning) return;

		for (const cleanup of adapterCleanup) {
			cleanup();
		}

		adapterCleanup = [];
		isRunning = false;
	}

	function subscribe(listener: InputListener) {
		listeners.add(listener);
		startAdapters();

		return () => {
			listeners.delete(listener);

			if (listeners.size === 0) {
				stopAdapters();
			}
		};
	}

	return {
		subscribe,
		stop: stopAdapters
	};
}
