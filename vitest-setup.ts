import '@testing-library/jest-dom/vitest';

Object.defineProperty(window, 'matchMedia', {
	writable: true,
	value: (query: string) => ({
		matches: false,
		media: query,
		onchange: null,
		addEventListener: () => undefined,
		removeEventListener: () => undefined,
		addListener: () => undefined,
		removeListener: () => undefined,
		dispatchEvent: () => false
	})
});

class MockIntersectionObserver {
	observe() {
		return undefined;
	}

	unobserve() {
		return undefined;
	}

	disconnect() {
		return undefined;
	}

	takeRecords() {
		return [];
	}
}

class MockResizeObserver {
	observe() {
		return undefined;
	}

	unobserve() {
		return undefined;
	}

	disconnect() {
		return undefined;
	}
}

Object.defineProperty(window, 'IntersectionObserver', {
	writable: true,
	value: MockIntersectionObserver
});

Object.defineProperty(globalThis, 'IntersectionObserver', {
	writable: true,
	value: MockIntersectionObserver
});

Object.defineProperty(window, 'ResizeObserver', {
	writable: true,
	value: MockResizeObserver
});

Object.defineProperty(globalThis, 'ResizeObserver', {
	writable: true,
	value: MockResizeObserver
});
