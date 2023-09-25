This aims to prevent:  
![image](https://user-images.githubusercontent.com/6702424/103154794-66ca4600-479a-11eb-8975-dd4b8f39d2a7.png)
when running `yarn run storybook` and `yarn build` we don't really need fs.

This is just a hack so that [`"minio"`](https://www.npmjs.com/package/minio) wont
prevent storybook from bundling the app although, as stated in [this issue](https://github.com/minio/minio-js/issues/806), `"minio"`
only support node.
