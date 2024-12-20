import { FieldApi } from "@tanstack/react-form";
import React from "react";

export const FieldInfo = ({
  field,
}: {
  field: FieldApi<any, any, any, any>;
}) => {
  return (
    <>
      {field.state.meta.errors ? (
        <small className="font-mono text-xs italic text-red-400">
          {field.state.meta.errors}
        </small>
      ) : null}
      {field.state.meta.isValidating ? "Validating..." : null}
    </>
  );
};
