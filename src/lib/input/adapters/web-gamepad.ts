import type { InputAction, InputAdapter } from '../contracts';

import { INPUT_ACTIONS, INPUT_SOURCES } from '../contracts';

type WebGamepadInputAdapterOptions = {
	initialRepeatDelayMs?: number;
	heldRepeatDelayMs?: number;
	stickDeadzone?: number;
};

const DEFAULT_INITIAL_REPEAT_DELAY_MS = 180;
const DEFAULT_HELD_REPEAT_DELAY_MS = 110;
const DEFAULT_STICK_DEADZONE = 0.55;

const STANDARD_BUTTONS = {
	confirm: 0,
	cancel: 1,
	shoulderLeft: 4,
	shoulderRight: 5,
	options: 9,
	dpadUp: 12,
	dpadDown: 13,
	dpadLeft: 14,
	dpadRight: 15
} as const;

function getFirstConnectedGamepad() {
	return navigator.getGamepads().find((gamepad) => gamepad?.connected);
}

function readDirectionalAction(gamepad: Gamepad, stickDeadzone: number) {
	const dpadLeft = Boolean(gamepad.buttons[STANDARD_BUTTONS.dpadLeft]?.pressed);
	const dpadRight = Boolean(gamepad.buttons[STANDARD_BUTTONS.dpadRight]?.pressed);
	const dpadUp = Boolean(gamepad.buttons[STANDARD_BUTTONS.dpadUp]?.pressed);
	const dpadDown = Boolean(gamepad.buttons[STANDARD_BUTTONS.dpadDown]?.pressed);

	if (dpadLeft) return INPUT_ACTIONS.moveLeft;
	if (dpadRight) return INPUT_ACTIONS.moveRight;
	if (dpadUp) return INPUT_ACTIONS.moveUp;
	if (dpadDown) return INPUT_ACTIONS.moveDown;

	const leftStickX = gamepad.axes[0] ?? 0;
	const leftStickY = gamepad.axes[1] ?? 0;
	const absX = Math.abs(leftStickX);
	const absY = Math.abs(leftStickY);

	if (absX < stickDeadzone && absY < stickDeadzone) {
		return null;
	}

	if (absX >= absY) {
		return leftStickX < 0 ? INPUT_ACTIONS.moveLeft : INPUT_ACTIONS.moveRight;
	}

	return leftStickY < 0 ? INPUT_ACTIONS.moveUp : INPUT_ACTIONS.moveDown;
}

export function createWebGamepadInputAdapter({
	initialRepeatDelayMs = DEFAULT_INITIAL_REPEAT_DELAY_MS,
	heldRepeatDelayMs = DEFAULT_HELD_REPEAT_DELAY_MS,
	stickDeadzone = DEFAULT_STICK_DEADZONE
}: WebGamepadInputAdapterOptions = {}): InputAdapter {
	return {
		id: 'web-gamepad',
		start(dispatch) {
			let animationFrame = 0;
			let isPolling = false;
			let activeMoveAction: InputAction | null = null;
			let lastMoveAt = 0;
			let nextMoveRepeatDelayMs = initialRepeatDelayMs;
			let pressedButtons = new Set<InputAction>();

			function emit(action: InputAction, repeat: boolean) {
				dispatch({
					action,
					source: INPUT_SOURCES.webGamepad,
					at: performance.now(),
					repeat
				});
			}

			function updateMoveState(nextAction: InputAction | null, now: number) {
				if (!nextAction) {
					activeMoveAction = null;
					lastMoveAt = 0;
					nextMoveRepeatDelayMs = initialRepeatDelayMs;
					return;
				}

				if (nextAction !== activeMoveAction) {
					activeMoveAction = nextAction;
					lastMoveAt = now;
					nextMoveRepeatDelayMs = initialRepeatDelayMs;
					emit(nextAction, false);
					return;
				}

				if (now - lastMoveAt < nextMoveRepeatDelayMs) return;

				lastMoveAt = now;
				nextMoveRepeatDelayMs = heldRepeatDelayMs;
				emit(nextAction, true);
			}

			function updateButtonState(gamepad: Gamepad) {
				const nextPressedButtons = new Set<InputAction>();
				const actionButtons: Array<[InputAction, number]> = [
					[INPUT_ACTIONS.confirm, STANDARD_BUTTONS.confirm],
					[INPUT_ACTIONS.cancel, STANDARD_BUTTONS.cancel],
					[INPUT_ACTIONS.options, STANDARD_BUTTONS.options],
					[INPUT_ACTIONS.shoulderLeft, STANDARD_BUTTONS.shoulderLeft],
					[INPUT_ACTIONS.shoulderRight, STANDARD_BUTTONS.shoulderRight]
				];

				for (const [action, index] of actionButtons) {
					const isPressed = Boolean(gamepad.buttons[index]?.pressed);
					if (!isPressed) continue;

					nextPressedButtons.add(action);

					if (!pressedButtons.has(action)) {
						emit(action, false);
					}
				}

				pressedButtons = nextPressedButtons;
			}

			function stopPolling() {
				if (!isPolling) return;

				window.cancelAnimationFrame(animationFrame);
				animationFrame = 0;
				isPolling = false;
				activeMoveAction = null;
				lastMoveAt = 0;
				nextMoveRepeatDelayMs = initialRepeatDelayMs;
				pressedButtons = new Set<InputAction>();
			}

			function readGamepadInput() {
				const gamepad = getFirstConnectedGamepad();

				if (!gamepad) {
					stopPolling();
					return;
				}

				const now = performance.now();
				const directionalAction = readDirectionalAction(gamepad, stickDeadzone);

				updateMoveState(directionalAction, now);
				updateButtonState(gamepad);

				animationFrame = window.requestAnimationFrame(readGamepadInput);
			}

			function startPolling() {
				if (isPolling) return;
				if (!getFirstConnectedGamepad()) return;

				isPolling = true;
				animationFrame = window.requestAnimationFrame(readGamepadInput);
			}

			function handleGamepadConnected() {
				startPolling();
			}

			function handleGamepadDisconnected() {
				if (getFirstConnectedGamepad()) return;
				stopPolling();
			}

			window.addEventListener('gamepadconnected', handleGamepadConnected);
			window.addEventListener('gamepaddisconnected', handleGamepadDisconnected);
			startPolling();

			return () => {
				stopPolling();
				window.removeEventListener('gamepadconnected', handleGamepadConnected);
				window.removeEventListener('gamepaddisconnected', handleGamepadDisconnected);
			};
		}
	};
}
