"""
Automation control panel on a sloped console. Origin: center of the footprint
on the desk. The front faces -Y. A separate Screen mesh (0..1 UVs) carries the
status display texture.
"""

import math
import os
import sys

sys.path.insert(0, os.path.dirname(__file__))
import lib_common as lib
from mathutils import Matrix, Vector

args = lib.parse_args()
lib.reset_scene()

WIDTH, DEPTH = 0.8, 0.44
FRONT_Z, BACK_Z = 0.07, 0.19
TILT = math.atan2(BACK_Z - FRONT_Z, DEPTH)
SURF_ORIGIN = Vector((0.0, 0.0, (FRONT_Z + BACK_Z) / 2))
ROT = Matrix.Rotation(TILT, 3, "X")


def at(u, v, w=0.0):
    """Point on the sloped surface: u across, v up the slope, w out of it."""
    return tuple(SURF_ORIGIN + ROT @ Vector((u, v, w)))


tilt_rot = (TILT, 0, 0)

graphite = lib.pal("graphite")
graphite_dark = lib.pal("graphite_dark")
rubber = lib.pal("rubber")
aluminum = lib.pal("aluminum")
cap_mat = lib.material("btn_cap", "#1c2640", 0.3, 0.45)
btn_cyan = lib.emissive("btn_cyan", lib.LED_CYAN, 3.2)
btn_violet = lib.emissive("btn_violet", lib.LED_VIOLET, 3.0)
btn_dim = lib.emissive("btn_dim", lib.LED_DIM, 1.0)
led_cyan = lib.emissive("led_cyan", lib.LED_CYAN, 4.0)
led_violet = lib.emissive("led_violet", lib.LED_VIOLET, 3.5)
led_dim = lib.emissive("led_dim", lib.LED_DIM, 1.2)

parts = []

# Console body: a wedge with beveled edges, over a thin plinth.
parts.append(lib.slab("plinth", 0.84, 0.48, 0.03, (0, 0, 0.015), lib.pal("desk_dark"), radius=0.02, bevel=0.005, segments=3))
parts.append(
    lib.extrude_profile(
        "body",
        [(-DEPTH / 2, 0.03), (DEPTH / 2, 0.03), (DEPTH / 2, BACK_Z), (-DEPTH / 2, FRONT_Z)],
        WIDTH,
        (0, 0, 0),
        graphite,
        bevel=0.0065,
        segments=3,
    )
)
# Recessed inlay plate that holds all controls.
parts.append(
    lib.box("inlay", (WIDTH - 0.06, DEPTH / math.cos(TILT) - 0.06, 0.004), at(0, 0, 0.0006), graphite_dark, bevel=0.0016, segments=1, rot=tilt_rot)
)

# 4 x 3 grid of backlit buttons.
pattern = [btn_cyan, btn_cyan, btn_violet, btn_dim, btn_cyan, btn_dim, btn_violet, btn_cyan, btn_dim, btn_cyan, btn_cyan, btn_violet]
for index, lit in enumerate(pattern):
    col, row = index % 4, index // 4
    u = -0.285 + col * 0.058
    v = -0.125 + row * 0.058
    parts.append(lib.box(f"btn_{index}", (0.044, 0.044, 0.011), at(u, v, 0.0075), cap_mat, bevel=0.0035, segments=2, rot=tilt_rot))
    parts.append(lib.box(f"btn_light_{index}", (0.03, 0.03, 0.0016), at(u, v, 0.0135), lit, bevel=0.0008, segments=1, rot=tilt_rot))

# Status display with a bezel. The Screen mesh is added after the join.
DISP_U, DISP_V, DISP_W, DISP_H = 0.15, 0.11, 0.25, 0.1
parts.append(lib.box("disp_bezel", (DISP_W + 0.016, DISP_H + 0.016, 0.006), at(DISP_U, DISP_V, 0.0045), rubber, bevel=0.002, segments=2, rot=tilt_rot))

# Four faders: slot, cap and a cyan marker line.
for i, pos in enumerate((-0.05, 0.35, -0.2, 0.15)):
    u = 0.04 + i * 0.07
    parts.append(lib.box(f"slot_{i}", (0.009, 0.15, 0.002), at(u, -0.115, 0.0016), rubber, bevel=0.0008, segments=1, rot=tilt_rot))
    v = -0.115 + pos * 0.45
    parts.append(lib.box(f"fader_{i}", (0.024, 0.016, 0.013), at(u, v, 0.0085), aluminum, bevel=0.0025, segments=2, rot=tilt_rot))
    parts.append(lib.box(f"fader_mark_{i}", (0.02, 0.0018, 0.0014), at(u, v, 0.0155), led_cyan, rot=tilt_rot))

# Two knurled knobs with indicator lines and skirts.
for i, (u, ang) in enumerate(((-0.2, 40), (-0.08, -60))):
    v = 0.115
    parts.append(lib.cylinder(f"knob_skirt_{i}", 0.032, 0.004, at(u, v, 0.004), rubber, vertices=28, bevel=0.0012, segments=1, rot=tilt_rot))
    parts.append(lib.knurled_cylinder(f"knob_{i}", 0.022, 0.022, at(u, v, 0.015), aluminum, teeth=26, depth=0.0015, rot=tilt_rot))
    a = math.radians(ang)
    du, dv = 0.011 * -math.sin(a), 0.011 * math.cos(a)
    parts.append(
        lib.box(
            f"knob_mark_{i}",
            (0.003, 0.016, 0.0016),
            at(u + du, v + dv, 0.0265),
            led_cyan,
            rot=(TILT, 0, a),
        )
    )

# Three toggle switches between the grid and the faders.
for i in range(3):
    u = -0.0 + i * 0.045 - 0.005
    v = -0.012
    parts.append(lib.cylinder(f"tog_nut_{i}", 0.0095, 0.004, at(u, v, 0.004), aluminum, vertices=6, rot=tilt_rot))
    lean = (-0.4, 0.4, -0.4)[i]
    lever_base = Vector(at(u, v, 0.006))
    parts.append(
        lib.cylinder(
            f"tog_lever_{i}",
            0.0032,
            0.026,
            tuple(lever_base + ROT @ Vector((0, 0.013 * math.sin(lean), 0.013 * math.cos(lean)))),
            aluminum,
            vertices=10,
            rot=(TILT - lean, 0, 0),
        )
    )
    parts.append(
        lib.uv_sphere(
            f"tog_tip_{i}",
            0.0048,
            tuple(lever_base + ROT @ Vector((0, 0.026 * math.sin(lean), 0.026 * math.cos(lean)))),
            led_cyan if i != 1 else led_dim,
            u=12,
            v=8,
        )
    )

# Large ring button.
parts.append(lib.torus("ring_outer", 0.028, 0.0045, at(0.33, -0.065, 0.007), aluminum, major_segments=36, minor_segments=8, rot=tilt_rot))
parts.append(lib.cylinder("ring_disc", 0.023, 0.006, at(0.33, -0.065, 0.007), led_cyan, vertices=28, rot=tilt_rot))

# Row of six indicator lights on the back lip, each in its own bezel.
for i, mat in enumerate((led_cyan, led_cyan, led_dim, led_violet, led_cyan, led_dim)):
    u = -0.3 + i * 0.032
    v = 0.185
    parts.append(lib.cylinder(f"led_ring_{i}", 0.0072, 0.0026, at(u, v, 0.004), rubber, vertices=16, rot=tilt_rot))
    parts.append(lib.cylinder(f"led_{i}", 0.0048, 0.0028, at(u, v, 0.0056), mat, vertices=14, rot=tilt_rot))

# Rubber feet.
for sx in (-1, 1):
    for sy in (-1, 1):
        parts.append(lib.cylinder(f"foot_{sx}_{sy}", 0.016, 0.004, (sx * 0.37, sy * 0.2, 0.0), rubber, vertices=16))

main = lib.join(parts, "panel")

screen = lib.screen_plane(
    "Screen",
    DISP_W,
    DISP_H,
    (0, 0, 0),
    lib.screen_material("panel_screen"),
    radius=0.003,
)
# Plane faces -Y with its up on +Z; turn it to face out of the sloped surface.
screen.rotation_euler = (TILT - math.pi / 2, 0, 0)
screen.location = at(DISP_U, DISP_V, 0.0082)
lib.apply_transforms([screen])

lib.build_and_export([main, screen], args, ao_size=1024)
