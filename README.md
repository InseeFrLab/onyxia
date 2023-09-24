
# Onyxia CI Workflow action

Making changes:  

```bash
git clone https://github.com/InseeFrLab/onyxia onyxia-gh-actions
cd onyxia-gh-actions
git checkout gh-actions
yarn install

# ...Change the code...

# This command will generate the an updated ./index.js
# You must commit this file, it's what's been run by GitHub Actions.  
yarn build
```

## Usage  

This might not be up to date. It's just to give you the idea.  
For the actual usage see [the real workflow](https://github.com/InseeFrLab/onyxia/blob/main/.github/workflows/ci.yml).  

```yaml
name: ci
on:
  push:
    branches:
      - main
  pull_request:
    branches:
      - main

permissions:
  actions: read
  contents: write
  pages: write

jobs:

  test:
    runs-on: ubuntu-latest
    if: github.actor != 'actions@github.com'
    steps: 
      - run: echo "test"
  
  prepare_release:
    needs: test
    runs-on: ubuntu-latest
    outputs:
      new_chart_version: ${{steps._.outputs.new_chart_version}}
      new_web_docker_image_tags: ${{steps._.outputs.new_web_docker_image_tags}}
      release_target_git_commit_sha: ${{steps._.outputs.release_target_git_commit_sha}}
      release_message: ${{steps._.outputs.release_message}}
    steps:
      - uses: InseeFrLab/onyxia@gh-actions
        id: _
        with: 
          action_name: prepare_release
          automatic_commit_author_email: actions@github.com
  
  docker_build_push_onyxia_web:
    runs-on: ubuntu-latest
    needs: prepare_release
    if: needs.prepare_release.outputs.new_web_docker_image_tags != ''
    steps:
      - uses: actions/checkout@v3
        with:
          ref: ${{needs.prepare_release.outputs.release_target_git_commit_sha}}
          lfs: true
#      - uses: docker/setup-qemu-action@v1
#      - uses: docker/setup-buildx-action@v1
#      - uses: docker/login-action@v1
#        with:
#          username: ${{ secrets.DOCKERHUB_USERNAME }}
#          password: ${{ secrets.DOCKERHUB_TOKEN }}
#      - uses: docker/build-push-action@v2
#        with:
#          push: true
#          context: .
#          tags: ${{needs.prepare_release.outputs.new_web_docker_image_tags}}
  
  release:
    runs-on: ubuntu-latest
    needs: prepare_release
    if: needs.prepare_release.outputs.new_chart_version != ''
    steps:
    - uses: actions/checkout@v3
      with:
        ref: ${{needs.prepare_release.outputs.release_target_git_commit_sha}}
        lfs: true
    - uses: actions/setup-node@v3
    - uses: bahmutov/npm-install@v1
    - run: yarn build
    - run: npx keycloakify
      env:
        XDG_CACHE_HOME: "/home/runner/.cache/yarn"
    - run: mv build_keycloak/target/*.jar keycloak-theme.jar
    - uses: yogeshlonkar/wait-for-jobs@v0
      with:
        gh-token: ${{secrets.GITHUB_TOKEN}}
        ignore-skipped: 'true'
        jobs: docker_build_push_onyxia_web
        ttl: '10'
    - uses: InseeFrLab/onyxia@gh-actions
      with: 
        action_name: release_helm_chart
        sha: ${{needs.prepare_release.outputs.release_target_git_commit_sha}}
    - uses: softprops/action-gh-release@v1
      with:
        name: Release v${{needs.prepare_release.outputs.new_chart_version}}
        body: ${{needs.prepare_release.outputs.release_message}}
        tag_name: v${{needs.prepare_release.outputs.new_chart_version}}
        target_commitish: ${{needs.prepare_release.outputs.release_target_git_commit_sha}}
        generate_release_notes: true
        files: |
          keycloak-theme.jar
          onyxia-${{needs.prepare_release.outputs.new_chart_version}}.tgz
      env:
        GITHUB_TOKEN: ${{secrets.GITHUB_TOKEN}}
```


