#!/usr/bin/env python

# Copyright (C) 2021 Chronoscope. All rights reserved.

import os
import signal
from os import path
import subprocess
import platform

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

    try:
        ret = subprocess.run(['npm', 'run', 'watch'])
    except FileNotFoundError:
        if platform.system() == 'Windows':
            appdata_dir = os.getenv('APPDATA')
            if appdata_dir:
                npm_exec = path.join(appdata_dir, 'npm', 'npm.cmd')
                ret = subprocess.run([npm_exec, 'run', 'watch'])
            else:
                print('Failed to detect APPDATA dir')
                server_proc.terminate()
                return 1
        else:
            print('Failed to execute npm')
            server_proc.terminate()
            return 1

    if ret.returncode != -2:
        print('Failed to run webpack')
        server_proc.terminate()
        return 1


    return 0

if __name__ == '__main__':
    exit(main())
