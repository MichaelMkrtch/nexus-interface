export const HOME_SECTIONS = {
	carousel: 'carousel',
	actions: 'actions'
} as const;

export const HOME_MOVE_DIRECTIONS = {
	left: 'left',
	right: 'right',
	up: 'up',
	down: 'down'
} as const;

export type HomeSection = (typeof HOME_SECTIONS)[keyof typeof HOME_SECTIONS];
export type Move = (typeof HOME_MOVE_DIRECTIONS)[keyof typeof HOME_MOVE_DIRECTIONS];

type Options = {
	gameCount: number | (() => number);
	actionCount?: number;
	onConfirmAction?: (actionIndex: number) => void;
};

export type HomeNav = {
	readonly activeSection: HomeSection;
	readonly focusedGameIndex: number;
	readonly focusedActionIndex: number;
	focusGame: (index: number) => void;
	focusAction: (index: number) => void;
	move: (direction: Move, distance?: number) => void;
	confirm: () => void;
};

export function createHomeNavigation({
	gameCount,
	actionCount = 1,
	onConfirmAction
}: Options): HomeNav {
	const getGameCount = typeof gameCount === 'function' ? gameCount : () => gameCount;
	const sectionOrder = [HOME_SECTIONS.carousel, HOME_SECTIONS.actions] as const;
	const itemCounts: Record<HomeSection, () => number> = {
		[HOME_SECTIONS.carousel]: getGameCount,
		[HOME_SECTIONS.actions]: () => actionCount
	};

	let activeSection = $state<HomeSection>(HOME_SECTIONS.carousel);
	let indices = $state<Record<HomeSection, number>>({
		[HOME_SECTIONS.carousel]: 0,
		[HOME_SECTIONS.actions]: 0
	});

	function clampIndex(section: HomeSection, index: number) {
		const itemCount = itemCounts[section]();
		if (itemCount <= 0) return 0;

		return Math.max(0, Math.min(index, itemCount - 1));
	}

	function setIndex(section: HomeSection, index: number) {
		const nextIndex = clampIndex(section, index);
		if (indices[section] === nextIndex) return;

		indices = {
			...indices,
			[section]: nextIndex
		};
	}

	function setActiveSection(section: HomeSection) {
		if (activeSection === section) return;
		activeSection = section;
	}

	function focusGame(index: number) {
		setIndex(HOME_SECTIONS.carousel, index);
		setActiveSection(HOME_SECTIONS.carousel);
	}

	function focusAction(index: number) {
		setIndex(HOME_SECTIONS.actions, index);
		setActiveSection(HOME_SECTIONS.actions);
	}

	function moveWithinSection(delta: number, distance = 1) {
		setIndex(activeSection, indices[activeSection] + delta * distance);
	}

	function moveBetweenSections(delta: number) {
		const currentIndex = sectionOrder.indexOf(activeSection);
		const nextIndex = Math.max(0, Math.min(currentIndex + delta, sectionOrder.length - 1));
		const nextSection = sectionOrder[nextIndex];

		if (!nextSection || nextSection === activeSection) return;

		setActiveSection(nextSection);
	}

	function move(direction: Move, distance = 1) {
		if (direction === 'left') {
			moveWithinSection(-1, distance);
		} else if (direction === 'right') {
			moveWithinSection(1, distance);
		} else if (direction === 'down') {
			moveBetweenSections(1);
		} else if (direction === 'up') {
			moveBetweenSections(-1);
		}
	}

	function confirm() {
		if (activeSection === HOME_SECTIONS.actions) {
			onConfirmAction?.(indices[HOME_SECTIONS.actions]);
		}
	}

	return {
		get activeSection() {
			return activeSection;
		},
		get focusedGameIndex() {
			return indices[HOME_SECTIONS.carousel];
		},
		get focusedActionIndex() {
			return indices[HOME_SECTIONS.actions];
		},
		focusGame,
		focusAction,
		move,
		confirm
	};
}
