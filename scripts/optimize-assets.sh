#!/bin/sh
# Shrink the raw asset packs into public/models. Run from the repo root.
# Raw packs stay out of git (see .gitignore); only the compressed output is committed.
set -e
PROPS=ModernJapaneseHomePropsLite/addons/modern_japanese_home_props/models
CHARS="Ultimate Animated Character Pack - Nov 2019/glTF"
mkdir -p public/models/props public/models/characters
for f in $(find $PROPS -name '*.glb'); do
  n=$(basename "$f")
  npx --yes @gltf-transform/cli resize --width 512 --height 512 "$f" "public/models/props/$n"
done
for n in Suit_Female Doctor_Female_Young Casual2_Female Casual_Male Casual3_Female Worker_Male; do
  npx --yes @gltf-transform/cli copy "$CHARS/$n.gltf" "public/models/characters/$n.glb"
done
