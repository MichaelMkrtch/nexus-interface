<script lang="ts">
	interface CoverActionMenuProps {
		focusedOptionIndex?: number;
		onUpdateCover?: () => void;
		onUpdateBackground?: () => void;
	}

	let {
		focusedOptionIndex = 0,
		onUpdateCover,
		onUpdateBackground
	}: CoverActionMenuProps = $props();

	const MENU_OPTIONS = {
		updateCover: 0,
		updateBackground: 1
	} as const;
</script>

<div class="cover-action-menu" role="menu" aria-label="Game cover options">
	<div
		class={[
			'cover-action-menu-item-frame',
			focusedOptionIndex === MENU_OPTIONS.updateCover && 'is-focused'
		]}
	>
		{#if focusedOptionIndex === MENU_OPTIONS.updateCover}
			<span class="cover-action-menu-item-border selection-gradient-border"></span>
		{/if}

		<button
			class={[
				'cover-action-menu-item',
				focusedOptionIndex === MENU_OPTIONS.updateCover && 'selection-highlight-sweep'
			]}
			type="button"
			role="menuitem"
			aria-current={focusedOptionIndex === MENU_OPTIONS.updateCover ? 'true' : undefined}
			tabindex="-1"
			onclick={onUpdateCover}
		>
			Update cover image
		</button>
	</div>

	<div
		class={[
			'cover-action-menu-item-frame',
			focusedOptionIndex === MENU_OPTIONS.updateBackground && 'is-focused'
		]}
	>
		{#if focusedOptionIndex === MENU_OPTIONS.updateBackground}
			<span class="cover-action-menu-item-border selection-gradient-border"></span>
		{/if}

		<button
			class={[
				'cover-action-menu-item',
				focusedOptionIndex === MENU_OPTIONS.updateBackground && 'selection-highlight-sweep'
			]}
			type="button"
			role="menuitem"
			aria-current={focusedOptionIndex === MENU_OPTIONS.updateBackground ? 'true' : undefined}
			tabindex="-1"
			onclick={onUpdateBackground}
		>
			Update background image
		</button>
	</div>
</div>

<style>
	.cover-action-menu {
		--window-background: rgb(128 128 128 / 0.4);

		position: absolute;
		top: var(--cover-action-menu-top, 0);
		left: calc(
			100% + var(--cover-action-menu-inline-offset, 0px) + var(--cover-action-menu-gap, 1rem)
		);
		z-index: 45;
		min-width: 15rem;
		display: flex;
		flex-direction: column;
		gap: 0.2rem;
		padding: 0.45rem;
		border: 1px solid rgb(255 255 255 / 0.16);
		border-radius: 0.65rem;
		background: var(--window-background);
		box-shadow: 0 1rem 2.5rem rgb(0 0 0 / 0.34);
		backdrop-filter: blur(20px);
		animation: cover-action-menu-enter 120ms ease-out both;
	}

	.cover-action-menu-item-frame {
		--selection-gradient-border-radius: 0.45rem;
		--selection-gradient-border-width: 2px;

		position: relative;
		padding: 3px;
		border-radius: 0.45rem;
	}

	.cover-action-menu-item {
		position: relative;
		z-index: 1;
		width: 100%;
		min-height: 3.25rem;
		padding: 0.5rem 1rem;
		border-radius: 0.32rem;
		background: transparent;
		color: rgb(255 255 255 / 0.9);
		font-size: 1rem;
		font-weight: 600;
		text-align: left;
	}

	.cover-action-menu-item:focus-visible {
		outline: 3px solid rgb(255 255 255 / 0.85);
		outline-offset: 4px;
	}

	@keyframes cover-action-menu-enter {
		from {
			opacity: 0;
			transform: translate3d(-0.35rem, 0, 0);
		}

		to {
			opacity: 1;
			transform: translate3d(0, 0, 0);
		}
	}

	.cover-action-menu-item-border {
		z-index: 0;
	}
</style>
