### **0.57.1** (2022-07-17)  
  
- Allow string, object and array not to have a default in shema.values.json    
  
## **0.57.0** (2022-07-17)  
  
- Merge pull request #310 from InseeFrLab/new_value_shema_syntax

New value shema syntax  
- Do not restrict the type of startupProbe  
- Add startupProbe  
- Fix ci  
- #307  
- #311  
- Add region.tolerations and region.from to onyxia form values  
- Better error log when values.shema.json is not OK  
- Be more resilient overriding defaults  
- Be resilient if the path of overwriteDefaultWith dosen't exsits  
- Release beta  
- Implement new way to inject values in values.shema.json    
  
### **0.56.7** (2022-07-08)  
  
- Remove the use of 'locale' in JWT    
  
### **0.56.6** (2022-07-06)  
  
- Update keycloakify (fix login-verify-email.ftl)    
  
### **0.56.5** (2022-07-03)  
  
- Fix field description not showing up  
- update i18nifty    
  
### **0.56.4** (2022-06-29)  
  
- Add email tempate for Keycloak theme  
- rename the email template dir    
  
### **0.56.3** (2022-06-28)  
  
- Fix bug when user decide not to connect  
- fmt  
- Update README.md  
- Create CONTRIBUTING.md  
- Update README.md  
- Update README.md  
- Update README.md    
  
### **0.56.2** (2022-06-19)  
  
  
  
### **0.56.1** (2022-06-16)  
  
- Fix hot switching of project    
  
## **0.56.0** (2022-06-16)  
  
- Replace legacy s3 explorateur by the new one, the old one is still accecible in dev mode  
- Correct minio command    
  
### **0.55.17** (2022-06-07)  
  
- Inject kafka params in Mustach    
  
### **0.55.16** (2022-06-07)  
  
- Upgrade keycloak-js    
  
### **0.55.15** (2022-06-06)  
  
  
  
### **0.55.14** (2022-06-06)  
  
- 2min timeout for REST request  
- Fix wrongfully displayed message 'There isn't an onyxia-api hosted at...'  
- REST API timeout 10s    
  
### **0.55.13** (2022-06-06)  
  
- Add missing content type for Gzip    
  
### **0.55.12** (2022-06-05)  
  
- update i18nifty  
- enable gzip    
  
### **0.55.11** (2022-06-05)  
  
  
  
### **0.55.10** (2022-06-04)  
  
- Reverse order of restorable package config    
  
### **0.55.9** (2022-06-03)  
  
- Merge pull request #305 from thieryw/william_branch

Update Onyxia-ui and fix account field text bug  
- AccountField: fix middle cell text  
- update onyxia-ui    
  
### **0.55.8** (2022-06-03)  
  
- Migrate to i18nifty    
  
### **0.55.7** (2022-06-02)  
  
  
  
### **0.55.6** (2022-06-02)  
  
- Fix many error related to useRef    
  
### **0.55.5** (2022-06-01)  
  
- Bump version (cangelog ignore)    
  
### **0.55.4** (2022-06-01)  
  
- Compat React 18, fix button bar    
  
### **0.55.3** (2022-05-15)  
  
- No resizing of div when file upload completed    
  
### **0.55.2** (2022-05-15)  
  
- Hover drop area do not resize div    
  
### **0.55.1** (2022-05-14)  
  
- Update onyxia-ui, fix Dialog on small screens  
- Update README.md    
  
## **0.55.0** (2022-05-14)  
  
- Enable to download file with the new s3 explorer  
- Add method for getting the url for downloading file (s3)    
  
### **0.54.2** (2022-05-11)  
  
- Fix go back button on register page    
  
### **0.54.1** (2022-05-08)  
  
- Fix url restoration of YAML  
- Refactor    
  
## **0.54.0** (2022-05-08)  
  
- #302    
  
### **0.53.1** (2022-05-07)  
  
- Use tab spaces instead of tabs    
  
## **0.53.0** (2022-05-07)  
  
- #301  
- #301 fist draft  
- Setup eslint plugin for detecting unused classes    
  
### **0.52.2** (2022-05-04)  
  
- Update CI    
  
### **0.52.1** (2022-05-04)  
  
- update keycloakify  
- Automatically update onyxia-web on different repos    
  
## **0.52.0** (2022-05-02)  
  
- Prevent auto launch with custom script not matching pattern  
- Inject allowedURIPattern in mustach params    
  
### **0.51.1** (2022-04-29)  
  
- Upgrade keycloakify  
- Make ViewPortAdapter configuration more straight forward  
- Refactor ViewPortAdapter  
- Update onyxia-ui    
  
## **0.51.0** (2022-04-26)  
  
- JWT_FAMILY_NAME and JWT_FIRST_NAME are optional    
  
### **0.50.7** (2022-04-22)  
  
- Do not create a new oidcClient if we share the same keycloak client for minio  
- Refactor vaultSecretsManagerClient adapter    
  
### **0.50.6** (2022-04-21)  
  
- Orange fix loop single kc client with vault    
  
### **0.50.5** (2022-04-20)  
  
- Update email theme  
- Add keycloak theme email  
- update keycloakify    
  
### **0.50.4** (2022-04-18)  
  
- Compile standalong keycloak theme with every release  
- Update onyxia-ui  
- Delete noUndefined.ts  
- correct some chinese translation to make it nicer    
  
### **0.50.3** (2022-04-06)  
  
- Add china in language filter  
- finish all translation  
- add zh translation for explorer  
- add translation of home  
- add translation for catalog launcher  
- add translation for service use timer  
- Support chinese in elementToSentence  
- add account translation  
- add first chinese translation    
  
### **0.50.2** (2022-04-05)  
  
- subchart always enabled #297    
  
### **0.50.1** (2022-04-04)  
  
- Fix regression in catalog    
  
## **0.50.0** (2022-04-04)  
  
- Checkmark when upload complete  
- Update README.md  
- Draging anywhere opens the upload modal  
- Fix spacing on upload dialog  
- Fix re-reender bug  
- Fix s3 command translator  
- Implement ExplorerUploadModal  
- Fix bottom spacing on SVG  
- Implement isFailed state for ExplorerUploadProgress    
  
### **0.49.5** (2022-04-03)  
  
  
  
### **0.49.4** (2022-04-03)  
  
- Clean fixed size for ExplorerUploadProgress    
  
### **0.49.3** (2022-04-02)  
  
- Implement ExplorerUploadProgress    
  
### **0.49.2** (2022-04-02)  
  
- Implement ExplorerUploadModalDropArea    
  
### **0.49.1** (2022-04-02)  
  
- Use css shadow instead of svg  
- Attempt to use Explorer Icon  
- Implement ExplorerIcon component    
  
## **0.49.0** (2022-03-31)  
  
- Support catalog switching #296    
  
### **0.48.12** (2022-03-31)  
  
- Set everything up to be able to switch catalog    
  
### **0.48.11** (2022-03-31)  
  
- Refactor Language support  
- Refactor Catalog page header    
  
### **0.48.10** (2022-03-30)  
  
- Inject project.basic in mustch params  
- Remove unessesary wrapping (unconsequential)    
  
### **0.48.9** (2022-03-28)  
  
- Fix bug in useApplyLanguageSelectedAtLogin    
  
### **0.48.8** (2022-03-27)  
  
- Smarter core provider  
- Change icon for file explorer  
- Remove emotion warning in storybook  
- Fix storybook reload  
- Storybook fixes    
  
### **0.48.7** (2022-03-26)  
  
- Feat: Upload file s3    
  
### **0.48.6** (2022-03-25)  
  
- Better management of JWT token    
  
### **0.48.5** (2022-03-20)  
  
- Refresh OIDC Access token 25 second before it expires if user activity detected  
- Dispatch update to dev.insee.io    
  
### **0.48.4** (2022-03-15)  
  
- Allow missing groups in the JWT (soon we won't need to read it)    
  
### **0.48.3** (2022-03-14)  
  
- Use arrow function notation in types  
- Remove legacy type    
  
### **0.48.2** (2022-03-14)  
  
- Fix legacy account without locale on JWT    
  
### **0.48.1** (2022-03-14)  
  
- Tooling for updating email accept list    
  
## **0.48.0** (2022-03-14)  
  
- update yarn.lock  
- Big refactor    

**Breaking changes**:  
- The `OIDC` therm in environements variables has been replaced by `KEYCLOAK`, example: `OIDC_URL` becomes `KEYCLOAK_URL`.  
- We have inverted `OIDC` (now `KEYCLOAK`) and `VAULT`, example `OIDC_VAULT_URL` becomes `VAULT_KEYCLOAK_URL`.  
See the `.env` file for more info.

### **0.47.3** (2022-03-11)  
  
- Update onyxia-ui    
  
### **0.47.2** (2022-03-11)  
  
- Fix bug with button in login  
- Fix typo in training button    
  
### **0.47.1** (2022-03-07)  
  
- Update dependencies  
- Start a new component to upload files  
- refactor useEvt    
  
## **0.47.0** (2022-03-06)  
  
- Feat: S3 explorer, remove file and directories  
- Feature deleting s3 file in explorer    
  
### **0.46.2** (2022-03-06)  
  
- Fix bug with copy password    
  
### **0.46.1** (2022-03-05)  
  
- Improve the UX of the creating s3 directories    
  
## **0.46.0** (2022-03-05)  
  
- Bump version (changlog ignore)  
- Create s3 directory dialog production ready  
- Feat directory creation modal  
- Update URL for Trainings page    
  
### **0.45.1** (2022-03-01)  
  
- Merge pull request #290 from alexisdondon/fab_icons

adding icon on folder ui  
- adding icon on folder ui    
  
## **0.45.0** (2022-02-28)  
  
- Feature creating directory s3  
- Fix bug opening in new tab    
  
### **0.44.3** (2022-02-26)  
  
- Fix s3 navigation  
- Update ci.yml    
  
### **0.44.2** (2022-02-23)  
  
- Fix starting without s3    
  
### **0.44.1** (2022-02-23)  
  
- Gives warning when regions says s3 is enable without providing keycloak config and we don't have keycloak config to fallback to in the onyxia-web envs  
- Give startup error if vault is defined but not oidc url    
  
## **0.44.0** (2022-02-21)  
  
- Add video of the new explorer  
- Remove legacy secret explorer  
- Opacity transition for displaying file  
- Consistent naming convention for ApiLogBar  
- Do not refresh portion of the ui that dosen't need to  
- Feature refresh opened secret  
- Fix secret editor  
- Fix restore openend file from url  
- Unconsequential refactor  
- Prevent flickering when coming back to an opened file  
- Restore the secret editor  
- Hot swiping of project when file is opened  
- Connect secret editor  
- Do not display directory header on level 0  
- Copy the correct portion of the path when 'use in service'  
- Hardcode path depth to 1  
- Fix breadcrumb navigation  
- Remove console.log  
- Enable restore opened file from url  
- Fix bugs when opening file in the explorer  
- Rename path -> directoryPath to reduce confusion  
- Implement mechanism for opening file in new explorer    
  
### **0.43.7** (2022-02-19)  
  
- Re arange the meta tags    
  
### **0.43.6** (2022-02-19)  
  
- Update cra-envs  
- Update tsafe    
  
### **0.43.5** (2022-02-17)  
  
- Fix createAwsBucket request    
  
### **0.43.4** (2022-02-17)  
  
- use application/x-www-form-urlencoded for createAwsBucket post request    
  
### **0.43.3** (2022-02-17)  
  
- Warn about expected cors error    
  
### **0.43.2** (2022-02-17)  
  
- createAwsBucket is a post method    
  
### **0.43.1** (2022-02-16)  
  
- only test if bucket exist with minio    
  
## **0.43.0** (2022-02-16)  
  
- Use proxy method to creat AWS bucket to bypass CORS  
- Merge pull request #286 from InseeFrLab/marchufschmitt-patch-1

Add a HEADER_USECASE_DESCRIPTION env  
- Add a tab USECASE_DESCRIPTION env    
  
### **0.42.3** (2022-02-14)  
  
- Bump version (changeleog ignore)  
- Provide region in the Minio.Client constructor    
  
### **0.42.2** (2022-02-14)  
  
- Use bucketExists instead of listBuckets    
  
### **0.42.1** (2022-02-14)  
  
- Read s3 token duration from region    
  
## **0.42.0** (2022-02-13)  
  
- Support AWS  
- Lazily create buckets when doesn't exist    
  
### **0.41.1** (2022-02-13)  
  
- Rename minioS3Client -> s3Client (we will support Amazon)    
  
## **0.41.0** (2022-02-13)  
  
- Read s3 configs form region instead of UI envs  
- Remove namespacePrefix from region    
  
### **0.40.11** (2022-02-08)  
  
- Remove legacy favicon    
  
### **0.40.10** (2022-02-08)  
  
- Try to make favicon adapt to the theme  
- Update sample local env for sill    
  
### **0.40.9** (2022-02-08)  
  
- Feature the possibility to hide Onyxia    
  
### **0.40.8** (2022-02-08)  
  
- Modals close itself after click on launch    
  
### **0.40.7** (2022-02-08)  
  
- Fix font for Keycloak + variadic theme    
  
### **0.40.6** (2022-02-08)  
  
- Update cra-envs    
  
### **0.40.5** (2022-02-08)  
  
- Fix previous commit  
- Add sample values for the SILL  
- Enable EJS to run in public/index.html    
  
### **0.40.4** (2022-02-06)  
  
- Update copyright date    
  
### **0.40.3** (2022-02-06)  
  
- Prevent search while not fetched    
  
### **0.40.2** (2022-02-06)  
  
- Support strings as TOS    
  
### **0.40.1** (2022-02-06)  
  
- Restore loading all fonts, we can't rely on envs on keycloak pages    
  
## **0.40.0** (2022-02-06)  
  
- Rename LibProvide -> CoreProvider  
- Use JSON for providing the therms url  
- Fix bug in catalog explorer search bar    
  
## **0.39.0** (2022-02-06)  
  
- Make the header links configurable    
  
### **0.38.3** (2022-02-06)  
  
- Make favicon adapte to theme    
  
### **0.38.2** (2022-02-06)  
  
- Prepare for being able to switch catalog  
- Do not attempt to hot swap region    
  
### **0.38.1** (2022-02-06)  
  
- add debug information if HIGHLIGHTED_PACKAGES isn't correct  
- Verry small adjustment to correct an overflow issue with marian font  
- Use EJS to preload the right font  
- Auto background of the right color  
- Remove meta url, we can't know statically  
- Make the social media card image adapt to the theme  
- Remove broken and useless manifest file  
- Remove legacy immage assets  
- Remove legacy page content  
- Remove public/samples  
- Remove legacy js file in public  
- Remove legacy assets  
- Custom description in meta card everywhere  
- Make it possible to customize the description in the social card  
- Disabled features are not grayed but absent from leftBar  
- Remove legacy icons import  
- Automatically adapt the title based on envs  
- Improve comments    
  
## **0.38.0** (2022-02-06)  
  
- Remove extra <title>  
- Get the higlighted packages from ENV  
- Enable to disable homepage    
  
### **0.37.1** (2022-02-05)  
  
- Adjust usecase header title    
  
## **0.37.0** (2022-02-05)  
  
- Rename env variable from HEADER_TITLE to HEADER_ORGANIZATION, add a way to customize the text 'Datalab' in the header  
- Add video in readme    
  
## **0.36.0** (2022-02-05)  
  
- Add loading icon in the readme    
  
## **0.35.0** (2022-02-05)  
  
- Always open the readme after launching a service  
- Unclutter the url on the my services page  
- Translate the modal buttons  
- Button keep same size when text changes  
- Fix clipboard issues #277  
- Fix bug in detection if service password is present in postinstall notes  
- Revert to only one parameter: autoLaunch (delete autoOpen)  
- autoOpenK8sSubdomain -> autoOpenServiceId  
- Modify get post install info modal, add a button to copy and launch  
- Auto open post install instruction url param    
  
### **0.34.1** (2022-01-30)  
  
- TextArea renders on three collums    
  
## **0.34.0** (2022-01-30)  
  
- Support render as TextArea    
  
### **0.33.1** (2022-01-25)  
  
- Better setup for Kc pages  
- Update clean-redux, renamed redux-clean-architecture    
  
## **0.33.0** (2022-01-21)  
  
- Merge pull request #281 from InseeFrLab/dynamic_links_in_left_bar

Dynamic links in left bar  
- Update ./vscodesettings.json  
- Extra links in LeftBar from env  
- Restoring INSEE files  
- Rebuilded yarn.lock, deleted extra env var  
- Merged remote    
  
### **0.32.3** (2022-01-20)  
  
- Update Keycloakify, compat with 16.1.0    
  
### **0.32.2** (2022-01-18)  
  
- Make s3 token request compat with AWS S3    
  
### **0.32.1** (2022-01-18)  
  
- Dockerfile build step no not require node    
  
## **0.32.0** (2022-01-17)  
  
- Merge pull request #279 from sathieu/patch-1

Fix container has runAsNonRoot and image has non-numeric user (nginx), cannot verify user is non-root  
- Fix container has runAsNonRoot and image has non-numeric user (nginx), cannot verify user is non-root    
  
## **0.31.0** (2022-01-17)  
  
- Fix previous build

Signed-off-by: garronej <joseph.garrone.gj@gmail.com>  
- k8s.initScript url in deployment region    
  
## **0.30.0** (2022-01-16)  
  
- Implement full sync between url and exporer state

Signed-off-by: garronej <joseph.garrone.gj@gmail.com>  
- Restore path when returning to explorer

Signed-off-by: garronej <joseph.garrone.gj@gmail.com>  
- https://github.com/typehero/type-route/issues/89  
- Fix / at the end of directories in new explorer    
  
## **0.29.0** (2022-01-15)  
  
- Refactor getRandomSubdomain  
- The correct abbr for kubernetes is k8s not k8    
  
## **0.28.0** (2022-01-14)  
  
- Reuse the kub subdomain in service id  
- Kubernetes cluster domain and random in mustach params    
  
### **0.26.25** (2022-01-07)  
  
- Update clean-redux    
  
### **0.26.24** (2022-01-03)  
  
- Explorers: ongoing operations are independent from cwd  
- Fix some bugs in the explorers  
- General explorer refactor  
- No spellcheck for filename    
  
### **0.26.23** (2022-01-01)  
  
- Disable storybook build until we can remove scss  
- Add login page expired theme    
  
### **0.26.22** (2021-12-29)  
  
- Implement event canceling in explorer    
  
### **0.26.21** (2021-12-28)  
  
- Update keycloak    
  
### **0.26.20** (2021-12-27)  
  
- Enable new explorers in developper mode    
  
### **0.26.19** (2021-12-27)  
  
- update homegrown dependencies  
- Avoid using ts-ignore as cra applies it globally, remove a lot of legacy files  
- fix minor type error    
  
### **0.26.18** (2021-12-26)  
  
- Rename router into routes  
- Setup the new versions of mySecrets and myFiles, disabled by default    
  
### **0.26.17** (2021-12-26)  
  
- Feature project hot swiping on myServices page    
  
### **0.26.16** (2021-12-25)  
  
- https://github.com/InseeFrLab/onyxia-ui/issues/9    
  
### **0.26.15** (2021-12-25)  
  
- Setup evtAction middleware from clean-redux    
  
### **0.26.14** (2021-12-22)  
  
- Prevent reloading app when project is changed  
- Fix bug in how tokens are cached    
  
### **0.26.13** (2021-12-22)  
  
- Update dokerfile  
- Tyr to fix storybook build  
- Use ts_ci instean of github_action_toolkit    
  
### **0.26.12** (2021-12-22)  
  
- Fix ci pipeline  
- Update react-envs that have been renamed to cra-envs  
- rename lib->core, app->ui  
- Update ci.yml  
- Fix storybook build    
  
### **0.26.10** (2021-12-20)  
  
- Greatly improve architecture, use clean-redux  
- Use tsafe for Reflect()    
  
### **0.26.9** (2021-12-17)  
  
- Update keycloakify  
- Merge pull request #276 from labenech/main

Update s3fs to use https endpoint instead of http  
- Update s3fs to use hhtps endpoint instead of http    
  
### **0.26.8** (2021-12-13)  
  
  
  
### **0.26.7** (2021-12-12)  
  
- Update keycloakify, fix error in logs    
  
### **0.26.6** (2021-12-12)  
  
  
  
### **0.26.5** (2021-12-09)  
  
- The actual ENV is GIT_PERSONAL_ACCESS_TOKEN not GITHUB_TOKEN  
- i18n: Pass translation namespace as a Key  
- i18n: Allow to pass ns as key    
  
### **0.26.4** (2021-12-09)  
  
- Respect naming conventions requiresUserLoggedIn -> getDoRequireUserLoggedIn  
- memoize PageSelector, important since pages are not using memo()    
  
### **0.26.3** (2021-12-08)  
  
  
  
### **0.26.2** (2021-12-08)  
  
- Fix user profile email regexp parsing    
  
### **0.26.1** (2021-12-07)  
  
  
  
## **0.26.0** (2021-12-06)  
  
- Account: Hide sensitive fields    
  
### **0.25.1** (2021-12-02)  
  
- Update tss-react    
  
## **0.25.0** (2021-12-01)  
  
- Merge pull request #274 from sathieu/run_as_nonroot

Run as non-root  
- BREAKING: Run as non-root, and port 8080 only

Fixes: #271
Signed-off-by: Mathieu Parent <mathieu.parent@insee.fr>    
  
### **0.24.1** (2021-11-29)  
  
- minio token: use the real expiration time    
  
## **0.24.0** (2021-11-28)  
  
- MyServices: Warning when tokens are expired  
- typo  
- Add missing CSS classes labels  
- lib: Add aquisition time to vault token  
- lib: Add aquisition time to s3 token    
  
## **0.23.0** (2021-11-27)  
  
- MyServices: Better feedback on what services are shared  
- Merge pull request #273 from sathieu/image-port-8080  
- Change the onyxia-web image to listen on both ports 80 and 8080

See #271    
  
## **0.22.0** (2021-11-26)  
  
- Launcher: share on main card    
  
## **0.22.0** (2021-11-26)  
  
- Launcher: share on main card    
  
## **0.21.0** (2021-11-25)  
  
- Use vault top dir from project  
- Remove hack for bucket name    
  
## **0.20.0** (2021-11-24)  
  
- MyServices: Disable delete button if there is nothing to delete  
- Dialog warning when deleting owned shared services  
- MyService: rephrase the delete all button when all services arnt owned  
- MyServices: Restore trash icon instead of block  
- Rephrase terminate -> delete  
- MyServices: Users can't terminate services that thei haven't launched  
- MyServices: Move sorting and filtering in the lib/ dir    
  
### **0.19.12** (2021-11-23)  
  
- Rename isFirstProject -> isDefaultProject  
- do not scope S3 token policy for default project    
  
### **0.19.11** (2021-11-23)  
  
- Fix cloudshell requesting S3 tokens for nothing  
- Scopped s3 token  
- Account: s3 tab, give minimal loading feedback  
- Update S3Client port and adapter  
- getNewlyRequestedOrChachedToken with parameters    
  
### **0.19.10** (2021-11-23)  
  
- Account: Don't use legacy code to get s3 tokens    
  
### **0.19.9** (2021-11-22)  
  
- redirect /accueil to /home  
- Minor refactor    
  
### **0.19.8** (2021-11-21)  
  
- Fix namespace in monitoring links    
  
### **0.19.7** (2021-11-20)  
  
- Update router.ts    
  
### **0.19.6** (2021-11-20)  
  
- Update package.json  
- Update router.ts    
  
### **0.19.5** (2021-11-19)  
  
- Fix monitoring links in services  
- Fix logic for hiding service that are not ours and not shared  
- Move JSONSchemaObject type def to lib  
- Recognize the 'integer' type in values    
  
### **0.19.2** (2021-11-19)  
  
- #270  
- fix  
- Fix sample envs  
- Fix build  
- Abstract away cmd translation to apiLogger  
- Implement list function for minio adapter  
- Pass s3 port in values    
  
### **0.19.1** (2021-11-16)  
  
- MyServices: Better display for small dialogs    
  
## **0.19.0** (2021-11-16)  
  
- Implement s3 port, we no longer rely on js/  
- fix previous commit (the comment was missplaced)  
- Explain why non reactive API in projectConfigs  
- lib: Abstract the logic of fetching token  
- rename baseUri -> url in vault adapter    
  
### **0.18.7** (2021-11-15)  
  
- Scoped services password    
  
### **0.18.6** (2021-11-15)  
  
  
  
### **0.18.5** (2021-11-15)  
  
- Inject selected project in mustach params  
- Add missing className label    
  
### **0.18.3** (2021-11-15)  
  
- Meaningfull class names, better debugging exp    
  
### **0.18.2** (2021-11-13)  
  
- Replace delete icon by block icon for services    
  
### **0.18.1** (2021-11-13)  
  
- Do not display shared services that are not owned  
- Add an icon to show when share    
  
## **0.18.0** (2021-11-13)  
  
- Enable to show services env  
- Running service: allow show env  
- Fix unstyled link in rendere markdown  
- Display shared services  
- MyService: Restore infoUrl    
  
### **0.17.2** (2021-11-13)  
  
- Fix problem with missing tos    
  
### **0.17.1** (2021-11-12)  
  
- Fix previous build to make it compatible with HELM    
  
## **0.17.0** (2021-11-12)  
  
- Provide therms of services from envs    
  
### **0.16.13** (2021-11-12)  
  
- Refactors envs that are caried over to keycloak  
- Remove old register from translations  
- Remove old register page, force the use of Keycloak user attribute    
  
### **0.16.11** (2021-11-11)  
  
- Login fix email confirmation    
  
### **0.16.10** (2021-11-11)  
  
- Try hotfix    
  
### **0.16.9** (2021-11-11)  
  
- Fix previous build  
- Login: Fix username regexp  
- Fix email regular expression in mock kcContext    
  
### **0.16.7** (2021-11-09)  
  
- Update keycloakify    
  
### **0.16.6** (2021-11-08)  
  
- refactor transferable envs  
- Login: Improve UX on new register page    
  
### **0.16.5** (2021-11-08)  
  
- MyServices: Services turn red only after 7 days    
  
### **0.16.4** (2021-11-07)  
  
- Login: Better displaing of pattern error in register    
  
### **0.16.3** (2021-11-07)  
  
- Login: Inprove parsing of authorized emails    
  
### **0.16.2** (2021-11-07)  
  
- Login: Format pattern in register page    
  
### **0.16.1** (2021-11-07)  
  
- Update onyxia-ui    
  
## **0.16.0** (2021-11-07)  
  
- Update powerhooks, fixes errors in logs  
- Login: Move over translation  
- Login: Refactor register page and fix tabIndex  
- Add missing files from previous commit  
- Login: Minimal working version of new register pages    
  
### **0.15.19** (2021-11-06)  
  
- Update package.json  
- increase minio token lifespan to 7 days    
  
### **0.15.18** (2021-11-05)  
  
- Refactor interface with Onyxia API    
  
### **0.15.17** (2021-11-05)  
  
- Update README.md  
- Fix ipprotection and network policies yet again    
  
### **0.15.16** (2021-11-04)  
  
- Fix language auto detection  
- Add comment to explains assert<Equals<...>> in setup.ts  
- Doc: explain what link_inhouse_deps script is  
- Doc: update doc about config-overrides.js  
- Doc: Explain what config-overrides.js is    
  
### **0.15.15** (2021-10-31)  
  
- Stories: rename width -> containerWidth    
  
### **0.15.14** (2021-10-31)  
  
- i18n: Rename resources.ts -> translations.ts  
- Header: Refactor and fix storybook  
- Remove Dockerfile.ci  
- Delete Dockerfile  
- Delete CONTRIBUTING.md    
  
### **0.15.13** (2021-10-26)  
  
- Fix previous build    
  
### **0.15.12** (2021-10-26)  
  
- Form: Accept string as boolean values in value.shema.json    
  
### **0.15.11** (2021-10-25)  
  
- Merge pull request #267 from InseeFrLab/injection-region-form

propal  
- Mustache: provide defaultIpProtection and defaultIpPolicy    
  
### **0.15.10** (2021-10-25)  
  
- MyServices: Fix blue screen when opening services    
  
### **0.15.9** (2021-10-20)  
  
- fix: MyServicesSavedConfig    
  
### **0.15.8** (2021-10-19)  
  
- Laucher: Fix display bug on saved services    
  
### **0.15.7** (2021-10-19)  
  
- Launcher: Loading until service is really available (503)    
  
### **0.15.6** (2021-10-19)  
  
- Reload app when project changes    
  
### **0.15.5** (2021-10-19)  
  
- Feat: Minimal project support  
- refactor  
- improve deployment region selection algorithm  
- Update README    
  
### **0.15.4** (2021-10-18)  
  
- AWS_S3_ENDPOINT should have no http    
  
### **0.15.3** (2021-10-18)  
  
- Fix: read palette and title from url    
  
### **0.15.2** (2021-10-18)  
  
- Remove ability to customize theme from keycloak admin    
  
### **0.15.1** (2021-10-18)  
  
- Fix theme hot customization    
  
## **0.15.0** (2021-10-18)  
  
- Fix sotrybook  
- Add gif in the readme  
- #260  
- #263  
- Login: Put default register user profil app  
- Do not restore deployment region that no longer exsist  
- Improve theme customizability  
- Items greyed in the leftbar when no backend  
- Fix focus color  
- Fix Marianne font  
- Feature theme configurability  
- Update fonts and onyxia-ui  
- Update font, Fix FOIT  
- Update Cloudshell icon  
- Update powerhooks  
- Update all deps  
- SecretsTranslator: Smooth fade-in of cmd translator  
- Fix command translator  
- JwtUserApiClient: Fix bug  
- Fix vault client fetching  
- compiles!  
- Fix real adapter of onyxiaClient  
- Fix onyxia mock adapter  
- Implement secret manager client mock adapter  
- Re-implement vault adapter  
- Implement keycloakOidcClient  
- Use the new lib api in app  
- Index selectors  
- index selectors  
- factorize previous commit  
- Make it so we never need dispatch in app/  
- Update store provider  
- Rename type Dependencies -> ExtraThunkArgument  
- Store setup refactor  
- half way through refactoring    
  
### **0.13.1** (2021-09-22)  
  
- Fix previous build    
  
## **0.13.0** (2021-09-22)  
  
- Cleanup ENV needed to start the app  
- Cleanup the envs    
  
### **0.12.9** (2021-09-20)  
  
- Saved Configuration: Saved services in expaded mode    
  
### **0.12.8** (2021-09-18)  
  
- Fix remember me  
- Merge pull request #257 from py-b/patch-1

corrections orthographiques  
- corrections orthographiques  
- Merge pull request #253 from InseeFrLab/marchufschmitt-patch-2-1

Update CatalogLauncherConfigurationCard.tsx    
  
### **0.12.7** (2021-09-17)  
  
- Login: Fix remember me    
  
### **0.12.6** (2021-09-17)  
  
- LeftBar: Refactor  
- Update resources

fix the typing error on header : "tutories" to "tutoriels"    
  
### **0.12.5** (2021-09-16)  
  
- App: Fix major leftbar bug  
- MySecrets: Fix command translation    
  
### **0.12.4** (2021-09-15)  
  
- AppLayout: Fix footer shadow    
  
### **0.12.3** (2021-09-15)  
  
- App layout: Fix leftbar shadow    
  
### **0.12.2** (2021-09-15)  
  
- Confirmation dialog when deleting secret    
  
### **0.12.1** (2021-09-15)  
  
- CatalogExplorer: Show more only on over    
  
## **0.12.0** (2021-09-14)  
  
- Saved configuration: Edit saved configurations    
  
### **0.11.104** (2021-09-14)  
  
- SavedConfigurations: Warning dialog when modifying the config    
  
### **0.11.103** (2021-09-13)  
  
- MySecrets: Fix inconsitencies in breadcrumb  
- MySecrets: Add retractable headers  
- MySecrets: Fix feedback copy in breadcrump    
  
### **0.11.100** (2021-09-13)  
  
- Tabs: Fix problem with scroll tabs    
  
### **0.11.99** (2021-09-13)  
  
- Do not display header on smaller screens    
  
### **0.11.98** (2021-09-12)  
  
- Catalog: Fix header collapse problems    
  
### **0.11.97** (2021-09-10)  
  
- Merge pull request #256 from InseeFrLab/fix-typo-and-ref-to-sspcloud

Fix typo and remove reference to sspcloud    
  
### **0.11.96** (2021-09-08)  
  
- Login: Disable ViewPortAdapter on login pages    
  
### **0.11.95** (2021-09-08)  
  
- App: Animated LeftBar    
  
### **0.11.94** (2021-09-08)  
  
- Catalog Explorer: fix colapsible section    
  
### **0.11.93** (2021-09-07)  
  
- Fix scroll    
  
### **0.11.92** (2021-09-05)  
  
- Use searchbar from onyxia-ui  
- Remove unused component    
  
### **0.11.91** (2021-09-03)  
  
- Catalog: Feat mart scroll  
- Catalog: Spaceing at the bottom of the scroll area  
- Layout: Overflow hidden matters    
  
### **0.11.89** (2021-09-01)  
  
- CatalogExplorer: Better scrollable area    
  
### **0.11.88** (2021-09-01)  
  
- Update dependencies    
  
### **0.11.87** (2021-08-30)  
  
- Feat: Edit saved services    
  
### **0.11.86** (2021-08-27)  
  
- Add documentation and trainings    
  
### **0.11.85** (2021-08-26)  
  
- MySecrets: Fix path navigation    
  
### **0.11.84** (2021-08-26)  
  
- MySecrets: Fix display of icons    
  
### **0.11.83** (2021-08-26)  
  
- remove link underline login pages    
  
### **0.11.82** (2021-08-26)  
  
- Fix storybook  
- Launcher: Little fix on saved services  
- Contribute to the project point to onyxia-web  
- Align header and footer with Marc's design  
- Remove Tranings and shared services  
- Add link to community's website  
- Fixing some more css bugs  
- Many small css fixes  
- Minor css fixes  
- Still bugs but compiles with big library update    
  
### **0.11.81** (2021-08-20)  
  
- Launcher: Validate fields immediadly    
  
### **0.11.80** (2021-08-19)  
  
- Press escape to restore default values    
  
### **0.11.79** (2021-08-19)  
  
- Make it impossible to launch service with incorrect configs  
- Refactor hidden field feature    
  
### **0.11.78** (2021-08-19)  
  
- Translation for malformed values    
  
### **0.11.77** (2021-08-19)  
  
- Feat fields validation with regexp in chart    
  
### **0.11.76** (2021-08-17)  
  
- link to new documentation    
  
### **0.11.75** (2021-08-17)  
  
- Capitalize slider label    
  
### **0.11.74** (2021-08-17)  
  
- Remove wigleing in sliders    
  
### **0.11.73** (2021-08-16)  
  
- feat range slider in catalog launcher  
- add todo debug log  
- extra infos support for slider  
- Implement simple slider  
- Implement range slider  
- Implement logic for range slider  
- unit and step not needed in up extremity  
- Add samples to help read the types def  
- Improve slider types  
- Fix error sliderStep is number  
- Writing types definition for sliders  
- First working draft of DoubleSlider    
  
### **0.11.72** (2021-08-10)  
  
- Give more insightfull error when we can't tell if a feild should be shown    
  
### **0.11.71** (2021-08-05)  
  
- Provide dummy project infos in mustache params    
  
### **0.11.70** (2021-08-04)  
  
- Hide non relevent fields    
  
### **0.11.69** (2021-08-01)  
  
- Fix copy to clipboard function    
  
### **0.11.68** (2021-08-01)  
  
- Fix bug introduced by previous commit  
- Add auto launch option    
  
### **0.11.67** (2021-08-01)  
  
  
  
### **0.11.66** (2021-08-01)  
  
- If there is less than 5 cards do not display show more    
  
### **0.11.65** (2021-08-01)  
  
- Do not display acess to source when there is no sources    
  
### **0.11.64** (2021-08-01)  
  
- Fix laucher for Trainings    
  
### **0.11.63** (2021-07-30)  
  
- Fix previous commit  
- Merge pull request #250 from InseeFrLab/marchufschmitt-patch-1

Update CatalogLauncherConfigurationCard.tsx  
- Update CatalogLauncherConfigurationCard.tsx

Change gap of row (config forms)  
- Update font (subtitle to label1)    
  
### **0.11.62** (2021-07-29)  
  
- Add padding to header  
- Delete unused fonts    
  
### **0.11.61** (2021-07-26)  
  
- Update general App layout  
- Update theme switch icon button    
  
### **0.11.59** (2021-07-22)  
  
- Responsive size for service icon  
- Icon and title on the same line    
  
### **0.11.58** (2021-07-22)  
  
- Rework headers    
  
### **0.11.57** (2021-07-22)  
  
- Responsivness of cards    
  
### **0.11.56** (2021-07-22)  
  
- New Onyxia-ui fixes    
  
### **0.11.55** (2021-07-21)  
  
- #248  
- Use random instead of epoch for serviceId  
- Provide name when launching service  
- Update deps  
- add evt in inhouse deps list  
- fix spacing and App structure  
- MySecrets, correcting link to documentation

Issue is: https://github.com/InseeFrLab/onyxia-web/issues/247  
- Big DS update #242  
- MySecrets, correcting link to documentation

Issue is: https://github.com/InseeFrLab/onyxia-web/issues/247  
- Do not store OIDC Access token in localStorage    
  
### **0.11.54** (2021-07-06)  
  
- Inject git token    
  
### **0.11.53** (2021-07-05)  
  
- Add specific job poke_gitops    
  
### **0.11.52** (2021-07-04)  
  
- Use specific secret to dispatch to paris-sspcloud  
- update tsafe  
- Add dispatch action for complete CD    
  
### **0.11.51** (2021-07-03)  
  
- Update keycloakify    
  
### **0.11.50** (2021-07-02)  
  
- Bump version  
- Fix previous build    
  
### **0.11.49** (2021-07-02)  
  
- Put agent connect in first    
  
### **0.11.48** (2021-06-29)  
  
- Fix unformatted messages    
  
### **0.11.47** (2021-06-29)  
  
  
  
### **0.11.46** (2021-06-29)  
  
- Fix register tooltip    
  
### **0.11.45** (2021-06-29)  
  
- Login: Fix password confirm and allow click on register    
  
### **0.11.44** (2021-06-29)  
  
- Login: Upgrade to Keycloakify 2.0    
  
### **0.11.43** (2021-06-28)  
  
- Login: Update the agent connect button  
- Stories: Customizable width container    
  
### **0.11.42** (2021-06-28)  
  
- MyServices: Service url is always first (alphabetical ordering)    
  
### **0.11.41** (2021-06-22)  
  
- Update onyxia-ui. Fix font sizes    
  
### **0.11.40** (2021-06-19)  
  
- Use Onyxia API to get the public ip #241  
- Add screenshot of the new home    
  
### **0.11.39** (2021-06-19)  
  
- Improve Login page hergonomy #237    
  
### **0.11.38** (2021-06-19)  
  
- Fix resources  
- 503: Update hash  
- Catalog: Update page header icon  
- New SVG Icon for MyServices  
- Text detail corrections    
  
### **0.11.37** (2021-06-17)  
  
- Account: Fix header text    
  
### **0.11.36** (2021-06-17)  
  
- Attempt at fixing meta tags  
- Restore padding    
  
### **0.11.34** (2021-06-17)  
  
- Change the key to avoid 503    
  
### **0.11.33** (2021-06-17)  
  
- Home: Small padding fix    
  
### **0.11.32** (2021-06-17)  
  
- Home: Remove extra padding that causes the content to overflow    
  
### **0.11.31** (2021-06-17)  
  
- index: try to fix meta tags  
- Login: Smaller agent connect immage    
  
### **0.11.30** (2021-06-17)  
  
- Update TOS fr  
- Update metta and smaller home immage    
  
### **0.11.29** (2021-06-17)  
  
- Merge pull request #238 from linogaliana/patch-1

correction typo  
- Home: Perfect pacement of the illustration  
- Good version of the new homepage  
- coquille ici aussi    
  
### **0.11.28** (2021-06-17)  
  
- Add meta tags to index.html    
  
### **0.11.27** (2021-06-15)  
  
- Remove excessive padding on header in login    
  
### **0.11.26** (2021-06-15)  
  
- Enable zoom provider for some screen size on login    
  
### **0.11.25** (2021-06-15)  
  
- Update workflow (should fix favicon)    
  
### **0.11.24** (2021-06-15)  
  
- AgentConnect: Implement minimal safe update profile  
- Make the Login more responsive  
- Small css fix on login  
- Integrate AgentConnect button  
- AgentConnect button done  
- First draft Agent Connect button    
  
### **0.11.23** (2021-06-14)  
  
  
  
### **0.11.22** (2021-06-14)  
  
- Update Keycloak Theme  
- Update README.md    
  
### **0.11.20** (2021-06-14)  
  
  
  
### **0.11.19** (2021-06-13)  
  
- MyServices: Dialogs for cofirm deletion    
  
### **0.11.18** (2021-06-13)  
  
- Display post installation notes  
- CatalogExplorer: Restore the search bar on page reload    
  
### **0.11.17** (2021-06-13)  
  
- Fix splashscreen (again)    
  
### **0.11.16** (2021-06-13)  
  
- Fix the splash screen    
  
### **0.11.15** (2021-06-13)  
  
- MyServices: Rotate can-visit api servers to mitigate rate limit  
- MyServices: Implement best effort strategies for non standard workspace    
  
### **0.11.14** (2021-06-12)  
  
- MyServices: 503 prospection using 3rd party service    
  
### **0.11.13** (2021-06-12)  
  
- MyServices: If we can't get the status don't bother waiting    
  
### **0.11.12** (2021-06-12)  
  
- MyServices: Increace delay yey again    
  
### **0.11.11** (2021-06-12)  
  
- MyServices: Increace delay when cors problems    
  
### **0.11.10** (2021-06-12)  
  
- MySearvices: Use head and increace delay    
  
### **0.11.9** (2021-06-12)  
  
- MyServices: Deal with CORS error on safary and chrome    
  
### **0.11.8** (2021-06-12)  
  
- CatalogExplorer: Search string in url    
  
### **0.11.7** (2021-06-12)  
  
- MyServices: Fix infinite loading on some namespaces  
- Launcher: After launching the service wait until it has been added    
  
### **0.11.6** (2021-06-11)  
  
- MyServices: Fallback logo    
  
### **0.11.5** (2021-06-11)  
  
- Fix favicon  
- MyServices: Avoid reloading for local link  
- Footer: use url instead of href    
  
### **0.11.4** (2021-06-11)  
  
- MyServices: Fetch S3 credentials before loading the form    
  
### **0.11.3** (2021-06-11)  
  
- MyServices: Fix bug with apps with no tasks    
  
### **0.11.2** (2021-06-11)  
  
- MyServices: Friendly names saved config fix  
- Login: Fix dark mode not carried over    
  
### **0.11.1** (2021-06-11)  
  
- MyServices: Update wording    
  
## **0.11.0** (2021-06-11)  
  
- MyServices: Fix 503 errors  
- MyServices: Fix saved config deletion  
- MyServices: Restore config in same tab  
- MyServices: Loding icon in place of button while service not yet ready  
- MyServices: Ordering bt launch time  
- MyServices: Better count since strarted  
- MyServices: Disable button when service is starting  
- MyServices: Add call to action when no service running  
- MyServices: Fix reload  
- MyServices: CSS Fixes  
- MyServices: Working, minor bugs remaining  
- MyServices: Implement slice  
- MyServices: lib/ implementation of the port adapter  
- MyServices: Implement route  
- MyServices: implementation of the logic for restoring configs  
- MyServices: Implement running services cards  
- Refactor and small css fixes  
- MyServices: Make restorable configurations scrollable  
- MyServices: Toggle short variant  
- MyServcies: Saved config line  
- MyServices: Impl Option menu  
- MyServices: Complete card  
- MyServices: RunningTime  
- MyServices: Implement badges with border  
- MyServices: moving forward  
- MyServices: Layout fundations    
  
### **0.10.5** (2021-06-07)  
  
- Secrets: Fix icon color  
- Secrets: Fix translation bar  
- onyxia-ui: Incorporate icon customizations  
- Refactor: Put 404 and Portrait warning into pages/  
- Improve portrait mode screen  
- Tabs: Use onMouseDown instead of onClick to switch beteen tabs  
- Account: Fix warning missing key  
- Refactor the way we instantiate the store  
- Fix zoom provider reload on screen notation  
- Update deps  
- Fix getStroy  
- All broken but we are going to changes many things to debug  
- Release with new project name  
- Rename default branch 'main' ( from 'master')  
- Rename onyxia-ui onyxia-web  
- Externalizing design: cd  
- Externalizing design: cd  
- Externalizing design: Isolate zoom provider from theme provider    
  
### **0.10.4** (2021-05-29)  
  
- Launcher: Display more informations    
  
### **0.10.3** (2021-05-28)  
  
- Upgrate keycloakify    
  
### **0.10.2** (2021-05-28)  
  
- Multiple ui fixes    
  
### **0.10.1** (2021-05-27)  
  
- Launcher: Fix broken 0.10 release  
- Replace /x/ by /launcher/ in the url    
  
## **0.10.0** (2021-05-27)  
  
- GHA: Use cache for yarn install  
- Launcher: Add tooltip for 'save this configuratioin'  
- Laucher: Notify dependency with icon  
- Launcher: Replace scrolling bar  
- Launcher: No tab => no expand button  
- Add tab description  
- Add source link in the header  
- Launcher: Fix bookmarking  
- SplashScreen: hide and show do not need to be provided by a hook  
- Splash screen issue fixed  
- Launcher: Implement correct flow  
- Catalog: Link to helm charts sources in the header  
- Secrets: Update the header  
- Launcher: Capitalization  
- Divider with lighter color  
- Launcher: Add divider to configuration cards  
- Launcher: Use built in TextField  
-  Correct a spelling error in the footer  
- Launcher: Improved style of card  
- Home: Fix links  
- CatalogExplorer: Change body color  
- DesignSystem: Fix dialog body color  
- DesignSystem: fix disabled button color  
- Account: Add options to restore dialogs  
- Design system: fix text fields colors  
- Tabs: fix colors  
- theme: Add new surface color  
- theme: rename useCases.survaces.surfaces by xxx.surface1  
- theme: tweak colors  
- Routes: implements separation of consern for form fields querry parameters  
- Launcher: Implement human readable url  
- Launcher: Implement readable urls  
- Launcher: do states update all at once  
- Launcher: fix url bug  
- Launcher: set max width  
- Unoptimize drkmode switching to cope with poor memoization of MUI  
- fmt  
- TextField: Let label break out of container  
- Launcher: Remove unused cx  
- Launcher: implement scroll  
- Launcher: Reorder  
- Do not contrain width of TextField  
- Launcher: Fix enum  
- Launcher: Click on header toggles  
- Launcher: Correctly display tabs  
- Launcher: renders  
- Lancher: Opening animation for tabs  
- Laucher: Form ui component OK  
- Fix babel not compatible with latest TypeScript features  
- update stories  
- Launcher: Compiles  
- Launcher: Refactor dir structure  
- Remove contract preview for now  
- Launcher: Connecting logic and UI  
- Catalogs/Launcher: Refactor selectors  
- Launcher: take into account dependencies  
- implemente memoization for getter thunks  
- Implement choerent model for restoring configurations  
- Launcher: First draft for bookmarked package config  
- Better state management  
- CatalogExplorer: Fix transilitant states  
- Launcher: Serialization of params  
- Special case for service friendlyName  
- Launcher: use title in the form  
- Laucher: mooving on  
- Launcher: Controller  
- Launcher: Main form  
- Acommodate contract preview  
- Catalog Explorer: prepare for easy catalog switching  
- Fix build  
- Launcher: Implement lib part, CatalogExplorer: refactor  
- Implement usecase launcher  
- Launcher: Advanced configuration header  
- Merge pull request #233 from InseeFrLab/launcher

Launcher  
- Add learn more link in catalog  
- Implement Launcher card    
  
### **0.9.6** (2021-05-06)  
  
- Update package.json  
- Merge pull request #232 from InseeFrLab/launcher

Prepare for the new launcher  
- MySecrets: clicking on use in secret gives copy feedback  
- MySecrets: Persiste 'do not display again' choice  
- MySecrets: Add dialog 'use in secret' text  
- Remove fill color in trainings  
- Merge remote-tracking branch 'origin/icon_leftbar' into launcher  
- Add instructions about how to import assets  
- Merge remote-tracking branch 'origin/icon_leftbar' into launcher  
- Merge remote-tracking branch 'origin/marchufschmitt-update-textcontent' into launcher  
- Merge remote-tracking branch 'origin/master' into launcher  
- Update the CI to publish storybook  
- Host video in assets  
- Implement new dialog  
- Implement dialog    
  
### **0.9.5** (2021-05-05)  
  
- Implement footer  
- Fix: Cors error with terms of service  
- Rollback to React 16, not compatible with suspence    
  
### **0.9.4** (2021-05-03)  
  
- update deps, React 17  
- fix safary catalog searchbar on Safari    
  
### **0.9.3** (2021-04-30)  
  
- Update keycloakify  
- Remove links to old catalog    
  
### **0.9.2** (2021-04-29)  
  
- Register: Sync authorized domain email with backend  
- Suport extra text in TextField    
  
### **0.9.1** (2021-04-28)  
  
- Fix: Point toward new catalog in home    
  
## **0.9.0** (2021-04-28)  
  
- release new catalog UI  
- Catalog: Suptile margin changes (changleog ignore)  
- Catalog: Make launch link work (changleog ignore)  
- Remove logs (changlog ignore)  
- Catalog: include splash screen (changlog ignore)  
- Catalog: Implement search not found  
- Fix button height    
  
### **0.8.3** (2021-04-19)  
  
- Fix update password link    
  
### **0.8.2** (2021-04-19)  
  
- Fix url renew password    
  
### **0.8.1** (2021-04-19)  
  
  
  
## **0.8.0** (2021-04-19)  
  
- Release new Account page and fix in minio file explorer  
- Fix direct url for myfiles  
- Working draft of account  
- Make the tooltip work on Icons  
- Impl AccountSectionHeader  
- Change border in strories for more confort    
  
### **0.7.49** (2021-04-16)  
  
- When multiple service url, take the first in alphabetical order  
- Account: editable text ok  
- Account: Toggle  
- Account: Language  
- Account S3 init script  
- First working draft of working Account row  
- Account tabs done    
  
### **0.7.48** (2021-04-14)  
  
- Update package.json  
- Spelling correction to Register    
  
### **0.7.47** (2021-04-14)  
  
- Display the custom name (filled out at the services config step) on My Services page #226    
  
### **0.7.46** (2021-04-13)  
  
- Remove email whitlisting on frontend  
- Sync email whitelist with Keycloak policy  
- AccountTab ok for Marc (refactor left to do)  
- Fix palette error that shoes for disabled button    
  
### **0.7.45** (2021-04-12)  
  
- Fix bug file icon color    
  
### **0.7.44** (2021-04-11)  
  
- Use datalb.sspcloud.fr instead of onyxia.lab.sspcloud.fr    
  
### **0.7.43** (2021-04-11)  
  
- Enable keycloakify --external-assets  
- Refactor CI  
- Bug fix: Password registration always valid    
  
### **0.7.42** (2021-04-10)  
  
- Final fixes on register page    
  
### **0.7.41** (2021-04-09)  
  
- First draft for tabs    
  
### **0.7.40** (2021-04-09)  
  
- Last ui tweaks    
  
### **0.7.39** (2021-04-09)  
  
- Fix logic on register page  
- Implementing terms  
- Border width on TextField thiner  
- Style alerts  
- RegExp for email  
- First draft for new register page  
- Single color variant for TextField  
- Better default for secondary Mui color  
- Clean implementation of TextField  
- Suport non error helper text in TextField    
  
### **0.7.38** (2021-04-06)  
  
- #215: Implement eye icon for the passwork inputs    
  
### **0.7.37** (2021-04-06)  
  
  
  
### **0.7.36** (2021-04-06)  
  
  
  
### **0.7.35** (2021-04-06)  
  
  
  
### **0.7.34** (2021-04-06)  
  
- Auto validate secret row when statring editing another  
- Better styling on secret editor  
- Textfield display info out of it's box  
- Fix error text cropped on last row in secret editor    
  
### **0.7.33** (2021-04-05)  
  
  
  
### **0.7.32** (2021-04-05)  
  
  
  
### **0.7.31** (2021-04-05)  
  
- Disabling autofill on chrome  
- Remove unuser classes and id on login page  
- Remove spell checks on username input  
- Remove keyframe method for tacking autofill (dosen't seems to works on https)    
  
### **0.7.30** (2021-04-05)  
  
  
  
### **0.7.29** (2021-04-05)  
  
- Automatically select submit after autofill    
  
### **0.7.28** (2021-04-05)  
  
  
  
### **0.7.27** (2021-04-05)  
  
  
  
### **0.7.26** (2021-04-04)  
  
- Clean autofill of login on all browsers    
  
### **0.7.25** (2021-04-04)  
  
- Implement per browser speficic handling of the loggin page  
- Update powerhooks (fix dark mode not persisted)    
  
### **0.7.24** (2021-04-04)  
  
- #215: Autocomplete suggestion appears before the form is visible on Safari (actual fix)    
  
### **0.7.23** (2021-04-04)  
  
- #215: Click on logo should redirect to the community website.  
- Do not allow toggling dark mode on login page  
- #215: Autocomplete suggestion appears before the form is visible on Safari  
- #215: Hitting enter doesn't validate form  
- #215: Tab should scip 'cancel' button in login.  
- #215: Autofill options show again for password on Safari (actual fix, related to autofocus)    
  
### **0.7.22** (2021-04-03)  
  
- Merge pull request #225 from InseeFrLab/develop

Develop  
- #215: Autofill options show again for password on Safari (attempt)  
- Reduce size of the logo #215  
- Fix #220: Minio identifiants scripts with spaces    
  
### **0.7.20** (2021-04-03)  
  
- Merge pull request #224 from InseeFrLab/develop

Develop  
- stop using user/info endpoint  
- Implement custom hook for getting public IP  
- Restore language from login back to app    
  
### **0.7.19** (2021-04-02)  
  
- Merge pull request #223 from InseeFrLab/develop

Develop  
- Fix register issues    
  
### **0.7.18** (2021-04-01)  
  
- Merge pull request #222 from InseeFrLab/develop

Develop  
- Fix 500 errors on login pages    
  
### **0.7.17** (2021-04-01)  
  
- Merge pull request #217 from InseeFrLab/develop

Impl #215  
- Projet prefix for bucket  
- Use CSS to style inline SVGs  
- Add note about git LFS in the readme  
- Use LFS in workflow  
- Merge remote-tracking branch 'origin/master' into develop  
- Merge pull request #219 from thieryw/work_on_login

alert messages on login with material-ui    
  

### **0.7.16** (2021-03-31)  
  
- Merge pull request #221 from InseeFrLab/restore_monitoring_links

Restore monitoring links  
- Restore monitoring links    

### **0.7.15** (2021-03-30)  
  
- #211: Python boto3 downloadable config    
  
### **0.7.14** (2021-03-30)  
  
- Merge pull request #218 from InseeFrLab/list_buckets_from_jwt

List buckets from jwt  
- List groups buckets    
  
### **0.7.13** (2021-03-30)  
  
- Merge pull request #216 from InseeFrLab/develop

Fix reset password #215  
- Fix reset password #215    
  
### **0.7.12** (2021-03-29)  
  
- Apply zoom provider to loggin pages    
  
### **0.7.11** (2021-03-29)  
  
- Enable navigate back to the app from login pages    
  
### **0.7.10** (2021-03-29)  
  
- Merge pull request #214 from InseeFrLab/develop

Register form validation  
- Validation on the register page    
  
### **0.7.9** (2021-03-29)  
  
- Merge pull request #213 from InseeFrLab/develop

Login an register for monday 29  
- Login page custom implementation (ongoing)  
- Refactor template  
- Move Header to shared  
- Share header bwn core and keycloak  
- Minimal setup for custom html in login    
  
### **0.7.8** (2021-03-28)  
  
- Fix language selection in login pages    
  
### **0.7.7** (2021-03-28)  
  
- Merge pull request #212 from InseeFrLab/develop

Remove all references to --external-assets  
- Remove all references to --external-assets    
  
### **0.7.6** (2021-03-28)  
  
- Merge pull request #210 from InseeFrLab/develop

Fix font issues  
- Fix Dockerfile.ci  
- Fix ngnix config  
- Make fonts work with keycloakify  
- fix Dockerfile.ci  
- fix Dockerfile.ci  
- fix Dockerfile.ci  
- Update  
- Merge pull request #209 from InseeFrLab/externalizing_components

Fix favicon  
- Fix favicon  
- Fix font issue    
  
## **0.7.5** (2021-03-22)  
  
- Merge pull request #207 from InseeFrLab/externalizing_components

Externalizing components  
- Use https for fonts  
- Restor logo in home  
- Use externally hosted fonts for now  
- Update keycloakify  
- First draft of working kcTheme with only CSS mod  
- Fill onyxia logo with theme color in header  
- Example keycloakify customization only with css  
- Neumorphism background  
- Keycloak theme working with splashcreen  
- Update README.md  
- Keycloak theme working FIXME: splash+ctx restore  
- Cleanup entry point of the app, accomodate for KcApp  
- Update README.md  
- Update README.md  
- Update README.md  
- Fixing remaining bugs with keycloakify and react-envs  
- Refactor  
- Update readme  
- Update react-envs  
- rename app/env.ts to distinguish from src/env.ts  
- Do not test on Windows, takes to long  
- Background color ASAP  
- Update powerhook  
- Update powerhooks  
- Update README  
- Remove legacy env management  
- Update readme  
- Big OPS refactor  
- rename useValueChangeEffect useEffectOnValueChange  
- Do not import KeycloakPromise  
- Implement global variable persistance when redirecting to keycloak  
- Setting up keycloakify  
- Merge remote-tracking branch 'origin/master' into externalizing_components  
- Fixing dead link on home  
- New account page first draft  
- Externalizing the template engine and the custom hooks  
- Remove keyckoak-reack-theming for now  
- Connect SharedServices  
- Connect trainings  
- Redesign (#205)    
  
