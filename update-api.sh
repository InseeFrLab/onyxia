#!/bin/bash

# Find the repository root by looking for the .git directory
while [[ ! -d ".git" && "$PWD" != "/" ]]; do
  cd ..
done

if [[ ! -d ".git" ]]; then
  echo "Error: Run this script from the root of the project"
  exit 1
fi

git submodule update --init --recursive &>/dev/null

# Assuming api/ is a submodule at the repository root
API_SUBMODULE="api"

# Navigate to the submodule directory
cd $API_SUBMODULE

# Fetch all tags from remote
git fetch --tags &>/dev/null

# Get the latest tag name
latestTag=$(git describe --tags $(git rev-list --tags --max-count=1))

currentTag=$(git describe --tags $(git rev-parse HEAD))

# Check if the latest tag points to the current commit
if [ "$latestTag" == "$currentTag" ]; then
  echo "Onyxia API is alredy pinned to the latest version: $latestTag"
  exit 0
fi

# Checkout the latest tag
git checkout $latestTag &>/dev/null

# Navigate back to the main repository directory
cd ..

# Add the submodule change
git add $API_SUBMODULE

# Commit the update
git commit -m "Bump onyxia-api pin to $latestTag (previously pinned to $currentTag)"

echo "Done. Don't forget to push the changes to the remote repository. 👋"
