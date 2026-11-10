#!/usr/bin/env bash
# Encodes frames + mixed audio into the deliverable MP4 (1080x1920) and a lighter web version (720x1280) + poster.
set -euo pipefail
cd "$(dirname "$0")/build"
ffmpeg -y -v error -framerate 30 -i frames/%05d.jpg -i mix.m4a -c:v libx264 -preset slow -crf 20 -pix_fmt yuv420p -r 30 -c:a aac -b:a 128k -shortest -movflags +faststart ../../vsl-maquina-de-reels-1080x1920.mp4
ffmpeg -y -v error -framerate 30 -i frames/%05d.jpg -i mix.m4a -vf "scale=720:1280:flags=lanczos" -c:v libx264 -profile:v main -preset slow -crf 27 -maxrate 1500k -bufsize 3000k -pix_fmt yuv420p -r 30 -g 60 -c:a aac -b:a 96k -ac 2 -shortest -movflags +faststart ../../site/assets/vsl.mp4
# poster: frame at 1.6 s (hook), WebP
ffmpeg -y -v error -i frames/00048.jpg -vf "scale=720:1280" -c:v libwebp -quality 72 ../../site/assets/img/vsl-poster.webp
# OG image 1200x630 from the course scene
ffmpeg -y -v error -i frames/00990.jpg -vf "crop=1080:567:0:676,scale=1200:630" -q:v 4 ../../site/assets/img/og.jpg
ls -la ../../vsl-maquina-de-reels-1080x1920.mp4 ../../site/assets/vsl.mp4 ../../site/assets/img/
