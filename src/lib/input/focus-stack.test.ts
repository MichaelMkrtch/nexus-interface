import { describe, expect, it, vi } from 'vitest';

import { INPUT_ACTIONS, INPUT_PHASES, INPUT_SOURCES, type InputEvent } from './contracts';
import { createInputSurfaceStack, type InputSurface } from './focus-stack';

const SURFACE_IDS = {
	home: 'home',
	coverPicker: 'cover-picker'
} as const;

const TEST_REPEAT_INITIAL_DELAY_MS = 180;
const TEST_NORMAL_REPEAT_INTERVAL_MS = 110;
const TEST_FAST_REPEAT_HOLD_MS = 650;
const TEST_FAST_REPEAT_INTERVAL_MS = 50;
const TEST_RELEASE_GRACE_MS = 120;
const DEFAULT_FAST_REPEAT_HOLD_MS = 450;
const EVENT_AT_MS = 100;
const FIRST_CALL = 1;
const SECOND_CALL = 2;
const THIRD_CALL = 3;
const ONCE = 1;
const TWICE = 2;
const THREE_TIMES = 3;

type CapturedInterval = {
	callback: () => void;
	intervalMs?: number;
	id: number;
};

type CapturedTimeout = {
	callback: () => void;
	timeoutMs?: number;
	id: number;
};

type TimerHarness = ReturnType<typeof createTimerHarness>;

const confirmEvent = createInputEvent(INPUT_ACTIONS.confirm);

function createInputEvent(
	action: InputEvent['action'],
	overrides: Partial<Pick<InputEvent, 'at' | 'repeat' | 'phase'>> = {}
): InputEvent {
	return {
		action,
		source: INPUT_SOURCES.keyboard,
		at: EVENT_AT_MS,
		repeat: false,
		...overrides
	};
}

function createTimerHarness() {
	const intervals: CapturedInterval[] = [];
	const timeouts: CapturedTimeout[] = [];
	const clearIntervalFn = vi.fn();
	const clearTimeoutFn = vi.fn();
	let nextTimerId = 1;

	return {
		intervals,
		timeouts,
		clearIntervalFn,
		clearTimeoutFn,
		setIntervalFn: vi.fn((callback: () => void, intervalMs?: number) => {
			const id = nextTimerId++;
			intervals.push({ callback, intervalMs, id });
			return id;
		}) as never,
		setTimeoutFn: vi.fn((callback: () => void, timeoutMs?: number) => {
			const id = nextTimerId++;
			timeouts.push({ callback, timeoutMs, id });
			return id;
		}) as never
	};
}

function createRepeatingStack(
	handleInput = vi.fn(),
	timerHarness: TimerHarness = createTimerHarness()
) {
	return {
		timerHarness,
		handleInput,
		stack: createInputSurfaceStack(
			{
				id: SURFACE_IDS.home,
				handleInput,
				shouldRepeatInput: () => true
			},
			{
				repeatInitialDelayMs: TEST_REPEAT_INITIAL_DELAY_MS,
				normalRepeatIntervalMs: TEST_NORMAL_REPEAT_INTERVAL_MS,
				fastRepeatHoldMs: TEST_FAST_REPEAT_HOLD_MS,
				fastRepeatIntervalMs: TEST_FAST_REPEAT_INTERVAL_MS,
				releaseGraceMs: TEST_RELEASE_GRACE_MS,
				setIntervalFn: timerHarness.setIntervalFn,
				clearIntervalFn: timerHarness.clearIntervalFn as never,
				setTimeoutFn: timerHarness.setTimeoutFn,
				clearTimeoutFn: timerHarness.clearTimeoutFn as never
			}
		)
	};
}

function findTimeout(timerHarness: TimerHarness, timeoutMs: number) {
	return timerHarness.timeouts.find((timeout) => timeout.timeoutMs === timeoutMs);
}

function findInterval(timerHarness: TimerHarness, intervalMs: number) {
	return timerHarness.intervals.find((interval) => interval.intervalMs === intervalMs);
}

describe('createInputSurfaceStack', () => {
	it('dispatches input to the active surface and restores the previous surface when removed', () => {
		const homeInput = vi.fn();
		const paneInput = vi.fn();
		const stack = createInputSurfaceStack({
			id: SURFACE_IDS.home,
			handleInput: homeInput
		});

		stack.dispatch(confirmEvent);
		stack.push({
			id: SURFACE_IDS.coverPicker,
			handleInput: paneInput
		});
		stack.dispatch(confirmEvent);
		stack.remove(SURFACE_IDS.coverPicker);
		stack.dispatch(confirmEvent);

		expect(homeInput).toHaveBeenCalledTimes(TWICE);
		expect(paneInput).toHaveBeenCalledTimes(ONCE);
		expect(stack.activeSurfaceId).toBe(SURFACE_IDS.home);
	});

	it('replaces an existing surface with the same id', () => {
		const firstPaneInput = vi.fn();
		const secondPaneInput = vi.fn();
		const stack = createInputSurfaceStack({
			id: SURFACE_IDS.home,
			handleInput: vi.fn()
		});

		stack.push({
			id: SURFACE_IDS.coverPicker,
			handleInput: firstPaneInput
		});
		stack.push({
			id: SURFACE_IDS.coverPicker,
			handleInput: secondPaneInput
		});
		stack.dispatch(confirmEvent);

		expect(firstPaneInput).not.toHaveBeenCalled();
		expect(secondPaneInput).toHaveBeenCalledTimes(ONCE);
		expect(stack.activeSurfaceId).toBe(SURFACE_IDS.coverPicker);
	});

	it('uses one-step global repeat timing for held directional input', () => {
		const { stack, handleInput, timerHarness } = createRepeatingStack();

		stack.dispatch(createInputEvent(INPUT_ACTIONS.moveRight));
		findTimeout(timerHarness, TEST_REPEAT_INITIAL_DELAY_MS)?.callback();
		findInterval(timerHarness, TEST_NORMAL_REPEAT_INTERVAL_MS)?.callback();

		expect(handleInput).toHaveBeenCalledTimes(THREE_TIMES);
		expect(handleInput).toHaveBeenNthCalledWith(
			FIRST_CALL,
			expect.objectContaining({ action: INPUT_ACTIONS.moveRight, repeat: false })
		);
		expect(handleInput).toHaveBeenNthCalledWith(
			SECOND_CALL,
			expect.objectContaining({
				action: INPUT_ACTIONS.moveRight,
				repeat: true,
				phase: INPUT_PHASES.press
			})
		);
		expect(handleInput).toHaveBeenNthCalledWith(
			THIRD_CALL,
			expect.objectContaining({
				action: INPUT_ACTIONS.moveRight,
				repeat: true,
				phase: INPUT_PHASES.press
			})
		);
	});

	it('switches held directional input from normal repeat to fast repeat', () => {
		const { stack, handleInput, timerHarness } = createRepeatingStack();

		stack.dispatch(createInputEvent(INPUT_ACTIONS.moveRight));
		findTimeout(timerHarness, TEST_REPEAT_INITIAL_DELAY_MS)?.callback();
		const normalInterval = findInterval(timerHarness, TEST_NORMAL_REPEAT_INTERVAL_MS);
		normalInterval?.callback();
		findTimeout(timerHarness, TEST_FAST_REPEAT_HOLD_MS)?.callback();
		findInterval(timerHarness, TEST_FAST_REPEAT_INTERVAL_MS)?.callback();
		findInterval(timerHarness, TEST_FAST_REPEAT_INTERVAL_MS)?.callback();

		expect(handleInput).toHaveBeenCalledTimes(5);
		expect(timerHarness.clearIntervalFn).toHaveBeenCalledWith(normalInterval?.id);
	});

	it('uses a longer default hold threshold before switching to fast repeat', () => {
		const timerHarness = createTimerHarness();
		const stack = createInputSurfaceStack(
			{
				id: SURFACE_IDS.home,
				handleInput: vi.fn(),
				shouldRepeatInput: () => true
			},
			{
				setIntervalFn: timerHarness.setIntervalFn,
				clearIntervalFn: timerHarness.clearIntervalFn as never,
				setTimeoutFn: timerHarness.setTimeoutFn,
				clearTimeoutFn: timerHarness.clearTimeoutFn as never
			}
		);

		stack.dispatch(createInputEvent(INPUT_ACTIONS.moveRight));

		expect(findTimeout(timerHarness, DEFAULT_FAST_REPEAT_HOLD_MS)).toBeDefined();
	});

	it('does not let native keyboard repeat dispatch extra moves while global repeat owns the hold', () => {
		const { stack, handleInput, timerHarness } = createRepeatingStack();

		stack.dispatch(createInputEvent(INPUT_ACTIONS.moveRight));
		stack.dispatch(createInputEvent(INPUT_ACTIONS.moveRight, { at: 300, repeat: true }));
		stack.dispatch(createInputEvent(INPUT_ACTIONS.moveRight, { at: 360, repeat: true }));

		expect(handleInput).toHaveBeenCalledTimes(ONCE);
		expect(timerHarness.clearTimeoutFn).toHaveBeenCalledWith(
			findTimeout(timerHarness, TEST_RELEASE_GRACE_MS)?.id
		);
	});

	it('stops repeat immediately when the held direction is released', () => {
		const { stack, handleInput, timerHarness } = createRepeatingStack();

		stack.dispatch(createInputEvent(INPUT_ACTIONS.moveRight));
		findTimeout(timerHarness, TEST_REPEAT_INITIAL_DELAY_MS)?.callback();
		const normalInterval = findInterval(timerHarness, TEST_NORMAL_REPEAT_INTERVAL_MS);
		stack.dispatch(createInputEvent(INPUT_ACTIONS.moveRight, { phase: INPUT_PHASES.release }));
		normalInterval?.callback();

		expect(handleInput).toHaveBeenCalledTimes(TWICE);
		expect(timerHarness.clearIntervalFn).toHaveBeenCalledWith(normalInterval?.id);
	});

	it('ignores non-directional release events instead of forwarding them to the active surface', () => {
		const handleInput = vi.fn();
		const stack = createInputSurfaceStack({
			id: SURFACE_IDS.home,
			handleInput
		});

		stack.dispatch(createInputEvent(INPUT_ACTIONS.confirm, { phase: INPUT_PHASES.release }));
		stack.dispatch(createInputEvent(INPUT_ACTIONS.cancel, { phase: INPUT_PHASES.release }));

		expect(handleInput).not.toHaveBeenCalled();
	});

	it('stops repeat when native repeat events stop arriving without a release event', () => {
		const { stack, handleInput, timerHarness } = createRepeatingStack();

		stack.dispatch(createInputEvent(INPUT_ACTIONS.moveRight));
		stack.dispatch(createInputEvent(INPUT_ACTIONS.moveRight, { at: 300, repeat: true }));
		findTimeout(timerHarness, TEST_RELEASE_GRACE_MS)?.callback();
		findTimeout(timerHarness, TEST_REPEAT_INITIAL_DELAY_MS)?.callback();

		expect(handleInput).toHaveBeenCalledTimes(ONCE);
	});

	it('clears repeat state when a non-directional input interrupts the hold', () => {
		const { stack, handleInput, timerHarness } = createRepeatingStack();

		stack.dispatch(createInputEvent(INPUT_ACTIONS.moveRight));
		findTimeout(timerHarness, TEST_REPEAT_INITIAL_DELAY_MS)?.callback();
		const normalInterval = findInterval(timerHarness, TEST_NORMAL_REPEAT_INTERVAL_MS);
		stack.dispatch(createInputEvent(INPUT_ACTIONS.confirm));
		normalInterval?.callback();

		expect(handleInput).toHaveBeenCalledTimes(THREE_TIMES);
		expect(handleInput).toHaveBeenLastCalledWith(
			expect.objectContaining({ action: INPUT_ACTIONS.confirm })
		);
		expect(timerHarness.clearIntervalFn).toHaveBeenCalledWith(normalInterval?.id);
	});

	it('bypasses repeat timing for surfaces that do not opt in', () => {
		const timerHarness = createTimerHarness();
		const handleInput = vi.fn();
		const stack = createInputSurfaceStack(
			{
				id: SURFACE_IDS.home,
				handleInput,
				shouldRepeatInput: () => false
			},
			{
				setIntervalFn: timerHarness.setIntervalFn,
				clearIntervalFn: timerHarness.clearIntervalFn as never,
				setTimeoutFn: timerHarness.setTimeoutFn,
				clearTimeoutFn: timerHarness.clearTimeoutFn as never
			}
		);

		stack.dispatch(createInputEvent(INPUT_ACTIONS.moveRight));
		stack.dispatch(createInputEvent(INPUT_ACTIONS.moveRight, { repeat: true }));

		expect(handleInput).toHaveBeenCalledTimes(TWICE);
		expect(timerHarness.setIntervalFn).not.toHaveBeenCalled();
		expect(timerHarness.setTimeoutFn).not.toHaveBeenCalled();
	});

	it('clears held repeat when the active surface changes', () => {
		const { stack, handleInput, timerHarness } = createRepeatingStack();
		const paneSurface: InputSurface = {
			id: SURFACE_IDS.coverPicker,
			handleInput: vi.fn(),
			shouldRepeatInput: () => true
		};

		stack.dispatch(createInputEvent(INPUT_ACTIONS.moveRight));
		stack.push(paneSurface);
		findTimeout(timerHarness, TEST_REPEAT_INITIAL_DELAY_MS)?.callback();

		expect(handleInput).toHaveBeenCalledTimes(ONCE);
		expect(timerHarness.clearTimeoutFn).toHaveBeenCalled();
	});
});
