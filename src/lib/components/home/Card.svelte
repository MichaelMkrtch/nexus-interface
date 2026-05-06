<script lang="ts">
	import type { Game } from '$lib/features/games/types';

	interface CardProps {
		game: Game;
		isActive?: boolean;
		isFocused?: boolean;
		align?: 'center' | 'start';
	}

	let { game, isActive = false, isFocused = false, align = 'center' }: CardProps = $props();
</script>

<div
	class={[
		'game-card',
		isActive && 'is-active',
		isFocused && 'is-focused',
		align === 'start' && 'align-start'
	]}
>
	{#if isFocused}
		<div class="active-card-border pointer-events-none absolute"></div>
	{/if}

	<button class="game-card-button" aria-label={game.title} data-game-cover>
		<img src={game.cover} alt={game.title} class="size-full object-cover" draggable="false" />
	</button>
</div>

<style>
	@property --game-card-border-angle {
		syntax: '<angle>';
		inherits: false;
		initial-value: 0deg;
	}

	.game-card {
		--game-card-size: 11rem;
		--game-card-frame-padding: 5px;
		--game-card-border-width: 3px;
		--game-card-border-radius: 28px;
		--game-card-cover-radius: 24px;
		--game-card-border-angle: 0deg;
		--game-card-border-reveal-end: 0;
		--game-card-border-reveal-duration: 200ms;
		--game-card-border-reveal-scale: 0.95;
		--game-card-inactive-scale: 0.625;
		--game-card-focus-ease: cubic-bezier(0.37, 0, 0.63, 1);

		position: relative;
		display: flex;
		align-items: flex-start;
		justify-content: center;
		width: var(--game-card-size);
		height: var(--game-card-size);
		padding: var(--game-card-frame-padding);
	}

	.game-card-button {
		position: relative;
		z-index: 10;
		display: block;
		width: 100%;
		height: 100%;
		padding: 0;
		overflow: hidden;
		border-radius: var(--game-card-cover-radius);
		transform-origin: 50% 10%;
		transform: scale(var(--game-card-inactive-scale));
		transition: transform 100ms var(--game-card-focus-ease);
		will-change: transform;
	}

	.game-card.align-start .game-card-button {
		transform-origin: 0 0;
	}

	.game-card-button::after {
		content: '';
		position: absolute;
		inset: -75%;
		pointer-events: none;
		opacity: 0;
		background: linear-gradient(
			115deg,
			transparent 18%,
			rgb(255 255 255 / 0.05) 35%,
			rgb(255 255 255 / 0.3) 50%,
			rgb(255 255 255 / 0.07) 65%,
			transparent 82%
		);
		transform: translateX(-95%) rotate(4deg);
	}

	.game-card.is-active .game-card-button {
		transform: scale(1);
	}

	.game-card.is-focused .game-card-button::after {
		animation: active-card-shine 4500ms linear 2000ms infinite;
	}

	.active-card-border {
		z-index: 0;
		inset: var(--game-card-border-reveal-end);
		border-radius: var(--game-card-border-radius);
		padding: var(--game-card-border-width);
		background: conic-gradient(
			from var(--game-card-border-angle),
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
			active-card-border-in var(--game-card-border-reveal-duration) ease-out both,
			active-card-border-spin 4000ms linear infinite;
	}

	@keyframes active-card-border-in {
		from {
			opacity: 0;
			transform: scale(var(--game-card-border-reveal-scale));
		}

		to {
			opacity: 1;
			transform: scale(1);
		}
	}

	@keyframes active-card-border-spin {
		to {
			--game-card-border-angle: 360deg;
		}
	}

	@keyframes active-card-shine {
		0% {
			opacity: 1;
			transform: translateX(-95%) rotate(4deg);
		}

		13.333% {
			opacity: 1;
			transform: translateX(95%) rotate(4deg);
		}

		20%,
		100% {
			opacity: 0;
			transform: translateX(95%) rotate(4deg);
		}
	}
</style>
