// Copyright (C) 2021 Chronoscope. All rights reserved.

let networkErrorDisplayed: boolean = false;

export function show() {
    if (networkErrorDisplayed) return;

    document.getElementById('error-bar').classList.remove('hidden');
}
