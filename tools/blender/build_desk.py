"""Desk, desk mat, notebook and pen. Origin: top surface center of the desk."""

import math
import os
import sys

sys.path.insert(0, os.path.dirname(__file__))
import lib_common as lib

args = lib.parse_args()
lib.reset_scene()

WIDTH, DEPTH, THICK, LEG_H = 4.2, 1.7, 0.07, 0.62

top = lib.slab(
    "desk_top",
    WIDTH,
    DEPTH,
    THICK,
    (0, 0, -THICK / 2),
    lib.pal("desk_top", coat=0.4, coat_roughness=0.4),
    radius=0.05,
    bevel=0.011,
    segments=3,
    corner_segments=8,
)

# Under-desk frame: two slab legs, a back stretcher and four levelling feet.
leg_x = WIDTH / 2 - 0.4
parts = [top]
for sign in (-1, 1):
    parts.append(
        lib.box(
            f"leg_{sign}",
            (0.07, DEPTH * 0.78, LEG_H),
            (sign * leg_x, 0.0, -THICK - LEG_H / 2),
            lib.pal("desk_dark"),
            bevel=0.008,
            segments=2,
        )
    )
    for fy in (-0.5, 0.5):
        parts.append(
            lib.cylinder(
                f"foot_{sign}_{fy}",
                0.035,
                0.02,
                (sign * leg_x, fy, -THICK - LEG_H - 0.008),
                lib.pal("rubber"),
                vertices=20,
                bevel=0.004,
            )
        )
parts.append(
    lib.box(
        "stretcher",
        (2 * leg_x, 0.03, 0.14),
        (0, 0.55, -THICK - 0.17),
        lib.pal("desk_dark"),
        bevel=0.005,
    )
)

# Desk mat with a darker edge binding underneath.
mat_c = (0.15, 0.0)
parts.append(
    lib.slab(
        "mat_edge",
        1.53,
        1.33,
        0.006,
        (mat_c[0], mat_c[1], 0.003),
        lib.pal("felt"),
        radius=0.045,
        bevel=0.002,
    )
)
parts.append(
    lib.slab(
        "mat",
        1.5,
        1.3,
        0.006,
        (mat_c[0], mat_c[1], 0.0075),
        lib.pal("felt_light"),
        radius=0.04,
        bevel=0.0025,
    )
)

# Notebook with a paper block and an elastic band, plus a pen on top.
nb_loc = (0.76, -0.52, 0.0)
nb_rot = (0, 0, math.radians(9))
parts.append(
    lib.box(
        "notebook_cover",
        (0.2, 0.28, 0.024),
        (nb_loc[0], nb_loc[1], 0.021),
        lib.pal("graphite_dark"),
        bevel=0.004,
        rot=nb_rot,
    )
)
parts.append(
    lib.box(
        "notebook_pages",
        (0.188, 0.272, 0.014),
        (nb_loc[0] + 0.003, nb_loc[1] - 0.001, 0.021),
        lib.material("paper", "#8a96ad", 0.0, 0.9),
        bevel=0.001,
        segments=1,
        rot=nb_rot,
    )
)
parts.append(
    lib.box(
        "notebook_band",
        (0.012, 0.284, 0.026),
        (nb_loc[0] + 0.05 * math.cos(nb_rot[2]), nb_loc[1] + 0.05 * math.sin(nb_rot[2]), 0.021),
        lib.pal("aluminum"),
        bevel=0.002,
        rot=nb_rot,
    )
)
parts.append(
    lib.cylinder(
        "pen",
        0.0065,
        0.15,
        (nb_loc[0] - 0.01, nb_loc[1] + 0.01, 0.0445),
        lib.pal("aluminum"),
        vertices=16,
        bevel=0.002,
        rot=(0, math.radians(90), math.radians(-24)),
    )
)
parts.append(
    lib.cylinder(
        "pen_clip",
        0.0016,
        0.05,
        (nb_loc[0] + 0.02, nb_loc[1] + 0.026, 0.0525),
        lib.pal("graphite"),
        vertices=8,
        rot=(0, math.radians(90), math.radians(-24)),
    )
)

main = lib.join(parts, "desk")
lib.build_and_export([main], args, ao_size=1024)

