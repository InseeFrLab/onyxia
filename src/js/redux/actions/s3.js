import * as constantes from "./constantes";

export const newS3Credentials = credentials => ({
  type: constantes.NEW_S3_CREDENTIALS,
  payload: { credentials }
});
