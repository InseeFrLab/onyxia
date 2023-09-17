
import { action } from "../actions/assess_release_criteria";

action({
    "actionParams": {
        "github_token": "ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
        "owner": "InseeFrLab",
        "repo": "onyxia",
        "sha": "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
        "commit_author_email": "actions@github.com",
    },
    "core": {
        "debug": console.log,
    }
});

