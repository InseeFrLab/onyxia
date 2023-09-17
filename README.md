
# github_actions_toolkit

```bash
npm install
npm run build
```

Example use:  
```yaml
  trigger-deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: InseeFrLab/paris-sspcloud@github_actions
        with: 
          action_name: update_onyxia_web
          github_token: ${{secrets.PAT_FOR_COMMIT}}
```

