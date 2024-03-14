import { FormControl, FormErrorMessage, Input } from '@node-real/uikit';

type InputTagProps = {
  value: string;
  index: number;
  onChange: (type: string, value: string, index: number) => void;
};
export default function InputTag({ value, index, onChange }: InputTagProps) {
  return (
    <FormControl w={172}>
      <Input value={value} onChange={(e) => onChange('key', e.target.value, index)} />
      <FormErrorMessage>test</FormErrorMessage>
    </FormControl>
  );
}
