let networkErrorDisplayed: boolean = false;

export function show() {
    if (networkErrorDisplayed) return;

    document.getElementById('error-bar').classList.remove('hidden');
}
