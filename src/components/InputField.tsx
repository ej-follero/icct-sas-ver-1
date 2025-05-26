import { UseFormRegister } from "react-hook-form";

export interface InputFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  register?: UseFormRegister<any>;
}

const InputField = ({ label, error, register, ...props }: InputFieldProps) => {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="block text-sm font-medium text-gray-700">
        {label}
      </label>
      <input
        {...props}
        {...(register ? register(props.name || "") : {})}
        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
      />
      {error && (
        <p className="text-sm text-red-600 bg-red-50 px-3 py-1.5 rounded-lg">
          {error}
        </p>
      )}
    </div>
  );
};

export default InputField;
