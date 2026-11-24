"""
Ultrawide monitor with a separate Screen mesh. Origin: floor of the stand,
center of the panel. The Screen mesh has 0..1 UVs for the project texture.
"""

import math
import os
import sys

sys.path.insert(0, os.path.dirname(__file__))
import lib_common as lib

args = lib.parse_args()
lib.reset_scene()

PANEL_W, PANEL_H, PANEL_T = 1.72, 0.76, 0.018
CENTER_Z = 0.9
SCREEN_W, SCREEN_H = 1.66, 0.69
R90 = (math.radians(90), 0, 0)

parts = []

# Bezel: slab in the XZ plane. Rotating by 90 degrees about X turns the
# footprint (X by Y) into X by Z, and the thickness into Y.
parts.append(
    lib.slab(
        "bezel",
        PANEL_W,
        PANEL_H,
        PANEL_T,
        (0, 0, CENTER_Z),
        lib.pal("graphite_dark"),
        radius=0.016,
        bevel=0.004,
        segments=3,
        rot=R90,
    )
)
# Rear housing, slightly smaller and thicker, in aluminum.
parts.append(
    lib.slab(
        "housing",
        PANEL_W - 0.06,
        PANEL_H - 0.08,
        0.024,
        (0, 0.02, CENTER_Z + 0.005),
        lib.pal("graphite"),
        radius=0.03,
        bevel=0.006,
        segments=3,
        rot=R90,
    )
)
# Inner trim frame around the glass.
for name, size, loc in (
    ("trim_top", (SCREEN_W + 0.012, 0.002, 0.006), (0, -0.0092, CENTER_Z + SCREEN_H / 2 + 0.003)),
    ("trim_bot", (SCREEN_W + 0.012, 0.002, 0.006), (0, -0.0092, CENTER_Z - SCREEN_H / 2 - 0.003)),
    ("trim_l", (0.006, 0.002, SCREEN_H + 0.012), (-SCREEN_W / 2 - 0.003, -0.0092, CENTER_Z)),
    ("trim_r", (0.006, 0.002, SCREEN_H + 0.012), (SCREEN_W / 2 + 0.003, -0.0092, CENTER_Z)),
):
    parts.append(lib.box(name, size, loc, lib.pal("rubber")))

# Chin details: a thin aluminum strip, and a power LED.
parts.append(
    lib.box(
        "chin_strip",
        (0.26, 0.002, 0.0035),
        (0, -0.0094, CENTER_Z - PANEL_H / 2 + 0.0105),
        lib.pal("aluminum"),
    )
)
parts.append(
    lib.cylinder(
        "power_led",
        0.0028,
        0.002,
        (PANEL_W / 2 - 0.05, -0.0094, CENTER_Z - PANEL_H / 2 + 0.0105),
        lib.emissive("led_cyan", lib.LED_CYAN, 4.0),
        vertices=12,
        rot=R90,
    )
)

# Stand: oval foot, tapered neck and a hinge cap.
parts.append(
    lib.slab(
        "foot",
        0.5,
        0.26,
        0.016,
        (0, 0.07, 0.008),
        lib.pal("aluminum"),
        radius=0.12,
        bevel=0.0045,
        segments=3,
        corner_segments=10,
    )
)
parts.append(
    lib.extrude_profile(
        "neck",
        [(0.07, 0.014), (0.15, 0.014), (0.11, 0.2), (0.075, 0.9), (0.03, 0.9), (0.04, 0.2)],
        0.11,
        (0, 0, 0),
        lib.pal("aluminum"),
        bevel=0.006,
        segments=3,
    )
)
parts.append(
    lib.cylinder(
        "hinge",
        0.026,
        0.1,
        (0, 0.07, CENTER_Z + 0.0),
        lib.pal("graphite"),
        vertices=24,
        bevel=0.004,
        rot=(0, math.radians(90), 0),
    )
)

main = lib.join(parts, "monitor")

screen = lib.screen_plane(
    "Screen",
    SCREEN_W,
    SCREEN_H,
    (0, -0.0102, CENTER_Z),
    lib.screen_material("screen_glass"),
    radius=0.006,
)
lib.apply_transforms([screen])

lib.build_and_export([main, screen], args, ao_size=512)
