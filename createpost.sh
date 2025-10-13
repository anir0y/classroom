#!/bin/bash


read -p "Enter Title: " PostTitle
posttitle=$(echo "$PostTitle" | tr '[:upper:]' '[:lower:]' | tr ' ' '-')

echo $posttitle

hugo new post/$posttitle.md ; code . ; hugo server -D
