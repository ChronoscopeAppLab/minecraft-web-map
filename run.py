#!/usr/bin/env python

# Copyright (C) 2021 Chronoscope. All rights reserved.

import os
from os import path
import subprocess

def main():
    base_path = path.dirname(path.abspath(__file__))

    os.chdir(path.join(base_path, 'backend'))
    print('Building back-end...')
    ret = subprocess.run(['go', 'build', '.'])
    if ret.returncode != 0:
        print('Failed to build back-end')
        return 1
    dist_path = path.join(base_path, 'frontend', 'dist')
    try:
        os.mkdir(dist_path)
    except FileExistsError:
        pass
    os.chdir(dist_path)

    webpack_proc = subprocess.Popen(['npm', 'run', 'watch'])

    ret = subprocess.run([
        path.join(base_path, 'backend', 'backend'),
        '--debug'
    ])
    if ret.returncode != 0:
        print('Failed to launch back-end')
        return 1

    webpack_proc.terminate()

    return 0

if __name__ == '__main__':
    exit(main())
