#!/bin/bash

# Vibe Coding Git Automation Script (Enhanced)
# Usage: 
#   vibe "message"  -> Commit locally (Local Archive)
#   vibe -p         -> Push all commits to GitHub
#   vibe            -> Quick commit with default message

GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' 

# 1. Handle "Push" mode
if [[ "$1" == "-p" || "$1" == "push" ]]; then
    echo -e "${BLUE}🚀 Pushing all local commits to GitHub...${NC}"
    git push origin main
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ Sync Complete! Your Vibe is now live on GitHub.${NC}"
    else
        echo -e "\033[0;31m❌ Push failed. Check connection.\033[0m"
    fi
    exit 0
fi

# 2. Handle "Commit" mode
if [[ -z $(git status -s) ]]; then
    echo -e "${YELLOW}✨ No changes to commit.${NC}"
    exit 0
fi

echo -e "${BLUE}📝 Archiving changes to local Git...${NC}"
git add .

MSG=$1
if [ -z "$MSG" ]; then
    MSG="vibe: atomic save"
fi

if [[ ! $MSG == vibe:* ]]; then
    MSG="vibe: $MSG"
fi

git commit -m "$MSG"
echo -e "${GREEN}� Save point created! (Local only)${NC}"
echo -e "${YELLOW}💡 Run 'vibe -p' when you're ready to sync to GitHub.${NC}"
