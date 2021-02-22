// Copyright (C) 2021 Chronoscope. All rights reserved.

let paramMap: Map<string, string>;
let sourceUrl: string;

function parseQueryParam() {
    paramMap = new Map<string, string>();

    const url = window.location.href;
    const queryStart = url.indexOf('?');
    if (queryStart < 0) {
        return;
    }

    url.substr(queryStart + 1)
        .split('&')
        .map((param: string) => {
            const kvSepPos = param.indexOf('=');
            if (kvSepPos < 0) {
                return [param];
            }
            return [param.substr(0, kvSepPos),
                    param.substr(kvSepPos + 1)];
        })
        .forEach((param: string[]) => {
            if (param.length == 1) {
                paramMap.set(param[0], '');
            } else {
                paramMap.set(param[0], param[1]);
            }
        });
}

export default function queryParam(name: string): string {
    if (window.location.href !== sourceUrl) {
        parseQueryParam();
        sourceUrl = window.location.href;
    }

    if (paramMap.has(name)) {
        return paramMap.get(name);
    }

    return null;
}
