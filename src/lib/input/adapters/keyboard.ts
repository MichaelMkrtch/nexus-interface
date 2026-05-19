import type { InputAction, InputAdapter } from '../contracts';

import { INPUT_ACTIONS, INPUT_PHASES, INPUT_SOURCES } from '../contracts';

const KEYBOARD_ACTIONS: Partial<Record<string, InputAction>> = {
	ArrowLeft: INPUT_ACTIONS.moveLeft,
	ArrowRight: INPUT_ACTIONS.moveRight,
	ArrowUp: INPUT_ACTIONS.moveUp,
	ArrowDown: INPUT_ACTIONS.moveDown,
	Enter: INPUT_ACTIONS.confirm,
	' ': INPUT_ACTIONS.confirm,
	Escape: INPUT_ACTIONS.cancel,
	o: INPUT_ACTIONS.cancel,
	O: INPUT_ACTIONS.cancel
};

const REPEATABLE_ACTIONS = new Set<InputAction>([
	INPUT_ACTIONS.moveLeft,
	INPUT_ACTIONS.moveRight,
	INPUT_ACTIONS.moveUp,
	INPUT_ACTIONS.moveDown
]);

function isEditableTarget(target: EventTarget | null) {
	const element = target instanceof HTMLElement ? target : null;
	if (!element) return false;

	return (
		element.isContentEditable ||
		element instanceof HTMLInputElement ||
		element instanceof HTMLTextAreaElement ||
		element instanceof HTMLSelectElement
	);
}

export function createKeyboardInputAdapter(): InputAdapter {
	return {
		id: 'keyboard',
		start(dispatch) {
			const handleKeydown = (event: KeyboardEvent) => {
				if (isEditableTarget(event.target)) return;

				const action = KEYBOARD_ACTIONS[event.key];
				if (!action) return;
				if (event.repeat && !REPEATABLE_ACTIONS.has(action)) return;

				event.preventDefault();
				dispatch({
					action,
					source: INPUT_SOURCES.keyboard,
					at: performance.now(),
					repeat: event.repeat,
					phase: INPUT_PHASES.press
				});
			};

			const handleKeyup = (event: KeyboardEvent) => {
				if (isEditableTarget(event.target)) return;

				const action = KEYBOARD_ACTIONS[event.key];
				if (!action) return;

				event.preventDefault();
				dispatch({
					action,
					source: INPUT_SOURCES.keyboard,
					at: performance.now(),
					repeat: false,
					phase: INPUT_PHASES.release
				});
			};

			window.addEventListener('keydown', handleKeydown);
			window.addEventListener('keyup', handleKeyup);

			return () => {
				window.removeEventListener('keydown', handleKeydown);
				window.removeEventListener('keyup', handleKeyup);
			};
		}
	};
}
