"""
Export smoke test. Proves that headless Blender can: build beveled geometry,
assign PBR and emissive materials, bake ambient occlusion, and export a GLB
with an occlusion texture. Run before trusting the full model scripts.
"""

import os
import sys

sys.path.insert(0, os.path.dirname(__file__))

import lib_common as lib  # noqa: E402

args = lib.parse_args()
lib.reset_scene()

body = lib.slab("body", 0.5, 0.3, 0.06, (0, 0, 0.03), lib.pal("graphite"), radius=0.03, bevel=0.006, segments=3)
cap = lib.box("cap", (0.12, 0.12, 0.04), (0.1, 0.0, 0.08), lib.pal("aluminum"), bevel=0.005, segments=3)
led = lib.cylinder("led", 0.012, 0.004, (-0.15, -0.14, 0.062), lib.emissive("led_cyan", lib.LED_CYAN, 3.0), vertices=16)

main = lib.join([body, cap, led], "smoke")
lib.build_and_export([main], args, ao_size=256)
