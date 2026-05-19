import type { InputEvent } from '$lib/input/contracts';
import type { HomeNav } from './home-navigation.svelte';

import { INPUT_ACTIONS } from '$lib/input/contracts';
import { HOME_MOVE_DIRECTIONS } from './home-navigation.svelte';

type HomeInputHandlerOptions = {
	navigation: HomeNav;
};

export function createHomeInputHandler({ navigation }: HomeInputHandlerOptions) {
	return (event: InputEvent) => {
		switch (event.action) {
			case INPUT_ACTIONS.moveLeft:
				navigation.move(HOME_MOVE_DIRECTIONS.left);
				break;
			case INPUT_ACTIONS.moveRight:
				navigation.move(HOME_MOVE_DIRECTIONS.right);
				break;
			case INPUT_ACTIONS.moveUp:
				navigation.move(HOME_MOVE_DIRECTIONS.up);
				break;
			case INPUT_ACTIONS.moveDown:
				navigation.move(HOME_MOVE_DIRECTIONS.down);
				break;
			case INPUT_ACTIONS.confirm:
				navigation.confirm();
				break;
		}
	};
}
