<script lang="ts">
	interface PlayButtonProps {
		label?: string;
		isFocused?: boolean;
		onPress?: () => void;
		onConfirm?: () => void;
	}

	let { label = 'Play Game', isFocused = false, onPress, onConfirm }: PlayButtonProps = $props();
</script>

<div class={['play-button-shell', isFocused && 'is-focused']}>
	<button
		class="play-button"
		type="button"
		tabindex="-1"
		aria-current={isFocused ? 'true' : undefined}
		onpointerdown={onPress}
		onclick={onConfirm}
	>
		{label}
	</button>
</div>

<style>
	@property --play-button-border-angle {
		syntax: '<angle>';
		inherits: false;
		initial-value: 0deg;
	}

	.play-button-shell {
		--play-button-gap: 5px;
		--play-button-border-width: 3px;
		--play-button-border-reveal-end: 0;
		--play-button-border-reveal-duration: 100ms;
		--play-button-border-reveal-scale: 0.95;
		--play-button-border-angle: 0deg;

		position: relative;
		display: inline-flex;
		padding: var(--play-button-gap);
	}

	.play-button {
		position: relative;
		z-index: 10;
		min-width: 300px;
		height: 70px;
		padding-inline: 56px;
		border-radius: 9999px;
		background: #80808040;
		color: white;
		font-size: 30px;
		font-weight: 700;
		transition:
			background-color 150ms ease,
			color 150ms ease;
	}

	.play-button-shell.is-focused .play-button,
	.play-button:hover {
		background: #fff;
		color: #282828;
		outline: none;
	}

	.play-button-shell.is-focused::before {
		content: '';
		position: absolute;
		z-index: 0;
		inset: var(--play-button-border-reveal-end);
		border-radius: 9999px;
		padding: var(--play-button-border-width);
		background: conic-gradient(
			from var(--play-button-border-angle),
			oklch(81.1% 0.111 293.571),
			oklch(83.7% 0.128 66.29),
			oklch(81.1% 0.111 293.571)
		);
		mask:
			linear-gradient(#000 0 0) content-box,
			linear-gradient(#000 0 0);
		mask-composite: exclude;
		-webkit-mask:
			linear-gradient(#000 0 0) content-box,
			linear-gradient(#000 0 0);
		-webkit-mask-composite: xor;
		transform-origin: center;
		will-change: transform, opacity;
		animation:
			play-button-border-in var(--play-button-border-reveal-duration) ease-out 100ms both,
			play-button-border-spin 4000ms linear infinite;
	}

	@keyframes play-button-border-in {
		from {
			opacity: 0;
			transform: scale(var(--play-button-border-reveal-scale));
		}

		to {
			opacity: 1;
			transform: scale(1);
		}
	}

	@keyframes play-button-border-spin {
		to {
			--play-button-border-angle: 360deg;
		}
	}
</style>
