export type HomeFocusArea = 'carousel' | 'play';
export type HomeMoveDirection = 'left' | 'right' | 'up' | 'down';

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

	function handleDirection(direction: HomeMoveDirection) {
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
		confirm,
		syncFocusFromElement,
		syncPointerTarget
	};
}
