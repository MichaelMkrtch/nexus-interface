import type { GamepadDirection } from '$lib/input/gamepad';

export type HomeFocusArea = 'carousel' | 'play';

type HomeNavigationOptions = {
	gameCount: number;
	onFocusCarousel?: () => void;
	onFocusPlay?: () => void;
	onConfirmPlay?: () => void;
};

export function createHomeNavigation({
	gameCount,
	onFocusCarousel,
	onFocusPlay,
	onConfirmPlay
}: HomeNavigationOptions) {
	let focusedGameIndex = $state(0);
	let focusArea = $state<HomeFocusArea>('carousel');

	function clampGameIndex(index: number) {
		return Math.max(0, Math.min(index, gameCount - 1));
	}

	function focusGame(index: number) {
		focusedGameIndex = clampGameIndex(index);
	}

	function focusCarousel() {
		focusArea = 'carousel';
		onFocusCarousel?.();
	}

	function focusPlay() {
		focusArea = 'play';
		onFocusPlay?.();
	}

	function moveGame(delta: number) {
		if (focusArea !== 'carousel') return;
		focusGame(focusedGameIndex + delta);
	}

	function handleDirection(direction: GamepadDirection) {
		if (direction === 'left') {
			moveGame(-1);
		} else if (direction === 'right') {
			moveGame(1);
		} else if (direction === 'down' && focusArea === 'carousel') {
			focusPlay();
		} else if (direction === 'up' && focusArea === 'play') {
			focusCarousel();
		}
	}

	function confirm() {
		if (focusArea === 'play') {
			onConfirmPlay?.();
		}
	}

	function handleKeydown(event: KeyboardEvent) {
		if (event.key === 'ArrowLeft') {
			event.preventDefault();
			handleDirection('left');
		} else if (event.key === 'ArrowRight') {
			event.preventDefault();
			handleDirection('right');
		} else if (event.key === 'ArrowDown') {
			event.preventDefault();
			handleDirection('down');
		} else if (event.key === 'ArrowUp') {
			event.preventDefault();
			handleDirection('up');
		} else if (event.key === 'Enter' || event.key === ' ') {
			if (focusArea !== 'play') return;
			event.preventDefault();
			confirm();
		}
	}

	function syncFocusFromElement(target: EventTarget | null, playButton: HTMLButtonElement | null) {
		if (target === playButton) {
			focusArea = 'play';
		}
	}

	function syncPointerTarget(target: EventTarget | null, playButton: HTMLButtonElement | null) {
		if (target === playButton) {
			focusPlay();
		} else {
			focusCarousel();
		}
	}

	return {
		get focusedGameIndex() {
			return focusedGameIndex;
		},
		get focusArea() {
			return focusArea;
		},
		focusCarousel,
		focusPlay,
		focusGame,
		handleDirection,
		handleKeydown,
		confirm,
		syncFocusFromElement,
		syncPointerTarget
	};
}
