"use client";

import { useMemo, useState } from "react";
import {
  gameInputFieldPresets,
  defaultRegionServerOptions,
  previewCustomerNo,
  serializeInputFields,
  type GameInputField,
  type GameInputFieldOption,
  type GameInputFieldType,
  type GameInputFieldsConfig,
} from "@/lib/catalog-products/game-input-fields";

type GameInputFieldsEditorProps = {
  initialConfig: GameInputFieldsConfig;
  fieldErrors?: Record<string, string>;
};

const KEY_OPTIONS = [
  { value: "userId", shortLabel: "User ID / UID", hint: "→ customer_target" },
  { value: "zone", shortLabel: "Zone (teks)", hint: "→ customer_target_zone (ML)" },
  { value: "server", shortLabel: "Server (select)", hint: "→ Digiflazz / Melostore server" },
  { value: "custom", shortLabel: "Custom field", hint: "→ additional_data" },
] as const;

type KeyOptionValue = (typeof KEY_OPTIONS)[number]["value"];

function emptyField(): GameInputField {
  return {
    key: "custom_field",
    label: "",
    type: "text",
    placeholder: "",
    required: true,
  };
}

function emptyOption(): GameInputFieldOption {
  return { label: "", value: "" };
}

function resolveKeyOption(key: string): KeyOptionValue {
  if (key === "userId" || key === "zone" || key === "server") return key;
  return "custom";
}

function nextCustomKey(fields: GameInputField[]): string {
  let index = 1;
  while (fields.some((field) => field.key === `field_${index}`)) {
    index += 1;
  }
  return `field_${index}`;
}

function applyPreset(preset: GameInputFieldsConfig): GameInputFieldsConfig {
  return {
    fields: preset.fields.map((field) => ({
      ...field,
      options: field.options ? field.options.map((option) => ({ ...option })) : undefined,
    })),
    ...(preset.targetFormat ? { targetFormat: preset.targetFormat } : {}),
  };
}

export function GameInputFieldsEditor({ initialConfig, fieldErrors }: GameInputFieldsEditorProps) {
  const [fields, setFields] = useState<GameInputField[]>(() =>
    initialConfig.fields.map((field) => ({
      ...field,
      type: field.type === "select" ? "select" : "text",
      options: field.options ? field.options.map((option) => ({ ...option })) : undefined,
    })),
  );
  const [targetFormat, setTargetFormat] = useState(initialConfig.targetFormat ?? "");

  const config: GameInputFieldsConfig = useMemo(
    () => ({
      fields,
      ...(targetFormat.trim() ? { targetFormat: targetFormat.trim() } : {}),
    }),
    [fields, targetFormat],
  );

  const jsonValue = useMemo(() => serializeInputFields(config), [config]);
  const preview = useMemo(() => previewCustomerNo(config), [config]);

  function applyFullPreset(preset: GameInputFieldsConfig) {
    const next = applyPreset(preset);
    setFields(next.fields);
    setTargetFormat(next.targetFormat ?? "");
  }

  function updateField(index: number, patch: Partial<GameInputField>) {
    setFields((current) =>
      current.map((field, fieldIndex) => (fieldIndex === index ? { ...field, ...patch } : field)),
    );
  }

  function updateFieldKey(index: number, option: KeyOptionValue, customKey: string) {
    if (option === "userId") {
      updateField(index, { key: "userId", type: "text", options: undefined });
      return;
    }
    if (option === "zone") {
      updateField(index, { key: "zone", type: "text", options: undefined });
      return;
    }
    if (option === "server") {
      updateField(index, {
        key: "server",
        type: "select",
        label: fields[index]?.label || "Server",
        options:
          fields[index]?.options && fields[index].options!.length > 0
            ? fields[index].options
            : defaultRegionServerOptions.map((row) => ({ ...row })),
      });
      if (!targetFormat.trim()) {
        setTargetFormat("{userId}|{server}");
      }
      return;
    }
    updateField(index, {
      key: customKey.trim() || nextCustomKey(fields),
      type: fields[index]?.type === "select" ? "select" : "text",
    });
  }

  function updateFieldType(index: number, type: GameInputFieldType) {
    if (type === "select") {
      updateField(index, {
        type: "select",
        options:
          fields[index]?.options && fields[index].options!.length > 0
            ? fields[index].options
            : [emptyOption()],
        placeholder: undefined,
      });
      return;
    }
    updateField(index, { type: "text", options: undefined });
  }

  function updateOption(fieldIndex: number, optionIndex: number, patch: Partial<GameInputFieldOption>) {
    setFields((current) =>
      current.map((field, index) => {
        if (index !== fieldIndex) return field;
        const options = [...(field.options ?? [])];
        options[optionIndex] = { ...options[optionIndex], ...patch };
        return { ...field, options };
      }),
    );
  }

  function addOption(fieldIndex: number) {
    setFields((current) =>
      current.map((field, index) =>
        index === fieldIndex
          ? { ...field, options: [...(field.options ?? []), emptyOption()] }
          : field,
      ),
    );
  }

  function removeOption(fieldIndex: number, optionIndex: number) {
    setFields((current) =>
      current.map((field, index) => {
        if (index !== fieldIndex) return field;
        const options = (field.options ?? []).filter((_, i) => i !== optionIndex);
        return { ...field, options };
      }),
    );
  }

  return (
    <div className="console-field console-field--full">
      <div className="console-input-fields-editor">
        <div className="console-input-fields-editor__head">
          <p className="console-field__label">Field Input Pembeli</p>
          <div className="console-input-fields-editor__presets">
            <button
              type="button"
              className="console-btn-ghost console-btn-ghost--compact"
              onClick={() => applyFullPreset(gameInputFieldPresets.userIdOnly)}
            >
              Hanya ID
            </button>
            <button
              type="button"
              className="console-btn-ghost console-btn-ghost--compact"
              onClick={() => applyFullPreset(gameInputFieldPresets.userIdAndZone)}
            >
              ID + Zone
            </button>
            <button
              type="button"
              className="console-btn-ghost console-btn-ghost--compact"
              onClick={() => applyFullPreset(gameInputFieldPresets.userIdAndServer)}
            >
              UID + Server
            </button>
          </div>
        </div>

        <p className="console-field__hint console-input-fields-editor__hint">
          ML / FF: pakai <strong>ID + Zone</strong>. Game region (Genshin, Honkai, dll):{" "}
          <strong>UID + Server</strong> (format Digiflazz <code>UID|Server</code>).
        </p>

        <div className="console-input-fields-editor__list">
          {fields.map((field, index) => {
            const keyOption = resolveKeyOption(field.key);
            const fieldType = field.type === "select" ? "select" : "text";
            const rowError =
              fieldErrors?.[`inputFields.${index}.key`] ??
              fieldErrors?.[`inputFields.${index}.label`] ??
              fieldErrors?.[`inputFields.${index}.options`];

            return (
              <div key={`${field.key}-${index}`} className="console-input-fields-editor__row">
                <div className="console-input-fields-editor__row-grid">
                  <div className="console-field">
                    <label className="console-field__label">Key</label>
                    <select
                      className="console-input w-full"
                      value={keyOption}
                      onChange={(event) =>
                        updateFieldKey(index, event.target.value as KeyOptionValue, field.key)
                      }
                    >
                      {KEY_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value} title={option.hint}>
                          {option.shortLabel}
                        </option>
                      ))}
                    </select>
                    {keyOption === "custom" ? (
                      <input
                        type="text"
                        className="console-input w-full console-input-fields-editor__custom-key"
                        value={field.key}
                        onChange={(event) => updateField(index, { key: event.target.value })}
                        placeholder="field_name"
                      />
                    ) : null}
                  </div>

                  <div className="console-field">
                    <label className="console-field__label">Tipe</label>
                    <select
                      className="console-input w-full"
                      value={fieldType}
                      onChange={(event) =>
                        updateFieldType(index, event.target.value as GameInputFieldType)
                      }
                      disabled={keyOption === "server"}
                    >
                      <option value="text">Teks</option>
                      <option value="select">Select / dropdown</option>
                    </select>
                  </div>

                  <div className="console-field">
                    <label className="console-field__label">Label</label>
                    <input
                      type="text"
                      className="console-input w-full"
                      value={field.label}
                      onChange={(event) => updateField(index, { label: event.target.value })}
                      placeholder="User ID"
                      required
                    />
                  </div>

                  {fieldType === "text" ? (
                    <div className="console-field">
                      <label className="console-field__label">Placeholder</label>
                      <input
                        type="text"
                        className="console-input w-full"
                        value={field.placeholder ?? ""}
                        onChange={(event) => updateField(index, { placeholder: event.target.value })}
                        placeholder="123456789"
                      />
                    </div>
                  ) : (
                    <div className="console-field console-input-fields-editor__required">
                      <label className="console-field__label console-field__label--inline">
                        <input
                          type="checkbox"
                          className="console-checkbox"
                          checked={field.required ?? false}
                          onChange={(event) =>
                            updateField(index, { required: event.target.checked })
                          }
                        />
                        Wajib
                      </label>
                      <button
                        type="button"
                        className="console-btn-ghost console-btn-ghost--danger console-btn-ghost--compact"
                        onClick={() =>
                          setFields((current) => current.filter((_, fieldIndex) => fieldIndex !== index))
                        }
                        disabled={fields.length <= 1}
                        title="Hapus field"
                      >
                        Hapus
                      </button>
                    </div>
                  )}

                  {fieldType === "text" ? (
                    <div className="console-field console-input-fields-editor__required">
                      <label className="console-field__label console-field__label--inline">
                        <input
                          type="checkbox"
                          className="console-checkbox"
                          checked={field.required ?? false}
                          onChange={(event) =>
                            updateField(index, { required: event.target.checked })
                          }
                        />
                        Wajib
                      </label>
                      <button
                        type="button"
                        className="console-btn-ghost console-btn-ghost--danger console-btn-ghost--compact"
                        onClick={() =>
                          setFields((current) => current.filter((_, fieldIndex) => fieldIndex !== index))
                        }
                        disabled={fields.length <= 1}
                        title="Hapus field"
                      >
                        Hapus
                      </button>
                    </div>
                  ) : null}
                </div>

                {fieldType === "select" ? (
                  <div className="console-input-fields-editor__options">
                    <div className="console-input-fields-editor__options-head">
                      <p className="console-field__label">Opsi select</p>
                      <button
                        type="button"
                        className="console-btn-ghost console-btn-ghost--compact"
                        onClick={() => addOption(index)}
                      >
                        + Opsi
                      </button>
                    </div>
                    <div className="console-input-fields-editor__options-list">
                      {(field.options ?? []).map((option, optionIndex) => (
                        <div
                          key={`opt-${index}-${optionIndex}`}
                          className="console-input-fields-editor__option-row"
                        >
                          <input
                            type="text"
                            className="console-input w-full"
                            value={option.label}
                            onChange={(event) =>
                              updateOption(index, optionIndex, { label: event.target.value })
                            }
                            placeholder="Label (Asia)"
                          />
                          <input
                            type="text"
                            className="console-input w-full"
                            value={option.value}
                            onChange={(event) =>
                              updateOption(index, optionIndex, { value: event.target.value })
                            }
                            placeholder="Value ke provider (Asia)"
                          />
                          <button
                            type="button"
                            className="console-btn-ghost console-btn-ghost--danger console-btn-ghost--compact"
                            onClick={() => removeOption(index, optionIndex)}
                            disabled={(field.options?.length ?? 0) <= 1}
                            title="Hapus opsi"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                    <p className="console-field__hint">
                      Label tampil ke pembeli; value yang dikirim ke Digiflazz/Melostore.
                    </p>
                  </div>
                ) : null}

                {rowError ? <p className="console-field__error">{rowError}</p> : null}
              </div>
            );
          })}
        </div>

        <button
          type="button"
          className="console-btn-ghost console-btn-ghost--compact"
          onClick={() => setFields((current) => [...current, emptyField()])}
        >
          + Tambah field
        </button>

        <div className="console-input-fields-editor__format">
          <label htmlFor="targetFormat" className="console-field__label">
            Format nomor tujuan (Digiflazz / provider 1-field)
          </label>
          <input
            id="targetFormat"
            type="text"
            className="console-input w-full"
            value={targetFormat}
            onChange={(event) => setTargetFormat(event.target.value)}
            placeholder="{userId}|{server}"
          />
          <p className="console-field__hint">
            Token dari key field: <code>{"{userId}"}</code>, <code>{"{zone}"}</code>,{" "}
            <code>{"{server}"}</code>. Kosongkan jika Melostore-style (UID & zone terpisah).
          </p>
          {preview ? (
            <p className="console-input-fields-editor__preview">
              Contoh hasil: <code>{preview}</code>
            </p>
          ) : null}
          {fieldErrors?.targetFormat ? (
            <p className="console-field__error">{fieldErrors.targetFormat}</p>
          ) : null}
        </div>

        {fieldErrors?.inputFields ? (
          <p className="console-field__error">{fieldErrors.inputFields}</p>
        ) : null}
      </div>

      <input type="hidden" name="inputFieldsJson" value={jsonValue} readOnly />
    </div>
  );
}
