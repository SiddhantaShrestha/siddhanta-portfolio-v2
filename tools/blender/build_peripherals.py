"""Low-profile keyboard and mouse. Origin: center of the keyboard on the desk."""

import math
import os
import sys

sys.path.insert(0, os.path.dirname(__file__))
import lib_common as lib

args = lib.parse_args()
lib.reset_scene()

CASE_W, CASE_D = 0.64, 0.22
LOW, HIGH = 0.014, 0.026
TILT = math.atan2(HIGH - LOW, CASE_D)

parts = []
parts.append(
    lib.extrude_profile(
        "case",
        [(-CASE_D / 2, 0.0), (CASE_D / 2, 0.0), (CASE_D / 2, HIGH), (-CASE_D / 2, LOW)],
        CASE_W,
        (0, 0, 0),
        lib.pal("graphite_dark"),
        bevel=0.0035,
        segments=2,
    )
)

key_main = lib.pal("graphite")
key_mod = lib.material("key_mod", "#3a4766", 0.2, 0.55)
key_accent = lib.material("key_accent", "#2a7f90", 0.1, 0.5)

PITCH_X, PITCH_Y = 0.0435, 0.039
KEY_W, KEY_D, KEY_H = 0.036, 0.034, 0.012


def surface_z(y):
    return LOW + (y + CASE_D / 2) / CASE_D * (HIGH - LOW)


def add_key(name, x, y, mat, width=KEY_W):
    parts.append(
        lib.box(
            name,
            (width, KEY_D, KEY_H),
            (x, y, surface_z(y) + KEY_H / 2),
            mat,
            bevel=0.0028,
            segments=2,
            rot=(TILT, 0, 0),
        )
    )


for row in range(4):
    y = 0.078 - row * PITCH_Y
    for col in range(14):
        x = (col - 6.5) * PITCH_X
        edge = col in (0, 13)
        mat = key_mod if edge else key_main
        if row == 1 and col == 13:
            mat = key_accent
        add_key(f"k_{row}_{col}", x, y, mat)

bottom_y = 0.078 - 4 * PITCH_Y
for i, x in enumerate((-0.26, -0.2165, -0.173, 0.173, 0.2165, 0.26)):
    add_key(f"kb_{i}", x, bottom_y, key_mod)
add_key("space", 0.0, bottom_y, key_main, width=PITCH_X * 5.2)

# Mouse: low ellipsoid body, a rubber skirt and a glowing scroll slit.
MX, MY = 0.46, -0.01
parts.append(
    lib.uv_sphere(
        "mouse_body",
        1.0,
        (MX, MY, 0.012),
        lib.pal("graphite"),
        scale=(0.032, 0.055, 0.017),
        u=32,
        v=20,
    )
)
parts.append(
    lib.uv_sphere(
        "mouse_skirt",
        1.0,
        (MX, MY, 0.005),
        lib.pal("rubber"),
        scale=(0.034, 0.057, 0.007),
        u=32,
        v=12,
    )
)
parts.append(
    lib.box(
        "mouse_split",
        (0.0016, 0.03, 0.002),
        (MX, MY + 0.02, 0.0285),
        lib.pal("rubber"),
    )
)
parts.append(
    lib.box(
        "mouse_wheel",
        (0.0075, 0.015, 0.004),
        (MX, MY + 0.02, 0.0285),
        lib.emissive("led_cyan", lib.LED_CYAN, 3.0),
        bevel=0.0012,
        segments=1,
    )
)

main = lib.join(parts, "peripherals")
lib.build_and_export([main], args, ao_size=1024)
