import { HOME_LIBRARY_GRID_COLUMN_COUNT } from './home-rail';

export const HOME_SECTIONS = {
	carousel: 'carousel',
	actions: 'actions',
	library: 'library'
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
	libraryItemCount?: number | (() => number);
	libraryColumnCount?: number;
	onConfirmAction?: (actionIndex: number) => void;
};

export type HomeNav = {
	readonly activeSection: HomeSection;
	readonly focusedGameIndex: number;
	readonly focusedActionIndex: number;
	readonly focusedLibraryIndex: number;
	focusGame: (index: number) => void;
	focusAction: (index: number) => void;
	focusLibrary: (index: number) => void;
	jumpToFirstRailItem: () => void;
	jumpToLastRailItem: () => void;
	move: (direction: Move, distance?: number) => void;
	confirm: () => void;
};

export function createHomeNavigation({
	gameCount,
	actionCount = 1,
	libraryItemCount = 0,
	libraryColumnCount = HOME_LIBRARY_GRID_COLUMN_COUNT,
	onConfirmAction
}: Options): HomeNav {
	const getGameCount = typeof gameCount === 'function' ? gameCount : () => gameCount;
	const getLibraryItemCount =
		typeof libraryItemCount === 'function' ? libraryItemCount : () => libraryItemCount;
	const itemCounts: Record<HomeSection, () => number> = {
		[HOME_SECTIONS.carousel]: getGameCount,
		[HOME_SECTIONS.actions]: () => actionCount,
		[HOME_SECTIONS.library]: getLibraryItemCount
	};

	let activeSection = $state<HomeSection>(HOME_SECTIONS.carousel);
	let indices = $state<Record<HomeSection, number>>({
		[HOME_SECTIONS.carousel]: 0,
		[HOME_SECTIONS.actions]: 0,
		[HOME_SECTIONS.library]: 0
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

	function focusLibrary(index: number) {
		setIndex(HOME_SECTIONS.library, index);
		setActiveSection(HOME_SECTIONS.library);
	}

	function enterActions() {
		setIndex(HOME_SECTIONS.actions, 0);
		setActiveSection(HOME_SECTIONS.actions);
	}

	function enterLibrary() {
		setIndex(HOME_SECTIONS.library, 0);
		setActiveSection(HOME_SECTIONS.library);
	}

	function jumpToFirstRailItem() {
		if (activeSection !== HOME_SECTIONS.carousel) return;
		setIndex(HOME_SECTIONS.carousel, 0);
	}

	function jumpToLastRailItem() {
		if (activeSection !== HOME_SECTIONS.carousel) return;
		setIndex(HOME_SECTIONS.carousel, getGameCount() - 1);
	}

	function moveWithinSection(delta: number, distance = 1) {
		setIndex(activeSection, indices[activeSection] + delta * distance);
	}

	function isLibraryRailItemFocused() {
		return indices[HOME_SECTIONS.carousel] === getGameCount() - 1;
	}

	function moveVertically(direction: Move) {
		if (activeSection === HOME_SECTIONS.carousel && direction === HOME_MOVE_DIRECTIONS.down) {
			if (isLibraryRailItemFocused()) {
				enterLibrary();
			} else {
				enterActions();
			}
			return;
		}

		if (activeSection === HOME_SECTIONS.actions && direction === HOME_MOVE_DIRECTIONS.up) {
			setActiveSection(HOME_SECTIONS.carousel);
			return;
		}

		if (activeSection === HOME_SECTIONS.library) {
			if (
				direction === HOME_MOVE_DIRECTIONS.up &&
				indices[HOME_SECTIONS.library] < libraryColumnCount
			) {
				setActiveSection(HOME_SECTIONS.carousel);
				return;
			}

			const delta =
				direction === HOME_MOVE_DIRECTIONS.down ? libraryColumnCount : -libraryColumnCount;
			moveWithinSection(delta);
		}
	}

	function move(direction: Move, distance = 1) {
		if (direction === 'left') {
			moveWithinSection(-1, distance);
		} else if (direction === 'right') {
			moveWithinSection(1, distance);
		} else {
			moveVertically(direction);
		}
	}

	function confirm() {
		if (activeSection === HOME_SECTIONS.actions) {
			onConfirmAction?.(indices[HOME_SECTIONS.actions]);
		} else if (activeSection === HOME_SECTIONS.carousel && isLibraryRailItemFocused()) {
			enterLibrary();
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
		get focusedLibraryIndex() {
			return indices[HOME_SECTIONS.library];
		},
		focusGame,
		focusAction,
		focusLibrary,
		jumpToFirstRailItem,
		jumpToLastRailItem,
		move,
		confirm
	};
}
