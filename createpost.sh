#!/bin/bash


read -p "Enter Title: " posttitle

hugo new post/TryHackMe-$posttitle.md ; code . ; hugo server -D
