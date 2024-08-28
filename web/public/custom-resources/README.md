# Custom resources directory

In this directory you can drop the custom resources for your instance.  
To use them in production, create a Zip file with the content of 
this directory and use the `CUSTOM_RESOURCES` environnement
variable. See `.env` file for more infos.

ZIP can be created with this snippet:
```shell
# cd to this directory
zip custom-resources.zip dapla_lang.svg team_add.svg ssb_logo.svg custom.css ssb_logo_lang.svg
```