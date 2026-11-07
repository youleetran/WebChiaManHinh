"""Tạo dữ liệu biển báo, camera và giới hạn tốc độ cho web từ bộ dữ liệu trong thư mục nguon/.

Cách dùng:
    python tools/build_map_data.py nguon data

Đọc:
    nguon/bien_bao.geojson   biển cảnh báo (thuộc tính loai, ten, icon, huong)
    nguon/camera.geojson     camera (thuộc tính ma_loai, ten, icon, toc_do_kmh)
    nguon/toc_do/*.json      giới hạn tốc độ theo đoạn đường, {"s": [[lon1, lat1, lon2, lat2, kmh_thuận, kmh_ngược], ...]}
    nguon/icons/...          icon, đường dẫn lấy từ thuộc tính icon

Ghi (xóa và tạo lại các thư mục này):
    data/types.json          danh sách loại biển và loại camera: [mã, tên, file icon]
    data/icons/              chỉ những icon dữ liệu có dùng
    data/signs/{x}_{y}.json  {"b": [[lat, lon, loại, hướng], ...], "c": [[lat, lon, loại, km/h], ...]}
    data/speed/{x}_{y}.json  {"s": [x1, y1, x2, y2, kmh_thuận, kmh_ngược, ...]}

Ô {x}_{y} giống data/roads: x = floor(kinh độ / 0,1), y = floor(vĩ độ / 0,1).
lat, lon trong data/signs là số nguyên đơn vị 1e-5 độ; loại là vị trí trong types.json; hướng tính bằng độ;
km/h của camera là 0 khi không có.
x, y trong data/speed là số nguyên đơn vị 1e-5 độ, tính từ góc dưới bên trái của ô.
"""
import argparse
import json
import math
import shutil
import sys
from collections import defaultdict
from pathlib import Path

TILE_DEG = 0.1
TILE_UNITS = 10000   # TILE_DEG tính bằng đơn vị 1e-5 độ


def tile_key(lon, lat):
    return f'{math.floor(lon / TILE_DEG)}_{math.floor(lat / TILE_DEG)}'


def write_json(path, value):
    path.write_text(json.dumps(value, separators=(',', ':'), ensure_ascii=False), encoding='utf-8')


def reset_dir(path):
    if path.exists():
        shutil.rmtree(path)
    path.mkdir(parents=True)


def main():
    sys.stdout.reconfigure(encoding='utf-8')
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument('source')
    parser.add_argument('out')
    args = parser.parse_args()
    src, out = Path(args.source), Path(args.out)

    signs = json.loads((src / 'bien_bao.geojson').read_text(encoding='utf-8'))['features']
    cams = json.loads((src / 'camera.geojson').read_text(encoding='utf-8'))['features']

    # Loại biển và loại camera, kèm icon chép sang data/icons với tên theo mã loại
    icons_out = out / 'icons'
    reset_dir(icons_out)
    types = {'signs': [], 'cams': []}
    index = {'signs': {}, 'cams': {}}

    def type_index(group, code, props):
        if code not in index[group]:
            icon_src = src / props['icon'].replace('icons/vietmap_live/', 'icons/', 1)
            if not icon_src.exists():
                icon_src = src / props['icon']
            icon_name = f'{"cam_" if group == "cams" else ""}{code}{icon_src.suffix}'
            shutil.copyfile(icon_src, icons_out / icon_name)
            index[group][code] = len(types[group])
            types[group].append([code, props['ten'], icon_name])
        return index[group][code]

    tiles = defaultdict(lambda: {'b': set(), 'c': set()})
    for f in signs:
        p = f['properties']
        lon, lat = f['geometry']['coordinates']
        kind = type_index('signs', p['loai'], p)
        tiles[tile_key(lon, lat)]['b'].add((round(lat * 1e5), round(lon * 1e5), kind, round(p['huong']) % 360))
    for f in cams:
        p = f['properties']
        lon, lat = f['geometry']['coordinates']
        kind = type_index('cams', p['ma_loai'], p)
        tiles[tile_key(lon, lat)]['c'].add((round(lat * 1e5), round(lon * 1e5), kind, p['toc_do_kmh'] or 0))

    write_json(out / 'types.json', types)
    signs_out = out / 'signs'
    reset_dir(signs_out)
    for key, tile in tiles.items():
        write_json(signs_out / f'{key}.json', {'b': sorted(tile['b']), 'c': sorted(tile['c'])})

    # Giới hạn tốc độ: đổi tọa độ thành số nguyên tính từ góc ô cho file nhỏ hơn
    speed_out = out / 'speed'
    reset_dir(speed_out)
    segments = 0
    size = 0
    for path in sorted((src / 'toc_do').glob('*_*.json')):
        x0, y0 = (int(v) * TILE_UNITS for v in path.stem.split('_'))
        flat = []
        for lon1, lat1, lon2, lat2, forward, backward in json.loads(path.read_text(encoding='utf-8'))['s']:
            flat += [round(lon1 * 1e5) - x0, round(lat1 * 1e5) - y0, round(lon2 * 1e5) - x0, round(lat2 * 1e5) - y0,
                     forward, backward]
            segments += 1
        target = speed_out / path.name
        write_json(target, {'s': flat})
        size += target.stat().st_size

    print(f'{len(signs)} biển, {len(types["signs"])} loại; {len(cams)} camera, {len(types["cams"])} loại; '
          f'{len(tiles)} ô biển báo')
    print(f'{segments} đoạn tốc độ, {len(list(speed_out.iterdir()))} ô, {size / 1e6:.1f} MB')


if __name__ == '__main__':
    main()
