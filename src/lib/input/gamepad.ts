export type GamepadDirection = 'left' | 'right';

type GamepadNavigationOptions = {
	onDirection: (direction: GamepadDirection) => void;
	repeatDelayMs?: number;
	stickDeadzone?: number;
};

const DEFAULT_REPEAT_DELAY_MS = 180;
const DEFAULT_STICK_DEADZONE = 0.55;

export function startGamepadNavigation({
	onDirection,
	repeatDelayMs = DEFAULT_REPEAT_DELAY_MS,
	stickDeadzone = DEFAULT_STICK_DEADZONE
}: GamepadNavigationOptions) {
	let animationFrame = 0;
	let lastMoveAt = 0;

	function readGamepadInput() {
		const gamepad = navigator.getGamepads()[0];

		if (gamepad) {
			const now = performance.now();
			const canMove = now - lastMoveAt >= repeatDelayMs;

			if (canMove) {
				const dpadLeft = gamepad.buttons[14]?.pressed;
				const dpadRight = gamepad.buttons[15]?.pressed;
				const leftStickX = gamepad.axes[0] ?? 0;
				const stickLeft = leftStickX < -stickDeadzone;
				const stickRight = leftStickX > stickDeadzone;

				if (dpadLeft || stickLeft) {
					lastMoveAt = now;
					onDirection('left');
				} else if (dpadRight || stickRight) {
					lastMoveAt = now;
					onDirection('right');
				}
			}
		}

		animationFrame = window.requestAnimationFrame(readGamepadInput);
	}

	animationFrame = window.requestAnimationFrame(readGamepadInput);

	return () => {
		window.cancelAnimationFrame(animationFrame);
	};
}
