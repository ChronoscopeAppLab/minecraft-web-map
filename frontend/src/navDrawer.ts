export default class NavDrawer {
    menu: HTMLElement;
    back: HTMLElement;

    attach(opener: HTMLElement, menu: HTMLElement, back: HTMLElement) {
        this.menu = menu;
        this.back = back;

        opener.addEventListener('click', this.show.bind(this));
        back.addEventListener('click', this.hide.bind(this));
    }

    show() {
        this.back.classList.remove('hidden');
        this.menu.classList.remove('hidden');
    }

    hide() {
        this.back.classList.add('hidden');
        this.menu.classList.add('hidden');
    }
}
