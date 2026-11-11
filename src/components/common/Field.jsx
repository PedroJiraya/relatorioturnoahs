'use client';

export default function Field({
  label,
  value,
  onChange,
  onBlur,
  type = 'text',
  placeholder,
  disabled = false,
  title,
  style,
}) {
  return (
    <label className="field">
      <span>{label}</span>
      {type === 'textarea' ? (
        <textarea
          value={value}
          onChange={(event) => onChange(event.target.value)}
          onBlur={onBlur}
          placeholder={placeholder}
          disabled={disabled}
          title={title}
          style={style}
        />
      ) : (
        <input
          type={type}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          onBlur={onBlur}
          placeholder={placeholder}
          disabled={disabled}
          title={title}
          style={style}
        />
      )}
    </label>
  );
}
