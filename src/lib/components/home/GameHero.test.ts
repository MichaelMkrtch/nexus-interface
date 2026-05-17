import { render } from '@testing-library/svelte';
import { tick } from 'svelte';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { mockGames } from '$lib/features/games/mock-games';

import GameHero, { resetHeroPreloadCache } from './GameHero.svelte';

function createDeferred<T>() {
	let resolve!: (value: T | PromiseLike<T>) => void;
	const promise = new Promise<T>((resolver) => {
		resolve = resolver;
	});

	return { promise, resolve };
}

function getRenderedHeroSources(container: HTMLElement) {
	return Array.from(container.querySelectorAll('.game-hero-image')).map((image) =>
		image.getAttribute('src')
	);
}

describe('GameHero', () => {
	const originalImage = globalThis.Image;
	const originalRequestAnimationFrame = window.requestAnimationFrame;
	const originalCancelAnimationFrame = window.cancelAnimationFrame;
	const decodeDeferreds = new Map<string, ReturnType<typeof createDeferred<void>>>();

	class MockImage {
		decoding = 'auto';
		src = '';

		decode() {
			let deferred = decodeDeferreds.get(this.src);
			if (!deferred) {
				deferred = createDeferred<void>();
				decodeDeferreds.set(this.src, deferred);
			}

			return deferred.promise;
		}
	}

	function resolveDecode(src: string) {
		let deferred = decodeDeferreds.get(src);
		if (!deferred) {
			deferred = createDeferred<void>();
			decodeDeferreds.set(src, deferred);
		}

		deferred.resolve();
	}

	beforeEach(() => {
		decodeDeferreds.clear();
		resetHeroPreloadCache();
		vi.useFakeTimers();

		Object.defineProperty(globalThis, 'Image', {
			configurable: true,
			writable: true,
			value: MockImage
		});

		Object.defineProperty(window, 'Image', {
			configurable: true,
			writable: true,
			value: MockImage
		});

		Object.defineProperty(window, 'requestAnimationFrame', {
			configurable: true,
			writable: true,
			value: (callback: FrameRequestCallback) =>
				window.setTimeout(() => callback(performance.now()), 16)
		});

		Object.defineProperty(window, 'cancelAnimationFrame', {
			configurable: true,
			writable: true,
			value: (frame: number) => window.clearTimeout(frame)
		});
	});

	afterEach(() => {
		vi.useRealTimers();
		resetHeroPreloadCache();

		Object.defineProperty(globalThis, 'Image', {
			configurable: true,
			writable: true,
			value: originalImage
		});

		Object.defineProperty(window, 'Image', {
			configurable: true,
			writable: true,
			value: originalImage
		});

		Object.defineProperty(window, 'requestAnimationFrame', {
			configurable: true,
			writable: true,
			value: originalRequestAnimationFrame
		});

		Object.defineProperty(window, 'cancelAnimationFrame', {
			configurable: true,
			writable: true,
			value: originalCancelAnimationFrame
		});
	});

	it('renders the focused game hero immediately on first paint', () => {
		const { container } = render(GameHero, {
			props: {
				games: mockGames,
				focusedIndex: 2
			}
		});

		expect(getRenderedHeroSources(container)).toContain(mockGames[2]?.hero);
	});

	it('waits for the next hero image to decode before swapping layers', async () => {
		const { container, rerender } = render(GameHero, {
			props: {
				games: mockGames,
				focusedIndex: 0
			}
		});

		resolveDecode(mockGames[0]?.hero ?? '');

		await rerender({
			games: mockGames,
			focusedIndex: 1
		});

		expect(getRenderedHeroSources(container)).toContain(mockGames[0]?.hero);
		expect(getRenderedHeroSources(container)).not.toContain(mockGames[1]?.hero);

		await vi.advanceTimersByTimeAsync(275);

		expect(getRenderedHeroSources(container)).toContain(mockGames[0]?.hero);
		expect(getRenderedHeroSources(container)).not.toContain(mockGames[1]?.hero);

		resolveDecode(mockGames[1]?.hero ?? '');
		await Promise.resolve();
		await vi.advanceTimersByTimeAsync(16);
		await tick();

		expect(getRenderedHeroSources(container)).toContain(mockGames[1]?.hero);
	});

	it('ignores stale decoded heroes when focus changes again mid-transition', async () => {
		const { container, rerender } = render(GameHero, {
			props: {
				games: mockGames,
				focusedIndex: 0
			}
		});

		await rerender({
			games: mockGames,
			focusedIndex: 1
		});

		await vi.advanceTimersByTimeAsync(275);

		await rerender({
			games: mockGames,
			focusedIndex: 2
		});

		resolveDecode(mockGames[1]?.hero ?? '');
		await Promise.resolve();
		await vi.advanceTimersByTimeAsync(16);
		await tick();

		expect(getRenderedHeroSources(container)).toContain(mockGames[0]?.hero);
		expect(getRenderedHeroSources(container)).not.toContain(mockGames[1]?.hero);

		await vi.advanceTimersByTimeAsync(275);
		resolveDecode(mockGames[2]?.hero ?? '');
		await Promise.resolve();
		await vi.advanceTimersByTimeAsync(16);
		await tick();

		expect(getRenderedHeroSources(container)).toContain(mockGames[2]?.hero);
		expect(getRenderedHeroSources(container)).not.toContain(mockGames[1]?.hero);
	});
});
