<script lang="ts">
	import type { Game } from '$lib/features/games/types';

	interface CardProps {
		game: Game;
		isActive?: boolean;
	}

	let { game, isActive = false }: CardProps = $props();
</script>

<div class={['game-card', isActive && 'is-active']}>
	{#if isActive}
		<div class="active-card-border pointer-events-none absolute"></div>
	{/if}

	<button class="game-card-button" aria-label={game.title}>
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
		transform-origin: top;
		transform: scale(0.74);
		background: linear-gradient(to bottom right, #ef4444, #fef08a);
		transition: transform 200ms ease-out;
	}

	.game-card.is-active .game-card-button {
		transform: scale(1);
	}

	.active-card-border {
		z-index: 0;
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
		animation:
			active-card-border-in 150ms ease-out 190ms both,
			active-card-border-spin 8000ms linear 180ms infinite;
	}

	@keyframes active-card-border-in {
		from {
			inset: 4px;
			opacity: 0;
		}

		to {
			inset: 0;
			opacity: 1;
		}
	}

	@keyframes active-card-border-spin {
		to {
			--game-card-border-angle: 360deg;
		}
	}
</style>
