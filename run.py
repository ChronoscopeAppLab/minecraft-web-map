#!/usr/bin/env python

# Copyright (C) 2021 Chronoscope. All rights reserved.

import os
import signal
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

    server_proc = subprocess.Popen([
        path.join(base_path, 'backend', 'backend'),
        '--debug', '--metadata-path', path.join(base_path, 'mapmeta')])
    signal.signal(signal.SIGINT, lambda signum, frame:
                  server_proc.terminate())

    ret = subprocess.run(['npm', 'run', 'watch'])
    if ret.returncode != -2:
        print('Failed to run webpack')
        server_proc.terminate()
        return 1

    return 0

if __name__ == '__main__':
    exit(main())
