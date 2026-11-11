'use client';

export default function SelectField({
  label,
  value,
  values,
  onChange,
  disabled = false,
  getOptionLabel,
  allowCustom = false,
}) {
  const options =
    allowCustom && value && !values.includes(value)
      ? [value, ...values]
      : values;

  return (
    <label className="field">
      <span>{label}</span>
      <select
        value={options.includes(value) ? value : ''}
        onChange={(event) => onChange(event.target.value)}
        disabled={disabled}
      >
        <option value="">Selecione</option>
        {options.map((option) => (
          <option key={option} value={option}>
            {getOptionLabel ? getOptionLabel(option) : option}
          </option>
        ))}
      </select>
    </label>
  );
}
