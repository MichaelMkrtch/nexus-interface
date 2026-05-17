import type { InputEvent } from '$lib/input/contracts';
import type { HomeNav } from './home-navigation.svelte';

import { INPUT_ACTIONS } from '$lib/input/contracts';

type HomeInputHandlerOptions = {
	navigation: HomeNav;
};

export function createHomeInputHandler({ navigation }: HomeInputHandlerOptions) {
	return (event: InputEvent) => {
		switch (event.action) {
			case INPUT_ACTIONS.moveLeft:
				navigation.move('left');
				break;
			case INPUT_ACTIONS.moveRight:
				navigation.move('right');
				break;
			case INPUT_ACTIONS.moveUp:
				navigation.move('up');
				break;
			case INPUT_ACTIONS.moveDown:
				navigation.move('down');
				break;
			case INPUT_ACTIONS.confirm:
				navigation.confirm();
				break;
		}
	};
}
