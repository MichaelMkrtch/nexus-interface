<script lang="ts">
	import { HOME_RAIL_CARD_SIZE_REM, HOME_RAIL_LIBRARY_TITLE } from '$lib/features/home/home-rail';

	const PS5ISH_MORE_GAMES_ICON_SRC = '/ps5ish/MoreGames.png';

	interface LibraryCardProps {
		index: number;
		isActive?: boolean;
		isFocused?: boolean;
		isResting?: boolean;
		align?: 'center' | 'start';
		onPress?: (index: number) => void;
	}

	let {
		index,
		isActive = false,
		isFocused = false,
		isResting = false,
		align = 'center',
		onPress
	}: LibraryCardProps = $props();

	function handlePointerDown() {
		onPress?.(index);
	}
</script>

<div
	class={[
		'artwork-card-frame',
		'library-card',
		isActive && 'is-active',
		isResting && 'is-resting',
		isFocused && 'is-focused',
		align === 'start' && 'align-start'
	]}
	style:--artwork-card-size={`${HOME_RAIL_CARD_SIZE_REM}rem`}
>
	{#if isFocused}
		<div class="library-card-border selection-gradient-border"></div>
	{/if}

	<button
		class={[
			'artwork-card-surface',
			'library-card-button',
			isFocused && 'selection-highlight-sweep'
		]}
		type="button"
		tabindex="-1"
		aria-label={HOME_RAIL_LIBRARY_TITLE}
		data-library-card
		onpointerdown={handlePointerDown}
	>
		<img
			src={PS5ISH_MORE_GAMES_ICON_SRC}
			alt=""
			class="library-card-icon"
			decoding="async"
			draggable="false"
		/>
	</button>
</div>

<style>
	.library-card {
		--artwork-card-frame-padding: 5px;
		--artwork-card-border-width: 3px;
		--artwork-card-border-radius: 28px;
		--artwork-card-cover-radius: 20px;
		--artwork-card-border-reveal-end: 0;
		--artwork-card-inactive-scale: 0.625;
		--artwork-card-focus-ease: cubic-bezier(0.37, 0, 0.63, 1);
	}

	.library-card-border {
		z-index: 0;
	}

	.library-card-button {
		display: grid;
		place-items: center;
		background: rgb(16 1 0 / 0.5);
	}

	.library-card-icon {
		width: 100%;
		height: 100%;
		object-fit: contain;
		user-select: none;
	}

	.library-card.is-resting .library-card-button {
		transform: scale(var(--artwork-card-inactive-scale));
	}
</style>
