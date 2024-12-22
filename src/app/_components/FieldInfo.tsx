import type { FieldApi } from "@tanstack/react-form";
import React from "react";

export const FieldInfo = ({
  field,
}: {
  // eslint-disable-next-line  @typescript-eslint/no-explicit-any
  field: FieldApi<any, any, any, any>;
}) => {
  return (
    <>
      {field.state.meta.errors ? (
        <div className="font-mono text-xs italic text-red-400">
          {field.state.meta.errors}
        </div>
      ) : null}
      {field.state.meta.isValidating ? "Validating..." : null}
    </>
  );
};
