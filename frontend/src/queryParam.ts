// Copyright (C) 2021 Chronoscope. All rights reserved.

let params: URLSearchParams|null;
let sourceUrl: string;

export default function queryParam(name: string): string {
    if (window.location.href !== sourceUrl) {
        params = new URLSearchParams(window.location.search);
        sourceUrl = window.location.href;
    }

    if (params?.has(name)) {
        return params.get(name);
    }

    return null;
}
