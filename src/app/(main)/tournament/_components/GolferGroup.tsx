"use client";

import { Controller, type useForm } from "react-hook-form";
import type { Golfer } from "@prisma/client";
import clsx from "clsx";

/**
 * Form data type for golfer selection
 */
type FormData = {
  groups: { golfers: number[] }[];
};

/**
 * GolferGroup component represents a single group of golfers to select from
 */
export function GolferGroup({
  group,
  groupIndex,
  control,
  watch,
  setValue,
  errors,
}: {
  group: { key: string; golfers: Golfer[] };
  groupIndex: number;
  control: ReturnType<typeof useForm<FormData>>["control"];
  watch: ReturnType<typeof useForm<FormData>>["watch"];
  setValue: ReturnType<typeof useForm<FormData>>["setValue"];
  errors: ReturnType<typeof useForm<FormData>>["formState"]["errors"];
}) {
  const fieldPath = `groups.${groupIndex}.golfers`;
  const selectedGolfers = watch(fieldPath as `groups.${number}.golfers`);
  const groupNumber = group.key.slice(-1);

  return (
    <div className="mb-6 rounded-lg border border-gray-300 bg-gray-50 p-4">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-xl font-semibold">Group {groupNumber}</h3>
        <span className="text-sm text-gray-500">
          Selected: {selectedGolfers.length}/2
        </span>
      </div>

      <div className="mb-4 rounded-md bg-blue-50 p-2 text-sm text-blue-700">
        Select exactly 2 golfers from this group
      </div>

      <div className="flex flex-col gap-2">
        {group.golfers.map((golfer) => (
          <GolferSelection
            key={golfer.apiId}
            golfer={golfer}
            fieldPath={fieldPath as `groups.${number}.golfers`}
            control={control}
            selectedGolfers={selectedGolfers}
            setValue={setValue}
          />
        ))}
      </div>

      {errors.groups?.[groupIndex]?.golfers && (
        <p className="mt-2 text-sm text-red-500">
          {errors.groups[groupIndex].golfers.message}
        </p>
      )}
    </div>
  );
}

/**
 * GolferSelection component represents an individual golfer selection item
 */
function GolferSelection({
  golfer,
  fieldPath,
  control,
  selectedGolfers,
  setValue,
}: {
  golfer: Golfer;
  fieldPath: `groups.${number}.golfers`;
  control: ReturnType<typeof useForm<FormData>>["control"];
  selectedGolfers: number[];
  setValue: ReturnType<typeof useForm<FormData>>["setValue"];
}) {
  const isChecked = selectedGolfers.includes(golfer.apiId);
  const isDisabled = !isChecked && selectedGolfers.length >= 2;

  const handleToggle = () => {
    const updatedGolfers = isChecked
      ? selectedGolfers.filter((id) => id !== golfer?.apiId)
      : [...selectedGolfers, golfer?.apiId];

    setValue(
      fieldPath,
      updatedGolfers.filter((id): id is number => !!id),
    );
  };

  return (
    <label
      className={clsx(
        "flex cursor-pointer items-center gap-3 rounded-lg border p-2 transition-all",
        {
          "border-green-300 bg-green-100 shadow-sm": isChecked,
          "border-gray-300 bg-white hover:bg-gray-50":
            !isChecked && !isDisabled,
          "h-1 cursor-not-allowed border-none opacity-40":
            isDisabled && !isChecked,
        },
      )}
    >
      <Controller
        name={fieldPath}
        control={control}
        render={() => (
          <input
            type="checkbox"
            className="hidden"
            checked={isChecked}
            disabled={isDisabled}
            onChange={handleToggle}
          />
        )}
      />

      <div className="flex w-full items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="rounded-full bg-gray-100 px-2 py-1 font-mono text-xs">
            #{golfer.worldRank ?? "N/A"}
          </span>
          <span className="font-medium">{golfer.playerName}</span>
        </div>
        <span className="rounded-md bg-blue-50 px-2 py-1 text-sm font-medium text-blue-700">
          {golfer.rating}
        </span>
      </div>
    </label>
  );
}
