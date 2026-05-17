import { fireEvent, render, screen } from '@testing-library/svelte';
import { readFileSync } from 'node:fs';
import { describe, expect, it, vi } from 'vitest';

import PlayButton from './PlayButton.svelte';

describe('PlayButton', () => {
	it('renders its default label and focused accessibility state', () => {
		render(PlayButton, { props: { isFocused: true } });

		const button = screen.getByRole('button', { name: 'Play Game' });
		expect(button).toHaveAttribute('aria-current', 'true');
		expect(button.parentElement).toHaveClass('play-button-shell', 'is-focused');
	});

	it('renders a custom label and forwards pointer and click interactions', async () => {
		const onPress = vi.fn();
		const onConfirm = vi.fn();

		render(PlayButton, {
			props: {
				label: 'Resume',
				onPress,
				onConfirm
			}
		});

		const button = screen.getByRole('button', { name: 'Resume' });
		await fireEvent.pointerDown(button);
		await fireEvent.click(button);

		expect(onPress).toHaveBeenCalledTimes(1);
		expect(onConfirm).toHaveBeenCalledTimes(1);
		expect(button).not.toHaveAttribute('aria-current');
	});

	it('does not define mouse-hover styling for the play button', () => {
		const source = readFileSync(
			'/Users/michael/Developer/Projects/nexus/interface/src/lib/components/home/PlayButton.svelte',
			'utf8'
		);

		expect(source).not.toContain('.play-button:hover');
	});
});
