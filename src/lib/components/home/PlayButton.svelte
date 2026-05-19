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
	{#if isFocused}
		<span class="play-button-border selection-gradient-border"></span>
	{/if}

	<button
		class={['play-button', isFocused && 'selection-highlight-sweep']}
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
	.play-button-shell {
		--play-button-gap: 5px;
		--play-button-border-width: 3px;
		--play-button-border-reveal-end: 0;
		--selection-gradient-border-inset: var(--play-button-border-reveal-end);
		--selection-gradient-border-radius: 9999px;
		--selection-gradient-border-width: var(--play-button-border-width);

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

	.play-button-shell.is-focused .play-button {
		background: #fff;
		color: #282828;
		outline: none;
	}

	.play-button-border {
		z-index: 0;
	}
</style>
