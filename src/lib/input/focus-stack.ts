import type { InputEvent } from './contracts';

import { INPUT_ACTIONS, INPUT_PHASES } from './contracts';

const REPEAT_INITIAL_DELAY_MS = 300;
const NORMAL_REPEAT_INTERVAL_MS = 110;
const FAST_REPEAT_HOLD_MS = 450;
const FAST_REPEAT_INTERVAL_MS = 50;
const RELEASE_GRACE_MS = 120;

type DirectionalAction =
	| typeof INPUT_ACTIONS.moveLeft
	| typeof INPUT_ACTIONS.moveRight
	| typeof INPUT_ACTIONS.moveUp
	| typeof INPUT_ACTIONS.moveDown;

export type InputSurface = {
	id: string;
	handleInput: (event: InputEvent) => void;
	shouldRepeatInput?: (event: InputEvent) => boolean;
};

type InputSurfaceStackOptions = {
	repeatInitialDelayMs?: number;
	normalRepeatIntervalMs?: number;
	fastRepeatHoldMs?: number;
	fastRepeatIntervalMs?: number;
	releaseGraceMs?: number;
	setIntervalFn?: typeof window.setInterval;
	clearIntervalFn?: typeof window.clearInterval;
	setTimeoutFn?: typeof window.setTimeout;
	clearTimeoutFn?: typeof window.clearTimeout;
};

export function createInputSurfaceStack(
	baseSurface: InputSurface,
	{
		repeatInitialDelayMs = REPEAT_INITIAL_DELAY_MS,
		normalRepeatIntervalMs = NORMAL_REPEAT_INTERVAL_MS,
		fastRepeatHoldMs = FAST_REPEAT_HOLD_MS,
		fastRepeatIntervalMs = FAST_REPEAT_INTERVAL_MS,
		releaseGraceMs = RELEASE_GRACE_MS,
		setIntervalFn = window.setInterval,
		clearIntervalFn = window.clearInterval,
		setTimeoutFn = window.setTimeout,
		clearTimeoutFn = window.clearTimeout
	}: InputSurfaceStackOptions = {}
) {
	const surfaces = [baseSurface];
	let heldAction: DirectionalAction | null = null;
	let heldSurfaceId: string | null = null;
	let repeatInterval: number | null = null;
	let repeatDelayTimeout: number | null = null;
	let fastRepeatTimeout: number | null = null;
	let releaseWatchdogTimeout: number | null = null;

	function activeSurface() {
		return surfaces[surfaces.length - 1] ?? baseSurface;
	}

	function push(surface: InputSurface) {
		remove(surface.id);
		resetRepeat();
		surfaces.push(surface);
	}

	function remove(id: string) {
		if (id === baseSurface.id) return;

		const index = surfaces.findIndex((surface) => surface.id === id);
		if (index === -1) return;

		surfaces.splice(index, 1);
		if (heldSurfaceId === id) resetRepeat();
	}

	function dispatch(event: InputEvent) {
		const surface = activeSurface();

		if (event.phase === INPUT_PHASES.release) {
			if (
				isDirectionalInputEvent(event) &&
				heldAction === event.action &&
				heldSurfaceId === surface.id
			) {
				resetRepeat();
			}
			return;
		}

		if (!isDirectionalInputEvent(event)) {
			resetRepeat();
			surface.handleInput(event);
			return;
		}

		const directionalEvent = event;

		if (!surface.shouldRepeatInput?.(directionalEvent)) {
			resetRepeat();
			surface.handleInput(directionalEvent);
			return;
		}

		if (
			directionalEvent.repeat &&
			heldAction === directionalEvent.action &&
			heldSurfaceId === surface.id
		) {
			refreshReleaseWatchdog();
			return;
		}

		resetRepeat();
		heldAction = directionalEvent.action;
		heldSurfaceId = surface.id;
		surface.handleInput(directionalEvent);
		startRepeat(surface, directionalEvent);
	}

	return {
		get activeSurfaceId() {
			return activeSurface().id;
		},
		dispatch,
		push,
		remove
	};

	function startRepeat(surface: InputSurface, event: InputEvent & { action: DirectionalAction }) {
		repeatDelayTimeout = setTimeoutFn(() => {
			if (!isHolding(surface.id, event.action)) return;

			surface.handleInput(toRepeatInputEvent(event));
			repeatInterval = setIntervalFn(() => {
				if (!isHolding(surface.id, event.action)) {
					resetRepeat();
					return;
				}

				surface.handleInput(toRepeatInputEvent(event));
			}, normalRepeatIntervalMs);
		}, repeatInitialDelayMs);

		fastRepeatTimeout = setTimeoutFn(() => {
			if (!isHolding(surface.id, event.action)) return;

			if (repeatInterval !== null) clearIntervalFn(repeatInterval);
			repeatInterval = setIntervalFn(() => {
				if (!isHolding(surface.id, event.action)) {
					resetRepeat();
					return;
				}

				surface.handleInput(toRepeatInputEvent(event));
			}, fastRepeatIntervalMs);
		}, fastRepeatHoldMs);
	}

	function refreshReleaseWatchdog() {
		if (releaseWatchdogTimeout !== null) clearTimeoutFn(releaseWatchdogTimeout);

		releaseWatchdogTimeout = setTimeoutFn(resetRepeat, releaseGraceMs);
	}

	function resetRepeat() {
		heldAction = null;
		heldSurfaceId = null;
		clearRepeatTimers();
	}

	function clearRepeatTimers() {
		if (repeatInterval !== null) {
			clearIntervalFn(repeatInterval);
			repeatInterval = null;
		}

		if (repeatDelayTimeout !== null) {
			clearTimeoutFn(repeatDelayTimeout);
			repeatDelayTimeout = null;
		}

		if (fastRepeatTimeout !== null) {
			clearTimeoutFn(fastRepeatTimeout);
			fastRepeatTimeout = null;
		}

		if (releaseWatchdogTimeout !== null) {
			clearTimeoutFn(releaseWatchdogTimeout);
			releaseWatchdogTimeout = null;
		}
	}

	function isHolding(surfaceId: string, action: DirectionalAction) {
		return heldSurfaceId === surfaceId && heldAction === action && activeSurface().id === surfaceId;
	}
}

function isDirectionalInputEvent(
	event: InputEvent
): event is InputEvent & { action: DirectionalAction } {
	return isDirectionalAction(event.action);
}

function isDirectionalAction(action: InputEvent['action']): action is DirectionalAction {
	return (
		action === INPUT_ACTIONS.moveLeft ||
		action === INPUT_ACTIONS.moveRight ||
		action === INPUT_ACTIONS.moveUp ||
		action === INPUT_ACTIONS.moveDown
	);
}

function toRepeatInputEvent(event: InputEvent & { action: DirectionalAction }): InputEvent {
	return {
		...event,
		repeat: true,
		phase: INPUT_PHASES.press
	};
}
