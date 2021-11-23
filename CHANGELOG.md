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
  
