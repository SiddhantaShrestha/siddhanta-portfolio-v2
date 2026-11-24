"""
Miniature server rack with five distinct units. Origin: center of the
footprint on the desk. The front faces -Y (toward the viewer after export).
"""

import math
import os
import sys

sys.path.insert(0, os.path.dirname(__file__))
import lib_common as lib

args = lib.parse_args()
lib.reset_scene()

CAB_W, CAB_D, CAB_H = 0.46, 0.42, 0.78
BASE_H = 0.04
TOP_Z = BASE_H + CAB_H
FRONT_Y = -CAB_D / 2 - 0.004
UNIT_W, UNIT_H = 0.37, 0.124
PITCH = 0.145
FIRST_Z = 0.125
R90X = (math.radians(90), 0, 0)  # axis Z -> axis -Y, for round things on the front

graphite = lib.pal("graphite")
graphite_dark = lib.pal("graphite_dark")
rubber = lib.pal("rubber")
aluminum = lib.pal("aluminum")
led_cyan = lib.emissive("led_cyan", lib.LED_CYAN, 4.0)
led_violet = lib.emissive("led_violet", lib.LED_VIOLET, 3.5)
led_dim = lib.emissive("led_dim", lib.LED_DIM, 1.2)
unit_a = lib.material("unit_a", "#27355a", 0.8, 0.38)
unit_b = lib.material("unit_b", "#212e4d", 0.8, 0.42)

parts = []

# Base, frame and top.
parts.append(lib.slab("plinth", 0.5, 0.46, BASE_H, (0, 0, BASE_H / 2), lib.pal("desk_dark"), radius=0.02, bevel=0.007, segments=3))
parts.append(lib.slab("lid", 0.5, 0.46, 0.026, (0, 0, TOP_Z + 0.013), graphite, radius=0.02, bevel=0.006, segments=3))
parts.append(lib.box("core", (CAB_W - 0.03, CAB_D - 0.04, CAB_H), (0, 0, BASE_H + CAB_H / 2), rubber))
for sx in (-1, 1):
    for sy in (-1, 1):
        parts.append(
            lib.box(
                f"post_{sx}_{sy}",
                (0.028, 0.028, CAB_H),
                (sx * (CAB_W / 2 - 0.012), sy * (CAB_D / 2 - 0.012), BASE_H + CAB_H / 2),
                aluminum,
                bevel=0.004,
            )
        )
# Side panels with horizontal vent slots (the left side faces the camera).
for sx in (-1, 1):
    x = sx * (CAB_W / 2 - 0.004)
    parts.append(
        lib.box(
            f"side_{sx}",
            (0.008, CAB_D - 0.05, CAB_H - 0.02),
            (x, 0, BASE_H + CAB_H / 2),
            graphite_dark,
            bevel=0.002,
            segments=1,
        )
    )
    for i in range(16):
        z = BASE_H + 0.07 + i * 0.0425
        parts.append(
            lib.box(
                f"vent_{sx}_{i}",
                (0.0028, 0.22, 0.008),
                (x + sx * 0.0026, 0.02, z),
                rubber,
            )
        )
# Top vents.
for i in range(9):
    parts.append(
        lib.box(
            f"topvent_{i}",
            (0.3, 0.012, 0.0016),
            (0, -0.11 + i * 0.028, TOP_Z + 0.0262),
            rubber,
        )
    )
# Lid feet badge: a thin cyan accent line on the front lip.
parts.append(lib.box("lid_line", (0.3, 0.0016, 0.0022), (0, -0.2325, TOP_Z + 0.016), led_dim))


def unit_front(index, mat):
    z = FIRST_Z + index * PITCH
    parts.append(
        lib.box(
            f"unit_{index}",
            (UNIT_W, 0.016, UNIT_H),
            (0, FRONT_Y + 0.0, z),
            mat,
            bevel=0.0035,
            segments=2,
        )
    )
    # Rack ears with screws.
    for sx in (-1, 1):
        parts.append(
            lib.box(
                f"ear_{index}_{sx}",
                (0.03, 0.01, UNIT_H - 0.008),
                (sx * 0.205, FRONT_Y - 0.001, z),
                aluminum,
                bevel=0.002,
                segments=1,
            )
        )
        for sz in (-1, 1):
            parts.append(
                lib.cylinder(
                    f"screw_{index}_{sx}_{sz}",
                    0.0042,
                    0.003,
                    (sx * 0.205, FRONT_Y - 0.0065, z + sz * 0.042),
                    graphite_dark,
                    vertices=10,
                    rot=R90X,
                )
            )
    return z


def front_y(extra=0.0):
    return FRONT_Y - 0.008 - extra


# Unit 0 (bottom): UPS with a small display, a knob and outlets.
z = unit_front(0, unit_a)
parts.append(lib.box("ups_display", (0.1, 0.002, 0.04), (-0.095, front_y(0.0007), z + 0.012), rubber, bevel=0.001, segments=1))
parts.append(lib.box("ups_bar", (0.07, 0.0016, 0.006), (-0.095, front_y(0.0014), z + 0.014), led_cyan))
parts.append(lib.box("ups_bar2", (0.045, 0.0016, 0.004), (-0.1075, front_y(0.0014), z + 0.002), led_dim))
parts.append(lib.knurled_cylinder("ups_knob", 0.016, 0.014, (0.05, front_y(0.006), z + 0.004), aluminum, teeth=20, depth=0.001, rot=R90X))
parts.append(lib.box("ups_knob_mark", (0.0024, 0.0016, 0.009), (0.05, front_y(0.0135), z + 0.011), led_cyan))
for i in range(3):
    parts.append(lib.box(f"outlet_{i}", (0.026, 0.002, 0.026), (0.11 + i * 0.033, front_y(0.0007), z - 0.004), rubber, bevel=0.0012, segments=1))
    parts.append(lib.cylinder(f"outlet_dot_{i}", 0.0032, 0.0016, (0.11 + i * 0.033, front_y(0.0014), z - 0.004), led_dim, vertices=10, rot=R90X))

# Unit 1: storage array, eight drive bays with tiny activity lights.
z = unit_front(1, unit_b)
for i in range(8):
    bx = -0.132 + i * 0.0378
    parts.append(lib.box(f"bay_{i}", (0.032, 0.003, 0.075), (bx, front_y(0.001), z + 0.002), graphite_dark, bevel=0.0015, segments=1))
    parts.append(lib.box(f"bay_slot_{i}", (0.02, 0.0016, 0.004), (bx, front_y(0.0028), z + 0.026), rubber))
    lit = i not in (3, 6)
    parts.append(
        lib.box(
            f"bay_led_{i}",
            (0.004, 0.0016, 0.004),
            (bx + 0.009, front_y(0.0028), z - 0.03),
            led_cyan if lit else led_dim,
        )
    )

# Unit 2: compute server with a perforated grille and a power button.
z = unit_front(2, unit_a)
parts.append(lib.box("grille_plate", (0.25, 0.003, 0.088), (-0.044, front_y(0.0011), z), graphite_dark, bevel=0.0015, segments=1))
for row in range(5):
    for col in range(14):
        parts.append(
            lib.box(
                f"hole_{row}_{col}",
                (0.0125, 0.0016, 0.0085),
                (-0.151 + col * 0.0163, front_y(0.0028), z - 0.034 + row * 0.0172),
                rubber,
            )
        )
parts.append(lib.torus("power_ring", 0.0105, 0.0017, (0.138, front_y(0.0045), z + 0.012), aluminum, major_segments=24, minor_segments=6, rot=R90X))
parts.append(lib.cylinder("power_core", 0.0085, 0.002, (0.138, front_y(0.003), z + 0.012), led_cyan, vertices=18, rot=R90X))
parts.append(lib.cylinder("status_led", 0.0028, 0.002, (0.138, front_y(0.003), z - 0.016), led_violet, vertices=10, rot=R90X))
parts.append(lib.cylinder("status_led2", 0.0028, 0.002, (0.152, front_y(0.003), z - 0.016), led_dim, vertices=10, rot=R90X))

# Unit 3: network switch with a row of ports.
z = unit_front(3, unit_b)
parts.append(lib.box("switch_plate", (0.27, 0.003, 0.07), (-0.04, front_y(0.0011), z - 0.002), graphite_dark, bevel=0.0015, segments=1))
for i in range(12):
    px = -0.1565 + i * 0.0213
    for row, pz in enumerate((z + 0.012, z - 0.016)):
        parts.append(lib.box(f"port_{i}_{row}", (0.0142, 0.0036, 0.0118), (px, front_y(0.0021), pz), rubber, bevel=0.0008, segments=1))
        lit = (i * 2 + row) % 5 != 0
        parts.append(lib.box(f"port_led_{i}_{row}", (0.0042, 0.0016, 0.0016), (px, front_y(0.0036), pz + 0.0086 if row == 0 else pz - 0.0086), led_cyan if lit and (i + row) % 3 else led_dim))
parts.append(lib.box("switch_label", (0.05, 0.0016, 0.006), (0.14, front_y(0.0011), z + 0.015), aluminum))

# Unit 4 (top): AI node with a vent strip and a violet accent light bar.
z = unit_front(4, unit_a)
parts.append(lib.box("ai_plate", (0.26, 0.003, 0.09), (-0.04, front_y(0.0011), z), graphite_dark, bevel=0.0015, segments=1))
for i in range(11):
    parts.append(lib.box(f"ai_slot_{i}", (0.2, 0.0016, 0.0045), (-0.04, front_y(0.0028), z - 0.034 + i * 0.0068), rubber))
parts.append(lib.box("ai_bar", (0.12, 0.002, 0.0036), (-0.04, front_y(0.0032), z + 0.042 - 0.003), led_violet))
parts.append(lib.cylinder("ai_led_1", 0.0032, 0.002, (0.12, front_y(0.003), z + 0.012), led_cyan, vertices=10, rot=R90X))
parts.append(lib.cylinder("ai_led_2", 0.0032, 0.002, (0.14, front_y(0.003), z + 0.012), led_cyan, vertices=10, rot=R90X))
parts.append(lib.cylinder("ai_led_3", 0.0032, 0.002, (0.16, front_y(0.003), z + 0.012), led_dim, vertices=10, rot=R90X))

main = lib.join(parts, "rack")
lib.build_and_export([main], args, ao_size=1024)
