import React from "react";
import { Grid } from "@material-ui/core";
import StringField from "./field-string";
import BooleanField from "./field-boolean";
import NumberField from "./field-number";
import SelectField from "./field-select";
import SelectWarField from "./field-media-war";

export default ({ fields, user, handleChange, name, values, options }) => {
  const champs = fields.map(({ field, path }, i) => {
    if (field["js-control"] && field["js-control"] === "shadow") return null;
    const disabled =
      (field["js-control"] && field["js-control"] === "ro") || false;
    switch (field.type) {
      case "string":
        return field.media && field.media.type && field.media.type === "war" ? (
          <Grid item lg={4} md={6} sm={12} key={i}>
            <SelectWarField
              disabled={disabled}
              handleChange={handleChange}
              user={user}
              path={path}
              value={values[path]}
              {...field}
            />
          </Grid>
        ) : (
          <Grid item lg={4} md={6} sm={12} key={i}>
            <StringField
              disabled={disabled}
              handleChange={handleChange}
              user={user}
              path={path}
              value={values[path]}
              {...field}
            />
          </Grid>
        );
      case "number":
        return (
          <Grid item lg={4} md={6} sm={12} key={i}>
            <NumberField
              disabled={disabled}
              handleChange={handleChange}
              user={user}
              path={path}
              value={values[path]}
              {...field}
            />
          </Grid>
        );
      case "boolean":
        return (
          <Grid item lg={4} md={6} sm={12} key={i}>
            <BooleanField
              disabled={disabled}
              handleChange={handleChange}
              user={user}
              path={path}
              value={values[path]}
              {...field}
            />
          </Grid>
        );
      case "select":
        return (
          <Grid item lg={4} md={6} sm={12} key={i}>
            <SelectField
              disabled={disabled}
              handleChange={handleChange}
              user={user}
              path={path}
              options={options}
              value={values[path]}
              {...field}
            />
          </Grid>
        );
      default:
        return null;
    }
  });
  return (
    <form autoComplete="off" className={name === "monkey" ? "monkey" : "nope"}>
      <Grid container spacing={8} classes={{ container: "formulaire" }}>
        {champs}
      </Grid>
    </form>
  );
};
