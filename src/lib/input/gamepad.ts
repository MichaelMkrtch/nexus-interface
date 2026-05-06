export type GamepadDirection = 'left' | 'right' | 'up' | 'down';

type GamepadNavigationOptions = {
	onDirection: (direction: GamepadDirection) => void;
	onConfirm?: () => void;
	repeatDelayMs?: number;
	stickDeadzone?: number;
};

const DEFAULT_REPEAT_DELAY_MS = 180;
const DEFAULT_STICK_DEADZONE = 0.55;

export function startGamepadNavigation({
	onDirection,
	onConfirm,
	repeatDelayMs = DEFAULT_REPEAT_DELAY_MS,
	stickDeadzone = DEFAULT_STICK_DEADZONE
}: GamepadNavigationOptions) {
	let animationFrame = 0;
	let lastMoveAt = 0;
	let wasConfirmPressed = false;

	function readGamepadInput() {
		const gamepad = navigator.getGamepads()[0];

		if (gamepad) {
			const now = performance.now();
			const canMove = now - lastMoveAt >= repeatDelayMs;

			if (canMove) {
				const dpadLeft = gamepad.buttons[14]?.pressed;
				const dpadRight = gamepad.buttons[15]?.pressed;
				const dpadUp = gamepad.buttons[12]?.pressed;
				const dpadDown = gamepad.buttons[13]?.pressed;
				const leftStickX = gamepad.axes[0] ?? 0;
				const leftStickY = gamepad.axes[1] ?? 0;
				const stickLeft = leftStickX < -stickDeadzone;
				const stickRight = leftStickX > stickDeadzone;
				const stickUp = leftStickY < -stickDeadzone;
				const stickDown = leftStickY > stickDeadzone;

				if (dpadLeft || stickLeft) {
					lastMoveAt = now;
					onDirection('left');
				} else if (dpadRight || stickRight) {
					lastMoveAt = now;
					onDirection('right');
				} else if (dpadUp || stickUp) {
					lastMoveAt = now;
					onDirection('up');
				} else if (dpadDown || stickDown) {
					lastMoveAt = now;
					onDirection('down');
				}
			}

			const isConfirmPressed = Boolean(gamepad.buttons[0]?.pressed);
			if (isConfirmPressed && !wasConfirmPressed) {
				onConfirm?.();
			}
			wasConfirmPressed = isConfirmPressed;
		}

		animationFrame = window.requestAnimationFrame(readGamepadInput);
	}

	animationFrame = window.requestAnimationFrame(readGamepadInput);

	return () => {
		window.cancelAnimationFrame(animationFrame);
	};
}
