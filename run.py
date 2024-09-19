#!/usr/bin/env python
import os
import signal
from os import path
import subprocess

def main():
    base_path = path.dirname(path.abspath(__file__))

    if 'ASSETS_PREFIX' not in os.environ:
        os.environ['ASSETS_PREFIX'] = 'http://localhost:8000/map'

    server_proc = subprocess.Popen(['go', 'run', '.'],
        env=dict(
            os.environ,
            DEBUG='true',
            METADATA_PATH=path.join(base_path, 'mapmeta'),
            STATIC_PATH=path.join(base_path, 'frontend', 'dist'),
        ),
        cwd=path.join(base_path, 'backend'))
    signal.signal(signal.SIGINT, lambda signum, frame: server_proc.terminate())

    try:
        ret = subprocess.run(['npm', 'run', 'watch'], cwd=path.join(base_path, 'frontend'))
    except:
        pass

    if ret.returncode != -2:
        print('Failed to run webpack')
        server_proc.terminate()
        return 1


    return 0

if __name__ == '__main__':
    exit(main())
