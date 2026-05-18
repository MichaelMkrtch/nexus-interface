<script lang="ts">
	import ImageOff from '@lucide/svelte/icons/image-off';

	interface MissingArtworkProps {
		title: string;
		variant?: 'cover' | 'hero';
	}

	let { title, variant = 'cover' }: MissingArtworkProps = $props();
</script>

<div class={['missing-artwork', `missing-artwork-${variant}`]} data-missing-artwork={variant}>
	<ImageOff aria-hidden="true" class="missing-artwork-icon" />
	<div class="missing-artwork-copy">
		<span class="missing-artwork-label">Artwork missing</span>
		<span class="missing-artwork-title">{title}</span>
	</div>
</div>

<style>
	.missing-artwork {
		position: relative;
		display: flex;
		width: 100%;
		height: 100%;
		overflow: hidden;
		background:
			linear-gradient(135deg, rgb(255 255 255 / 0.1), rgb(255 255 255 / 0.025)), rgb(20 22 26);
		color: rgb(255 255 255 / 0.8);
	}

	.missing-artwork-cover {
		align-items: center;
		justify-content: center;
		flex-direction: column;
		gap: 0.55rem;
		padding: 1rem;
		text-align: center;
	}

	.missing-artwork-hero {
		align-items: flex-end;
		justify-content: flex-start;
		padding: 0 0 9rem 11rem;
		text-align: left;
	}

	.missing-artwork-icon {
		width: 1.6rem;
		height: 1.6rem;
		opacity: 0.72;
	}

	.missing-artwork-copy {
		display: flex;
		min-width: 0;
		flex-direction: column;
		gap: 0.2rem;
	}

	.missing-artwork-label {
		color: rgb(255 255 255 / 0.58);
		font-size: 0.68rem;
		font-weight: 700;
		letter-spacing: 0.08em;
		line-height: 1.2;
		text-transform: uppercase;
	}

	.missing-artwork-title {
		display: -webkit-box;
		overflow: hidden;
		-webkit-box-orient: vertical;
		-webkit-line-clamp: 2;
		line-clamp: 2;
		color: rgb(255 255 255 / 0.82);
		font-size: 0.78rem;
		font-weight: 700;
		line-height: 1.25;
	}

	.missing-artwork-hero .missing-artwork-title {
		max-width: 28rem;
		font-size: 1.35rem;
	}
</style>
