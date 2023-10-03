
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

  test_web:
    runs-on: ubuntu-latest
    steps:
      - uses: InseeFrLab/onyxia@gh-actions
        with: 
          action_name: checkout
          sub_directory: web
      - uses: actions/setup-node@v3.8.1
      - uses: bahmutov/npm-install@v1.8.35
      - run: yarn build
      - run: npx keycloakify
        env:
          XDG_CACHE_HOME: "/home/runner/.cache/yarn"

  test_helm-chart:
    runs-on: ubuntu-latest
    steps:
      - uses: InseeFrLab/onyxia@gh-actions
        with: 
          action_name: checkout
          sub_directory: helm-chart
      - uses: azure/setup-helm@v3.5
        with:
          token: ${{github.token}}
      - run: helm lint .
  
  prepare_release:
    needs: 
      - test_web
      - test_helm-chart
    runs-on: ubuntu-latest
    outputs:
      new_web_docker_image_tags: ${{steps._.outputs.new_web_docker_image_tags}}
      new_chart_version: ${{steps._.outputs.new_chart_version}}
      release_name: ${{steps._.outputs.release_name}}
      release_body: ${{steps._.outputs.release_body}}
      release_tag_name: ${{steps._.outputs.release_tag_name}}
      target_commit: ${{steps._.outputs.target_commit}}
      web_tag_name: ${{steps._.outputs.web_tag_name}}
    steps:
      # NOTE: The code for this action is in the gh-actions branch of this repo
      - uses: InseeFrLab/onyxia@gh-actions
        id: _
        with: 
          action_name: prepare_release
  
  publish_web_docker_image:
    runs-on: ubuntu-latest
    needs: prepare_release
    if: needs.prepare_release.outputs.new_web_docker_image_tags != ''
    steps:
      - uses: InseeFrLab/onyxia@gh-actions
        with: 
          action_name: checkout
          sub_directory: web
          sha: ${{needs.prepare_release.outputs.target_commit}}
      - uses: docker/setup-qemu-action@v3.0.0
      - uses: docker/setup-buildx-action@v3.0.0
      - uses: docker/login-action@v3.0.0
        with:
          username: ${{secrets.DOCKERHUB_USERNAME}}
          password: ${{secrets.DOCKERHUB_TOKEN}}
      - uses: docker/build-push-action@v5.0.0
        with:
          push: true
          context: .
          tags: ${{needs.prepare_release.outputs.new_web_docker_image_tags}}
          build-args: CHART_VERSION=${{needs.prepare_release.outputs.new_chart_version}}

  
  release:
    runs-on: ubuntu-latest
    needs: prepare_release
    if: needs.prepare_release.outputs.new_chart_version != ''
    steps:
      - uses: InseeFrLab/onyxia@gh-actions
        with: 
          action_name: checkout
          sub_directory: web
          sha: ${{needs.prepare_release.outputs.target_commit}}
      - uses: actions/setup-node@v3.8.1
      - uses: bahmutov/npm-install@v1.8.35
      - run: yarn build
      - run: npx keycloakify
        env:
          XDG_CACHE_HOME: "/home/runner/.cache/yarn"
          KEYCLOAKIFY_THEME_VERSION: ${{needs.prepare_release.outputs.new_chart_version}}
      - run: mv build_keycloak/target/*.jar keycloak-theme.jar
      - uses: yogeshlonkar/wait-for-jobs@v0.1.8
        with:
          ignore-skipped: true
          jobs: publish_web_docker_image
          ttl: 10
      - uses: InseeFrLab/onyxia@gh-actions
        with: 
          action_name: release_helm_chart
          sha: ${{needs.prepare_release.outputs.target_commit}}
      - uses: InseeFrLab/onyxia@gh-actions
        if: needs.prepare_release.outputs.web_tag_name != ''
        with:
          action_name: create_tag
          tag_name: ${{needs.prepare_release.outputs.web_tag_name}}
          sha: ${{needs.prepare_release.outputs.target_commit}}
      - uses: softprops/action-gh-release@v1
        with:
          name: ${{needs.prepare_release.outputs.release_name}}
          body: ${{needs.prepare_release.outputs.release_body}}
          tag_name: ${{needs.prepare_release.outputs.release_tag_name}}
          target_commitish: ${{needs.prepare_release.outputs.target_commit}}
          generate_release_notes: true
          files: |
            keycloak-theme.jar
            onyxia-${{needs.prepare_release.outputs.new_chart_version}}.tgz
        env:
          # NOTE: We can't use github.token because it would not trigger the dispatch workflow.
          GITHUB_TOKEN: ${{secrets.MY_GITHUB_TOKEN}}
```


