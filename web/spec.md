Before:

```js
{
    workingDirectory: {
        bucketMode: "multi",
        bucketNamePrefix: "",
        bucketNamePrefixGroup: "projet-"
    },
    bookmarkedDirectories: [
        {
            fullPath: "donnees-insee/diffusion/",
            title: {
                fr: "Données de diffusion",
                en: "Dissemination Data"
            },
            description: {
                fr: "Bucket public destiné à la diffusion de données",
                en: "Public bucket intended for data dissemination"
            }
        }
    ]
}
```

After:

```js
{
    bookmarkedDirectories: [
        {
            fullPath: "$1/",
            title: "Personal",
            description: "Personal Bucket",
            claimName: "preferred_username"
        },
        {
            fullPath: "projet-$1/",
            title: "Group $1",
            description: "Shared bucket among members of project $1",
            claimName: "groups",
            excludedClaimPattern: "^USER_ONYXIA$"
        },
        {
            fullPath: "donnees-insee/diffusion/",
            title: {
                fr: "Données de diffusion",
                en: "Dissemination Data"
            },
            description: {
                fr: "Bucket public destiné à la diffusion de données",
                en: "Public bucket intended for data dissemination"
            }
        }
    ];
}
```
